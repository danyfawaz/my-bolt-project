import 'dotenv/config';
import type { RabbitMQConfig } from '../src/types';

export const config = {
  // RabbitMQ configuration
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'notifications',
    queue: process.env.RABBITMQ_QUEUE || 'notification-worker',
    routingKey: process.env.RABBITMQ_ROUTING_KEY || 'notification.#',
    prefetch: parseInt(process.env.RABBITMQ_PREFETCH || '10', 10),
    retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || '5000', 10),
  } as RabbitMQConfig,

  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Pusher configuration (optional)
  pusher: {
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || 'us2',
    useTLS: true,
  },

  // Email configuration (optional - for email channel)
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid', // sendgrid, ses, smtp
    apiKey: process.env.EMAIL_API_KEY || '',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'notifications@example.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Grower Platform',
  },

  // Worker configuration
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    batchSize: parseInt(process.env.WORKER_BATCH_SIZE || '100', 10),
    healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT || '3001', 10),
  },

  // Feature flags
  features: {
    enablePusher: process.env.ENABLE_PUSHER === 'true',
    enableEmail: process.env.ENABLE_EMAIL === 'true',
    enablePush: process.env.ENABLE_PUSH === 'true',
    enableDeadLetterQueue: process.env.ENABLE_DLQ !== 'false',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production',
  },
};

export default config;
