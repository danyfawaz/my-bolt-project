import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { notificationProcessor } from './services/NotificationProcessor';
import type { NotificationEvent } from './types';

/**
 * Notification API Server
 *
 * Alternative to RabbitMQ for direct notification creation via HTTP.
 * Useful for:
 * - Simple integrations without message queue
 * - Testing and development
 * - Webhooks from external services
 */

const app = express();
const PORT = process.env.API_PORT || 3002;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// Simple API key authentication
const API_KEY = process.env.NOTIFICATION_API_KEY || 'dev-api-key';

function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  if (token !== API_KEY) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
}

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-api' });
});

// Create a single notification
app.post('/api/v1/notifications', authenticate, async (req, res) => {
  try {
    const event: NotificationEvent = req.body;

    // Validate required fields
    if (!event.event_type || !event.recipient_id) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['event_type', 'recipient_id'],
      });
      return;
    }

    const result = await notificationProcessor.process(event);

    if (!result) {
      res.status(200).json({
        success: true,
        message: 'Notification skipped (user preferences)',
      });
      return;
    }

    res.status(201).json({
      success: true,
      notification_id: result.notification_id,
      deliveries: result.deliveries,
    });
  } catch (error) {
    logger.error('API error creating notification', {
      error: (error as Error).message,
    });
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Create multiple notifications (batch)
app.post('/api/v1/notifications/batch', authenticate, async (req, res) => {
  try {
    const events: NotificationEvent[] = req.body.notifications;

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({
        error: 'Request body must contain a non-empty "notifications" array',
      });
      return;
    }

    if (events.length > 100) {
      res.status(400).json({
        error: 'Maximum batch size is 100 notifications',
      });
      return;
    }

    const results = await notificationProcessor.processBatch(events);

    res.status(201).json({
      success: true,
      processed: results.length,
      total: events.length,
      results: results.map(r => ({
        notification_id: r.notification_id,
        recipient_id: r.recipient_id,
        event_type: r.event_type,
      })),
    });
  } catch (error) {
    logger.error('API error creating batch notifications', {
      error: (error as Error).message,
    });
    res.status(500).json({ error: 'Failed to create notifications' });
  }
});

// Notify multiple users about the same event
app.post('/api/v1/notifications/broadcast', authenticate, async (req, res) => {
  try {
    const { recipient_ids, ...eventData } = req.body;

    if (!Array.isArray(recipient_ids) || recipient_ids.length === 0) {
      res.status(400).json({
        error: 'Request body must contain a non-empty "recipient_ids" array',
      });
      return;
    }

    if (!eventData.event_type) {
      res.status(400).json({
        error: 'Missing required field: event_type',
      });
      return;
    }

    const events: NotificationEvent[] = recipient_ids.map((recipient_id: string) => ({
      ...eventData,
      recipient_id,
    }));

    const results = await notificationProcessor.processBatch(events);

    res.status(201).json({
      success: true,
      processed: results.length,
      total: recipient_ids.length,
    });
  } catch (error) {
    logger.error('API error broadcasting notifications', {
      error: (error as Error).message,
    });
    res.status(500).json({ error: 'Failed to broadcast notifications' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Notification API server listening on port ${PORT}`);
});
