import { pusher, PusherEvents, getUserChannelName } from '../lib/pusher';
import type { Channel } from 'pusher-js';
import type { Notification } from '../types/notification';

/**
 * Pusher notification event payloads
 */
export interface NotificationNewPayload {
  notification: Notification;
}

export interface NotificationUpdatedPayload {
  notification: Notification;
}

export interface NotificationDeletedPayload {
  notificationId: string;
}

export interface NotificationCountPayload {
  count: number;
}

export type PusherNotificationPayload =
  | NotificationNewPayload
  | NotificationUpdatedPayload
  | NotificationDeletedPayload
  | NotificationCountPayload;

/**
 * Callback types for Pusher events
 */
export interface PusherEventHandlers {
  onNotificationNew?: (payload: NotificationNewPayload) => void;
  onNotificationUpdated?: (payload: NotificationUpdatedPayload) => void;
  onNotificationDeleted?: (payload: NotificationDeletedPayload) => void;
  onNotificationCount?: (payload: NotificationCountPayload) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

/**
 * PusherService - Real-time notification service using Pusher Channels
 * Implements STY-002 specification for private user channels
 */
export class PusherService {
  private channel: Channel | null = null;
  private userId: string | null = null;
  private handlers: PusherEventHandlers = {};

  /**
   * Subscribe to a user's private notification channel
   */
  subscribe(userId: string, handlers: PusherEventHandlers = {}): void {
    // Unsubscribe from previous channel if exists
    if (this.channel) {
      this.unsubscribe();
    }

    this.userId = userId;
    this.handlers = handlers;

    const channelName = getUserChannelName(userId);
    this.channel = pusher.subscribe(channelName);

    // Bind to subscription events
    this.channel.bind('pusher:subscription_succeeded', () => {
      console.log(`Subscribed to channel: ${channelName}`);
      this.handlers.onConnected?.();
    });

    this.channel.bind('pusher:subscription_error', (error: Error) => {
      console.error(`Subscription error for channel: ${channelName}`, error);
      this.handlers.onError?.(error);
    });

    // Bind to notification events
    this.channel.bind(PusherEvents.NOTIFICATION_NEW, (data: NotificationNewPayload) => {
      this.handlers.onNotificationNew?.(data);
    });

    this.channel.bind(PusherEvents.NOTIFICATION_UPDATED, (data: NotificationUpdatedPayload) => {
      this.handlers.onNotificationUpdated?.(data);
    });

    this.channel.bind(PusherEvents.NOTIFICATION_DELETED, (data: NotificationDeletedPayload) => {
      this.handlers.onNotificationDeleted?.(data);
    });

    this.channel.bind(PusherEvents.NOTIFICATION_COUNT, (data: NotificationCountPayload) => {
      this.handlers.onNotificationCount?.(data);
    });
  }

  /**
   * Unsubscribe from the current channel
   */
  unsubscribe(): void {
    if (this.channel && this.userId) {
      const channelName = getUserChannelName(this.userId);
      pusher.unsubscribe(channelName);
      this.channel = null;
      this.userId = null;
      this.handlers = {};
      console.log(`Unsubscribed from channel: ${channelName}`);
      this.handlers.onDisconnected?.();
    }
  }

  /**
   * Update event handlers
   */
  updateHandlers(handlers: Partial<PusherEventHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Check if currently subscribed to a channel
   */
  isSubscribed(): boolean {
    return this.channel !== null;
  }

  /**
   * Get the current user ID
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }

  /**
   * Get the Pusher connection state
   */
  getConnectionState(): string {
    return pusher.connection.state;
  }

  /**
   * Bind to Pusher connection state changes
   */
  onConnectionStateChange(callback: (state: { current: string; previous: string }) => void): void {
    pusher.connection.bind('state_change', callback);
  }

  /**
   * Disconnect from Pusher entirely
   */
  disconnect(): void {
    this.unsubscribe();
    pusher.disconnect();
  }
}

// Export singleton instance
export const pusherService = new PusherService();

export default PusherService;
