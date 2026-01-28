import { NotificationEventType } from './notification';

/**
 * Notification delivery channels
 */
export type NotificationChannel = 'in_app' | 'email' | 'push';

/**
 * Notification categories for grouping events
 */
export type NotificationCategory = 'task_management' | 'deliverable_workflow' | 'collaboration';

/**
 * Mapping of categories to their event types
 */
export const CATEGORY_EVENT_MAP: Record<NotificationCategory, NotificationEventType[]> = {
  task_management: [
    NotificationEventType.TASK_ASSIGNED,
    NotificationEventType.TASK_OVERDUE,
    NotificationEventType.TASK_COMPLETED,
  ],
  deliverable_workflow: [
    NotificationEventType.SUBMISSION_DUE,
    NotificationEventType.DELIVERABLE_SUBMITTED,
    NotificationEventType.DELIVERABLE_APPROVED,
    NotificationEventType.DELIVERABLE_REJECTED,
  ],
  collaboration: [
    NotificationEventType.COMMENT_ADDED,
    NotificationEventType.REACTION_ADDED,
  ],
};

/**
 * Channel preferences for a single event
 */
export interface EventChannelPreferences {
  in_app: boolean;
  email: boolean;
  push: boolean;
}

/**
 * Full notification preferences structure
 */
export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  channels_enabled: Record<NotificationChannel, boolean>;
  event_preferences: Record<string, EventChannelPreferences>;
  category_enabled: Record<NotificationCategory, boolean>;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string;   // HH:MM format
  quiet_hours_timezone: string;
  sound_enabled: boolean;
  sound_volume: number; // 0-100
  created_at?: string;
  updated_at?: string;
}

/**
 * Default preferences for new users
 */
export const DEFAULT_PREFERENCES: NotificationPreferences = {
  channels_enabled: {
    in_app: true,
    email: true,
    push: false,
  },
  event_preferences: {
    [NotificationEventType.TASK_ASSIGNED]: { in_app: true, email: true, push: false },
    [NotificationEventType.TASK_OVERDUE]: { in_app: true, email: true, push: false },
    [NotificationEventType.TASK_COMPLETED]: { in_app: true, email: false, push: false },
    [NotificationEventType.SUBMISSION_DUE]: { in_app: true, email: true, push: false },
    [NotificationEventType.DELIVERABLE_SUBMITTED]: { in_app: true, email: true, push: false },
    [NotificationEventType.DELIVERABLE_APPROVED]: { in_app: true, email: true, push: false },
    [NotificationEventType.DELIVERABLE_REJECTED]: { in_app: true, email: true, push: false },
    [NotificationEventType.COMMENT_ADDED]: { in_app: true, email: false, push: false },
    [NotificationEventType.REACTION_ADDED]: { in_app: true, email: false, push: false },
  },
  category_enabled: {
    task_management: true,
    deliverable_workflow: true,
    collaboration: true,
  },
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  quiet_hours_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  sound_enabled: true,
  sound_volume: 50,
};

/**
 * Human-readable labels for categories
 */
export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  task_management: 'Task Management',
  deliverable_workflow: 'Deliverable Workflow',
  collaboration: 'Collaboration',
};

/**
 * Human-readable labels for event types
 */
export const EVENT_LABELS: Record<string, string> = {
  [NotificationEventType.TASK_ASSIGNED]: 'Task Assigned',
  [NotificationEventType.TASK_OVERDUE]: 'Task Overdue',
  [NotificationEventType.TASK_COMPLETED]: 'Task Completed',
  [NotificationEventType.SUBMISSION_DUE]: 'Submission Due',
  [NotificationEventType.DELIVERABLE_SUBMITTED]: 'Deliverable Submitted',
  [NotificationEventType.DELIVERABLE_APPROVED]: 'Deliverable Approved',
  [NotificationEventType.DELIVERABLE_REJECTED]: 'Deliverable Rejected',
  [NotificationEventType.COMMENT_ADDED]: 'Comment Added',
  [NotificationEventType.REACTION_ADDED]: 'Reaction Added',
};

/**
 * Human-readable labels for channels
 */
export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: 'In-App',
  email: 'Email',
  push: 'Push',
};

/**
 * Channel descriptions for UI
 */
export const CHANNEL_DESCRIPTIONS: Record<NotificationChannel, string> = {
  in_app: 'Notifications in the app',
  email: 'Email notifications',
  push: 'Browser push notifications',
};
