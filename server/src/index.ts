import http from 'http';
import config from '../config/default';
import { logger } from './utils/logger';
import { rabbitMQConsumer } from './consumers/RabbitMQConsumer';

/**
 * Notification Worker Entry Point
 *
 * This worker service:
 * 1. Connects to RabbitMQ and consumes notification events
 * 2. Processes notifications (checks preferences, enriches)
 * 3. Stores in Supabase (triggers Realtime to browsers)
 * 4. Broadcasts via Pusher for redundant real-time delivery
 * 5. Sends emails/push as configured
 */

// Health check server
function startHealthServer(): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      const status = rabbitMQConsumer.getStatus();
      const metrics = rabbitMQConsumer.getMetrics();
      const healthy = status === 'consuming';

      res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: healthy ? 'healthy' : 'unhealthy',
        consumer_status: status,
        metrics,
      }));
    } else if (req.url === '/metrics') {
      const metrics = rabbitMQConsumer.getMetrics();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metrics));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(config.worker.healthCheckPort, () => {
    logger.info(`Health check server listening on port ${config.worker.healthCheckPort}`);
  });

  return server;
}

// Graceful shutdown handler
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await rabbitMQConsumer.stop();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: (error as Error).message });
    process.exit(1);
  }
}

// Main entry point
async function main(): Promise<void> {
  logger.info('Starting Notification Worker', {
    rabbitmq_queue: config.rabbitmq.queue,
    pusher_enabled: config.features.enablePusher,
    email_enabled: config.features.enableEmail,
  });

  // Start health check server
  const healthServer = startHealthServer();

  // Setup signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
  });

  try {
    // Start the RabbitMQ consumer
    await rabbitMQConsumer.start();
    logger.info('Notification Worker is running');
  } catch (error) {
    logger.error('Failed to start worker', { error: (error as Error).message });
    healthServer.close();
    process.exit(1);
  }
}

main();
