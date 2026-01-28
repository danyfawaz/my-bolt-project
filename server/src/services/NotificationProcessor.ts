import { v4 as uuidv4 } from 'uuid';
import { supabaseService } from './SupabaseService';
import { pusherBroadcaster } from './PusherBroadcaster';
import { logger } from '../utils/logger';
import { isInQuietHours } from '../utils/quietHours';
import type {
  NotificationEvent,
  ProcessedNotification,
  StoredNotification,
  UserPreferences,
  NotificationChannel,
  DeliveryResult,
  NotificationDeliveryReport,
} from '../types';

/**
 * NotificationProcessor - Core notification processing logic
 * Handles preferences checking, enrichment, storage, and delivery
 */
export class NotificationProcessor {
  /**
   * Process a single notification event
   */
  async process(event: NotificationEvent): Promise<NotificationDeliveryReport | null> {
    const correlationId = event.correlation_id || uuidv4();
    const log = logger.withCorrelation(correlationId);

    log.info('Processing notification event', {
      event_type: event.event_type,
      recipient_id: event.recipient_id,
    });

    try {
      // 1. Get user preferences
      const preferences = await supabaseService.getUserPreferences(event.recipient_id);
      if (!preferences) {
        log.warn('Could not load user preferences, using defaults');
      }

      // 2. Determine which channels to deliver to
      const channels = this.determineChannels(event, preferences);
      if (channels.length === 0) {
        log.info('No channels enabled for this notification, skipping');
        return null;
      }

      // 3. Check quiet hours (only affects push/sound, not storage)
      const inQuietHours = preferences ? isInQuietHours(preferences) : false;

      // 4. Build processed notification
      const processed: ProcessedNotification = {
        recipient_id: event.recipient_id,
        actor_id: event.actor_id || null,
        event_type: event.event_type,
        resource_ref: event.resource_ref || null,
        metadata: event.metadata || {},
        state: 'unread',
        priority: event.priority || 'normal',
        expires_at: event.expires_at || null,
        correlation_id: correlationId,
      };

      // 5. Store in database (this triggers Supabase Realtime)
      const stored = await supabaseService.createNotification(processed);
      if (!stored) {
        log.error('Failed to store notification');
        return null;
      }

      log.info('Notification stored', { notification_id: stored.id });

      // 6. Deliver to each channel
      const deliveries: DeliveryResult[] = [];

      for (const channel of channels) {
        const result = await this.deliverToChannel(stored, channel, inQuietHours);
        deliveries.push(result);

        // Log delivery result
        await supabaseService.logDelivery(
          stored.id,
          channel,
          result.success,
          result.error
        );
      }

      // 7. Broadcast via Pusher for real-time update
      if (channels.includes('in_app')) {
        await pusherBroadcaster.broadcastNew(stored);
      }

      log.info('Notification processing complete', {
        notification_id: stored.id,
        channels: channels,
        deliveries: deliveries.map(d => ({ channel: d.channel, success: d.success })),
      });

      return {
        notification_id: stored.id,
        recipient_id: event.recipient_id,
        event_type: event.event_type,
        deliveries,
        correlation_id: correlationId,
      };
    } catch (error) {
      log.error('Notification processing failed', {
        error: (error as Error).message,
        event_type: event.event_type,
        recipient_id: event.recipient_id,
      });
      throw error;
    }
  }

  /**
   * Process multiple events in batch
   */
  async processBatch(events: NotificationEvent[]): Promise<NotificationDeliveryReport[]> {
    const results: NotificationDeliveryReport[] = [];

    for (const event of events) {
      try {
        const result = await this.process(event);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        logger.error('Batch processing error for event', {
          error: (error as Error).message,
          event_type: event.event_type,
          recipient_id: event.recipient_id,
        });
      }
    }

    return results;
  }

  /**
   * Determine which channels to deliver to based on preferences
   */
  private determineChannels(
    event: NotificationEvent,
    preferences: UserPreferences | null
  ): NotificationChannel[] {
    // If event specifies channels, use those
    if (event.channels && event.channels.length > 0) {
      return event.channels;
    }

    // If no preferences, use defaults
    if (!preferences) {
      return ['in_app'];
    }

    const channels: NotificationChannel[] = [];
    const eventType = event.event_type;

    // Check each channel
    for (const channel of ['in_app', 'email', 'push'] as NotificationChannel[]) {
      // First check if channel is globally enabled
      if (!preferences.channels_enabled[channel]) {
        continue;
      }

      // Then check event-specific preference
      const eventPrefs = preferences.event_preferences[eventType];
      if (eventPrefs && eventPrefs[channel] === false) {
        continue;
      }

      // Channel is enabled for this event
      channels.push(channel);
    }

    return channels;
  }

  /**
   * Deliver notification to a specific channel
   */
  private async deliverToChannel(
    notification: StoredNotification,
    channel: NotificationChannel,
    inQuietHours: boolean
  ): Promise<DeliveryResult> {
    const result: DeliveryResult = {
      channel,
      success: false,
    };

    try {
      switch (channel) {
        case 'in_app':
          // In-app is handled by database insert + Supabase Realtime
          // Nothing else needed here
          result.success = true;
          result.delivered_at = new Date().toISOString();
          break;

        case 'email':
          // Skip email during quiet hours
          if (inQuietHours) {
            result.success = true;
            result.delivered_at = new Date().toISOString();
            // Could queue for later delivery here
            break;
          }
          result.success = await this.sendEmail(notification);
          if (result.success) {
            result.delivered_at = new Date().toISOString();
          }
          break;

        case 'push':
          // Skip push during quiet hours
          if (inQuietHours) {
            result.success = true;
            break;
          }
          result.success = await this.sendPush(notification);
          if (result.success) {
            result.delivered_at = new Date().toISOString();
          }
          break;
      }
    } catch (error) {
      result.error = (error as Error).message;
      logger.error(`Failed to deliver to ${channel}`, {
        error: result.error,
        notification_id: notification.id,
      });
    }

    return result;
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: StoredNotification): Promise<boolean> {
    // Get user email
    const email = await supabaseService.getUserEmail(notification.recipient_id);
    if (!email) {
      logger.warn('No email found for user', { recipient_id: notification.recipient_id });
      return false;
    }

    // TODO: Implement actual email sending via SendGrid/SES/SMTP
    // For now, just log
    logger.info('Would send email', {
      to: email,
      notification_id: notification.id,
      event_type: notification.event_type,
    });

    return true;
  }

  /**
   * Send push notification
   */
  private async sendPush(notification: StoredNotification): Promise<boolean> {
    // TODO: Implement web push or mobile push
    // This would involve getting push subscriptions from database
    // and sending via web-push library or FCM/APNS
    logger.info('Would send push', {
      notification_id: notification.id,
      event_type: notification.event_type,
    });

    return true;
  }
}

export const notificationProcessor = new NotificationProcessor();
export default NotificationProcessor;
