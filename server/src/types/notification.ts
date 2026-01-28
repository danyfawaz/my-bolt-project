/**
 * Notification event types that can be received from the platform
 */
export enum NotificationEventType {
  TASK_OVERDUE = 'TASK_OVERDUE',
  SUBMISSION_DUE = 'SUBMISSION_DUE',
  DELIVERABLE_SUBMITTED = 'DELIVERABLE_SUBMITTED',
  DELIVERABLE_APPROVED = 'DELIVERABLE_APPROVED',
  DELIVERABLE_REJECTED = 'DELIVERABLE_REJECTED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  REACTION_ADDED = 'REACTION_ADDED',
}

/**
 * Notification states
 */
export type NotificationState = 'unread' | 'read' | 'actioned' | 'archived' | 'expired';

/**
 * Notification channels
 */
export type NotificationChannel = 'in_app' | 'email' | 'push';

/**
 * Incoming notification event from RabbitMQ/API
 */
export interface NotificationEvent {
  event_type: NotificationEventType;
  recipient_id: string;
  actor_id?: string;
  resource_ref?: string;
  metadata?: Record<string, unknown>;
  // Optional: override delivery channels for this specific event
  channels?: NotificationChannel[];
  // Optional: priority for ordering
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  // Optional: scheduled delivery time
  scheduled_at?: string;
  // Optional: expiry time
  expires_at?: string;
  // Correlation ID for tracing
  correlation_id?: string;
}

/**
 * Processed notification ready for storage
 */
export interface ProcessedNotification {
  recipient_id: string;
  actor_id: string | null;
  event_type: NotificationEventType;
  resource_ref: string | null;
  metadata: Record<string, unknown>;
  state: NotificationState;
  priority: string;
  expires_at: string | null;
  correlation_id: string | null;
}

/**
 * Stored notification from database
 */
export interface StoredNotification extends ProcessedNotification {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * User notification preferences
 */
export interface UserPreferences {
  user_id: string;
  channels_enabled: Record<NotificationChannel, boolean>;
  event_preferences: Record<string, Record<NotificationChannel, boolean>>;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string;
}

/**
 * Delivery result for each channel
 */
export interface DeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
  delivered_at?: string;
}

/**
 * Complete notification delivery report
 */
export interface NotificationDeliveryReport {
  notification_id: string;
  recipient_id: string;
  event_type: NotificationEventType;
  deliveries: DeliveryResult[];
  correlation_id: string | null;
}
