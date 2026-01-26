/**
 * Notification states as per STY-001 specification
 */
export type NotificationState = 'unread' | 'read' | 'actioned' | 'archived' | 'expired';

/**
 * Event type registry for notifications
 * These events trigger notification creation
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
 * Metadata structure for different event types
 */
export interface NotificationMetadata {
  taskId?: string;
  taskTitle?: string;
  deliverableId?: string;
  deliverableTitle?: string;
  revisionId?: string;
  commentId?: string;
  dueDate?: string;
  [key: string]: unknown;
}

/**
 * Core notification interface as per STY-001 specification
 */
export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  event_type: NotificationEventType | string;
  resource_ref: string | null;
  metadata: NotificationMetadata;
  state: NotificationState;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new notification
 */
export interface CreateNotificationInput {
  recipient_id: string;
  actor_id?: string;
  event_type: NotificationEventType | string;
  resource_ref?: string;
  metadata?: NotificationMetadata;
}

/**
 * Input for updating a notification
 */
export interface UpdateNotificationInput {
  state?: NotificationState;
  metadata?: NotificationMetadata;
}
