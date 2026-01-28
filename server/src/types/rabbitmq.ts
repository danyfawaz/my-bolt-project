import type { NotificationEvent } from './notification';

/**
 * RabbitMQ connection configuration
 */
export interface RabbitMQConfig {
  url: string;
  exchange: string;
  queue: string;
  routingKey: string;
  prefetch: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * RabbitMQ message envelope
 */
export interface RabbitMQMessage {
  type: 'notification';
  version: '1.0';
  timestamp: string;
  payload: NotificationEvent;
}

/**
 * Dead letter message for failed processing
 */
export interface DeadLetterMessage {
  original_message: RabbitMQMessage;
  error: string;
  failed_at: string;
  attempt_count: number;
}

/**
 * Consumer status
 */
export type ConsumerStatus = 'idle' | 'connecting' | 'connected' | 'consuming' | 'error' | 'closed';

/**
 * Consumer metrics
 */
export interface ConsumerMetrics {
  messages_received: number;
  messages_processed: number;
  messages_failed: number;
  messages_requeued: number;
  last_message_at: string | null;
  uptime_seconds: number;
}
