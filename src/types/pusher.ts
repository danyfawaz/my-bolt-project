import type { Notification } from './notification';

/**
 * Pusher channel pattern for private user notifications
 * Format: private-user-{userId}
 */
export type PusherChannelName = `private-user-${string}`;

/**
 * Pusher event types for real-time notifications (STY-002)
 */
export enum PusherEventType {
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_UPDATED = 'notification:updated',
  NOTIFICATION_DELETED = 'notification:deleted',
  NOTIFICATION_COUNT = 'notification:count',
}

/**
 * Payload for notification:new event
 */
export interface NotificationNewEvent {
  notification: Notification;
}

/**
 * Payload for notification:updated event
 */
export interface NotificationUpdatedEvent {
  notification: Notification;
}

/**
 * Payload for notification:deleted event
 */
export interface NotificationDeletedEvent {
  notificationId: string;
}

/**
 * Payload for notification:count event
 */
export interface NotificationCountEvent {
  count: number;
}

/**
 * Union type of all Pusher notification event payloads
 */
export type PusherNotificationEvent =
  | { type: PusherEventType.NOTIFICATION_NEW; payload: NotificationNewEvent }
  | { type: PusherEventType.NOTIFICATION_UPDATED; payload: NotificationUpdatedEvent }
  | { type: PusherEventType.NOTIFICATION_DELETED; payload: NotificationDeletedEvent }
  | { type: PusherEventType.NOTIFICATION_COUNT; payload: NotificationCountEvent };

/**
 * Pusher connection states
 */
export type PusherConnectionState =
  | 'initialized'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'failed'
  | 'disconnected';

/**
 * Pusher auth request payload
 */
export interface PusherAuthRequest {
  socket_id: string;
  channel_name: string;
}

/**
 * Pusher auth response payload
 */
export interface PusherAuthResponse {
  auth: string;
  channel_data?: string;
}

/**
 * Pusher auth error response
 */
export interface PusherAuthError {
  error: string;
  message?: string;
}
