import { Notification, NotificationEventType } from '../types/notification';

/**
 * Generate a date relative to now
 */
function relativeDate(hoursAgo: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
}

/**
 * Mock notifications for development/demo purposes
 */
export const mockNotifications: Notification[] = [
  // Today - Unread
  {
    id: 'mock-1',
    recipient_id: 'user-1',
    actor_id: 'user-2',
    event_type: NotificationEventType.TASK_ASSIGNED,
    resource_ref: 'task:task-123',
    metadata: {
      taskId: 'task-123',
      taskTitle: 'Review Q4 harvest projections',
    },
    state: 'unread',
    created_at: relativeDate(0.5),
    updated_at: relativeDate(0.5),
  },
  {
    id: 'mock-2',
    recipient_id: 'user-1',
    actor_id: 'user-3',
    event_type: NotificationEventType.DELIVERABLE_SUBMITTED,
    resource_ref: 'deliverable:del-456',
    metadata: {
      deliverableId: 'del-456',
      deliverableTitle: 'Soil analysis report - North Field',
      taskId: 'task-789',
    },
    state: 'unread',
    created_at: relativeDate(2),
    updated_at: relativeDate(2),
  },
  {
    id: 'mock-3',
    recipient_id: 'user-1',
    actor_id: null,
    event_type: NotificationEventType.TASK_OVERDUE,
    resource_ref: 'task:task-111',
    metadata: {
      taskId: 'task-111',
      taskTitle: 'Submit irrigation maintenance schedule',
      dueDate: relativeDate(24),
    },
    state: 'unread',
    created_at: relativeDate(3),
    updated_at: relativeDate(3),
  },

  // Today - Read
  {
    id: 'mock-4',
    recipient_id: 'user-1',
    actor_id: 'user-4',
    event_type: NotificationEventType.COMMENT_ADDED,
    resource_ref: 'task:task-222',
    metadata: {
      taskId: 'task-222',
      taskTitle: 'Equipment inventory update',
    },
    state: 'read',
    created_at: relativeDate(5),
    updated_at: relativeDate(4),
  },

  // Yesterday
  {
    id: 'mock-5',
    recipient_id: 'user-1',
    actor_id: 'user-2',
    event_type: NotificationEventType.DELIVERABLE_APPROVED,
    resource_ref: 'deliverable:del-333',
    metadata: {
      deliverableId: 'del-333',
      deliverableTitle: 'Weekly crop health assessment',
      taskId: 'task-444',
    },
    state: 'read',
    created_at: relativeDate(28),
    updated_at: relativeDate(26),
  },
  {
    id: 'mock-6',
    recipient_id: 'user-1',
    actor_id: null,
    event_type: NotificationEventType.SUBMISSION_DUE,
    resource_ref: 'deliverable:del-555',
    metadata: {
      deliverableId: 'del-555',
      deliverableTitle: 'Pest control application log',
      dueDate: relativeDate(-12),
    },
    state: 'unread',
    created_at: relativeDate(30),
    updated_at: relativeDate(30),
  },
  {
    id: 'mock-7',
    recipient_id: 'user-1',
    actor_id: 'user-5',
    event_type: NotificationEventType.TASK_COMPLETED,
    resource_ref: 'task:task-666',
    metadata: {
      taskId: 'task-666',
      taskTitle: 'Greenhouse temperature calibration',
    },
    state: 'read',
    created_at: relativeDate(32),
    updated_at: relativeDate(31),
  },

  // This Week
  {
    id: 'mock-8',
    recipient_id: 'user-1',
    actor_id: 'user-3',
    event_type: NotificationEventType.DELIVERABLE_REJECTED,
    resource_ref: 'deliverable:del-777',
    metadata: {
      deliverableId: 'del-777',
      deliverableTitle: 'Water quality test results',
      taskId: 'task-888',
    },
    state: 'read',
    created_at: relativeDate(72),
    updated_at: relativeDate(70),
  },
  {
    id: 'mock-9',
    recipient_id: 'user-1',
    actor_id: 'user-6',
    event_type: NotificationEventType.REACTION_ADDED,
    resource_ref: 'task:task-999',
    metadata: {
      taskId: 'task-999',
      taskTitle: 'New seed variety trial proposal',
    },
    state: 'read',
    created_at: relativeDate(96),
    updated_at: relativeDate(96),
  },

  // Earlier
  {
    id: 'mock-10',
    recipient_id: 'user-1',
    actor_id: 'user-2',
    event_type: NotificationEventType.TASK_ASSIGNED,
    resource_ref: 'task:task-1010',
    metadata: {
      taskId: 'task-1010',
      taskTitle: 'Annual equipment maintenance planning',
    },
    state: 'read',
    created_at: relativeDate(240),
    updated_at: relativeDate(238),
  },
  {
    id: 'mock-11',
    recipient_id: 'user-1',
    actor_id: 'user-4',
    event_type: NotificationEventType.DELIVERABLE_SUBMITTED,
    resource_ref: 'deliverable:del-1111',
    metadata: {
      deliverableId: 'del-1111',
      deliverableTitle: 'Fertilizer usage report - Season 3',
      taskId: 'task-1212',
    },
    state: 'read',
    created_at: relativeDate(360),
    updated_at: relativeDate(358),
  },
];

/**
 * Get mock unread count
 */
export function getMockUnreadCount(): number {
  return mockNotifications.filter((n) => n.state === 'unread').length;
}
