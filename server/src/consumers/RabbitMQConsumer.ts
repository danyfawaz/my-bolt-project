import amqp, { ConsumeMessage, ChannelModel, Channel } from 'amqplib';
import config from '../../config/default';
import { logger } from '../utils/logger';
import { notificationProcessor } from '../services/NotificationProcessor';
import type {
  RabbitMQMessage,
  ConsumerStatus,
  ConsumerMetrics,
  NotificationEvent,
} from '../types';

/**
 * RabbitMQConsumer - Consumes notification events from RabbitMQ
 * Implements reliable message processing with retries and dead-letter handling
 */
export class RabbitMQConsumer {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private status: ConsumerStatus = 'idle';
  private startTime: Date = new Date();
  private metrics: ConsumerMetrics = {
    messages_received: 0,
    messages_processed: 0,
    messages_failed: 0,
    messages_requeued: 0,
    last_message_at: null,
    uptime_seconds: 0,
  };

  /**
   * Start the consumer
   */
  async start(): Promise<void> {
    if (this.status === 'connected' || this.status === 'consuming') {
      logger.warn('Consumer already running');
      return;
    }

    this.status = 'connecting';
    this.startTime = new Date();

    try {
      await this.connect();
      await this.setupQueues();
      await this.consume();

      logger.info('RabbitMQ consumer started successfully', {
        queue: config.rabbitmq.queue,
        exchange: config.rabbitmq.exchange,
      });
    } catch (error) {
      this.status = 'error';
      logger.error('Failed to start RabbitMQ consumer', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Stop the consumer gracefully
   */
  async stop(): Promise<void> {
    logger.info('Stopping RabbitMQ consumer...');

    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.status = 'closed';
      logger.info('RabbitMQ consumer stopped');
    } catch (error) {
      logger.error('Error stopping consumer', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get current consumer status
   */
  getStatus(): ConsumerStatus {
    return this.status;
  }

  /**
   * Get consumer metrics
   */
  getMetrics(): ConsumerMetrics {
    return {
      ...this.metrics,
      uptime_seconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
    };
  }

  /**
   * Connect to RabbitMQ
   */
  private async connect(): Promise<void> {
    this.connection = await amqp.connect(config.rabbitmq.url);

    this.connection.on('error', (error) => {
      logger.error('RabbitMQ connection error', { error: error.message });
      this.status = 'error';
    });

    this.connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      if (this.status !== 'closed') {
        this.status = 'error';
        this.reconnect();
      }
    });

    this.channel = await this.connection.createChannel();
    await this.channel.prefetch(config.rabbitmq.prefetch);

    this.status = 'connected';
    logger.info('Connected to RabbitMQ');
  }

  /**
   * Reconnect with exponential backoff
   */
  private async reconnect(attempt = 1): Promise<void> {
    const maxAttempts = config.rabbitmq.retryAttempts;
    const delay = config.rabbitmq.retryDelay * Math.pow(2, attempt - 1);

    if (attempt > maxAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    logger.info(`Reconnecting to RabbitMQ in ${delay}ms (attempt ${attempt}/${maxAttempts})`);

    setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        await this.reconnect(attempt + 1);
      }
    }, delay);
  }

  /**
   * Setup exchanges and queues
   */
  private async setupQueues(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    const { exchange, queue, routingKey } = config.rabbitmq;

    // Main exchange (topic for flexible routing)
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    // Dead letter exchange for failed messages
    if (config.features.enableDeadLetterQueue) {
      await this.channel.assertExchange(`${exchange}.dlx`, 'direct', { durable: true });
      await this.channel.assertQueue(`${queue}.dlq`, { durable: true });
      await this.channel.bindQueue(`${queue}.dlq`, `${exchange}.dlx`, queue);
    }

    // Main queue with dead letter configuration
    const queueOptions: amqp.Options.AssertQueue = {
      durable: true,
      arguments: config.features.enableDeadLetterQueue
        ? {
            'x-dead-letter-exchange': `${exchange}.dlx`,
            'x-dead-letter-routing-key': queue,
          }
        : undefined,
    };

    await this.channel.assertQueue(queue, queueOptions);
    await this.channel.bindQueue(queue, exchange, routingKey);

    logger.info('Queues and exchanges configured', { exchange, queue, routingKey });
  }

  /**
   * Start consuming messages
   */
  private async consume(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    this.status = 'consuming';

    await this.channel.consume(
      config.rabbitmq.queue,
      async (msg) => {
        if (!msg) return;

        this.metrics.messages_received++;
        this.metrics.last_message_at = new Date().toISOString();

        try {
          await this.handleMessage(msg);
          this.channel?.ack(msg);
          this.metrics.messages_processed++;
        } catch (error) {
          await this.handleFailure(msg, error as Error);
        }
      },
      { noAck: false }
    );

    logger.info('Consumer started listening for messages');
  }

  /**
   * Handle an incoming message
   */
  private async handleMessage(msg: ConsumeMessage): Promise<void> {
    const content = msg.content.toString();
    let message: RabbitMQMessage;

    try {
      message = JSON.parse(content) as RabbitMQMessage;
    } catch (error) {
      logger.error('Failed to parse message', { content });
      throw new Error('Invalid message format');
    }

    // Validate message format
    if (message.type !== 'notification' || !message.payload) {
      throw new Error('Invalid message type or missing payload');
    }

    const event = message.payload as NotificationEvent;

    // Validate required fields
    if (!event.event_type || !event.recipient_id) {
      throw new Error('Missing required fields: event_type or recipient_id');
    }

    // Process the notification
    await notificationProcessor.process(event);
  }

  /**
   * Handle message processing failure
   */
  private async handleFailure(msg: ConsumeMessage, error: Error): Promise<void> {
    const retryCount = (msg.properties.headers?.['x-retry-count'] as number) || 0;

    if (retryCount < config.rabbitmq.retryAttempts) {
      // Requeue with retry count
      logger.warn('Requeuing message after failure', {
        error: error.message,
        retry_count: retryCount + 1,
      });

      this.channel?.nack(msg, false, false); // Don't requeue directly

      // Republish with incremented retry count
      const headers = {
        ...msg.properties.headers,
        'x-retry-count': retryCount + 1,
        'x-last-error': error.message,
        'x-last-retry-at': new Date().toISOString(),
      };

      // Delay before retry
      setTimeout(() => {
        this.channel?.publish(
          config.rabbitmq.exchange,
          msg.fields.routingKey,
          msg.content,
          { headers, persistent: true }
        );
      }, config.rabbitmq.retryDelay);

      this.metrics.messages_requeued++;
    } else {
      // Max retries exceeded, send to DLQ
      logger.error('Message processing failed permanently', {
        error: error.message,
        retry_count: retryCount,
      });

      this.channel?.nack(msg, false, false);
      this.metrics.messages_failed++;
    }
  }
}

export const rabbitMQConsumer = new RabbitMQConsumer();
export default RabbitMQConsumer;
