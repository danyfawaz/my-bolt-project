import Pusher from 'pusher';
import config from '../../config/default';
import { logger } from '../utils/logger';
import type { StoredNotification } from '../types';

/**
 * PusherBroadcaster - Server-side Pusher broadcasting
 * Pushes real-time updates to connected browsers
 */
export class PusherBroadcaster {
  private pusher: Pusher | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = config.features.enablePusher;

    if (this.enabled) {
      if (!config.pusher.appId || !config.pusher.key || !config.pusher.secret) {
        logger.warn('Pusher configuration incomplete, disabling Pusher broadcasts');
        this.enabled = false;
        return;
      }

      this.pusher = new Pusher({
        appId: config.pusher.appId,
        key: config.pusher.key,
        secret: config.pusher.secret,
        cluster: config.pusher.cluster,
        useTLS: config.pusher.useTLS,
      });

      logger.info('Pusher broadcaster initialized');
    }
  }

  /**
   * Get the private channel name for a user
   */
  private getUserChannel(userId: string): string {
    return `private-user-${userId}`;
  }

  /**
   * Broadcast a new notification
   */
  async broadcastNew(notification: StoredNotification): Promise<boolean> {
    if (!this.enabled || !this.pusher) return true;

    try {
      await this.pusher.trigger(
        this.getUserChannel(notification.recipient_id),
        'notification:new',
        { notification }
      );

      logger.debug('Broadcast new notification', {
        notification_id: notification.id,
        recipient_id: notification.recipient_id,
      });

      return true;
    } catch (error) {
      logger.error('Failed to broadcast new notification', {
        error: (error as Error).message,
        notification_id: notification.id,
      });
      return false;
    }
  }

  /**
   * Broadcast notification update
   */
  async broadcastUpdated(notification: StoredNotification): Promise<boolean> {
    if (!this.enabled || !this.pusher) return true;

    try {
      await this.pusher.trigger(
        this.getUserChannel(notification.recipient_id),
        'notification:updated',
        { notification }
      );

      return true;
    } catch (error) {
      logger.error('Failed to broadcast notification update', {
        error: (error as Error).message,
        notification_id: notification.id,
      });
      return false;
    }
  }

  /**
   * Broadcast notification deletion
   */
  async broadcastDeleted(recipientId: string, notificationId: string): Promise<boolean> {
    if (!this.enabled || !this.pusher) return true;

    try {
      await this.pusher.trigger(
        this.getUserChannel(recipientId),
        'notification:deleted',
        { notificationId }
      );

      return true;
    } catch (error) {
      logger.error('Failed to broadcast notification deletion', {
        error: (error as Error).message,
        notification_id: notificationId,
      });
      return false;
    }
  }

  /**
   * Broadcast unread count update
   */
  async broadcastCount(recipientId: string, count: number): Promise<boolean> {
    if (!this.enabled || !this.pusher) return true;

    try {
      await this.pusher.trigger(
        this.getUserChannel(recipientId),
        'notification:count',
        { count }
      );

      return true;
    } catch (error) {
      logger.error('Failed to broadcast count', {
        error: (error as Error).message,
        recipient_id: recipientId,
      });
      return false;
    }
  }

  /**
   * Broadcast to multiple users (batch)
   */
  async broadcastToMany(
    recipientIds: string[],
    event: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    if (!this.enabled || !this.pusher) return true;

    const channels = recipientIds.map(id => this.getUserChannel(id));

    // Pusher allows max 100 channels per trigger
    const chunks = this.chunkArray(channels, 100);

    try {
      for (const chunk of chunks) {
        await this.pusher.trigger(chunk, event, data);
      }
      return true;
    } catch (error) {
      logger.error('Failed to broadcast to many', {
        error: (error as Error).message,
        recipient_count: recipientIds.length,
      });
      return false;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const pusherBroadcaster = new PusherBroadcaster();
export default PusherBroadcaster;
