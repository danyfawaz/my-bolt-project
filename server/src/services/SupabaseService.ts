import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../../config/default';
import { logger } from '../utils/logger';
import type {
  ProcessedNotification,
  StoredNotification,
  UserPreferences,
  NotificationChannel,
} from '../types';

/**
 * SupabaseService - Database operations for notifications
 * Uses service role key for server-side operations
 */
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  /**
   * Create a new notification
   */
  async createNotification(notification: ProcessedNotification): Promise<StoredNotification | null> {
    const { data, error } = await this.client
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create notification', {
        error: error.message,
        recipient_id: notification.recipient_id,
        event_type: notification.event_type,
      });
      return null;
    }

    return data as StoredNotification;
  }

  /**
   * Create multiple notifications in batch
   */
  async createNotificationsBatch(notifications: ProcessedNotification[]): Promise<StoredNotification[]> {
    if (notifications.length === 0) return [];

    const { data, error } = await this.client
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      logger.error('Failed to create notifications batch', {
        error: error.message,
        count: notifications.length,
      });
      return [];
    }

    return (data as StoredNotification[]) || [];
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await this.client
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return defaults
        return this.getDefaultPreferences(userId);
      }
      logger.error('Failed to get user preferences', {
        error: error.message,
        user_id: userId,
      });
      return null;
    }

    return data as UserPreferences;
  }

  /**
   * Get default preferences for a user
   */
  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      user_id: userId,
      channels_enabled: {
        in_app: true,
        email: true,
        push: false,
      },
      event_preferences: {},
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      quiet_hours_timezone: 'UTC',
    };
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    const { count, error } = await this.client
      .from('auth.users')
      .select('*', { count: 'exact', head: true })
      .eq('id', userId);

    if (error) {
      // If we can't check, assume user exists to avoid dropping notifications
      logger.warn('Failed to check if user exists', {
        error: error.message,
        user_id: userId,
      });
      return true;
    }

    return (count || 0) > 0;
  }

  /**
   * Get user email for email notifications
   */
  async getUserEmail(userId: string): Promise<string | null> {
    const { data, error } = await this.client
      .rpc('get_user_email', { user_id: userId });

    if (error) {
      logger.error('Failed to get user email', {
        error: error.message,
        user_id: userId,
      });
      return null;
    }

    return data;
  }

  /**
   * Log delivery result
   */
  async logDelivery(
    notificationId: string,
    channel: NotificationChannel,
    success: boolean,
    error?: string
  ): Promise<void> {
    const { error: insertError } = await this.client
      .from('notification_deliveries')
      .insert({
        notification_id: notificationId,
        channel,
        success,
        error_message: error || null,
        delivered_at: success ? new Date().toISOString() : null,
      });

    if (insertError) {
      logger.warn('Failed to log delivery', {
        error: insertError.message,
        notification_id: notificationId,
        channel,
      });
    }
  }
}

export const supabaseService = new SupabaseService();
export default SupabaseService;
