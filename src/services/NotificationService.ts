import { supabase } from '../lib/supabase';
import type {
  Notification,
  NotificationState,
  CreateNotificationInput,
  UpdateNotificationInput,
} from '../types/notification';
import { NotificationEventType } from '../types/notification';

/**
 * NotificationService - Centralized service for managing notifications
 * Implements STY-001 specification with non-blocking execution model
 */
export class NotificationService {
  /**
   * Create a new notification (non-blocking)
   * Returns a promise but can be called without await for fire-and-forget behavior
   */
  static async create(input: CreateNotificationInput): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: input.recipient_id,
        actor_id: input.actor_id || null,
        event_type: input.event_type,
        resource_ref: input.resource_ref || null,
        metadata: input.metadata || {},
        state: 'unread',
      })
      .select()
      .single();

    if (error) {
      console.error('NotificationService.create error:', error);
      return null;
    }

    return data as Notification;
  }

  /**
   * Create a notification without blocking (fire-and-forget)
   * Errors are logged but not thrown
   */
  static createAsync(input: CreateNotificationInput): void {
    this.create(input).catch((error) => {
      console.error('NotificationService.createAsync error:', error);
    });
  }

  /**
   * Create multiple notifications in batch (non-blocking)
   */
  static async createBatch(inputs: CreateNotificationInput[]): Promise<Notification[]> {
    const records = inputs.map((input) => ({
      recipient_id: input.recipient_id,
      actor_id: input.actor_id || null,
      event_type: input.event_type,
      resource_ref: input.resource_ref || null,
      metadata: input.metadata || {},
      state: 'unread' as NotificationState,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(records)
      .select();

    if (error) {
      console.error('NotificationService.createBatch error:', error);
      return [];
    }

    return (data as Notification[]) || [];
  }

  /**
   * Get a notification by ID
   */
  static async getById(id: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('NotificationService.getById error:', error);
      return null;
    }

    return data as Notification;
  }

  /**
   * Get notifications for a recipient with optional filters
   */
  static async getByRecipient(
    recipientId: string,
    options: {
      state?: NotificationState;
      eventType?: NotificationEventType | string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false });

    if (options.state) {
      query = query.eq('state', options.state);
    }

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('NotificationService.getByRecipient error:', error);
      return [];
    }

    return (data as Notification[]) || [];
  }

  /**
   * Update a notification's state or metadata
   */
  static async update(
    id: string,
    input: UpdateNotificationInput
  ): Promise<Notification | null> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.state) {
      updateData.state = input.state;
    }

    if (input.metadata) {
      updateData.metadata = input.metadata;
    }

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('NotificationService.update error:', error);
      return null;
    }

    return data as Notification;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: string): Promise<Notification | null> {
    return this.update(id, { state: 'read' });
  }

  /**
   * Mark a notification as unread
   */
  static async markAsUnread(id: string): Promise<Notification | null> {
    return this.update(id, { state: 'unread' });
  }

  /**
   * Mark a notification as actioned (user took action on the notification)
   */
  static async markAsActioned(id: string): Promise<Notification | null> {
    return this.update(id, { state: 'actioned' });
  }

  /**
   * Archive a notification
   */
  static async archive(id: string): Promise<Notification | null> {
    return this.update(id, { state: 'archived' });
  }

  /**
   * Mark a notification as expired
   */
  static async markAsExpired(id: string): Promise<Notification | null> {
    return this.update(id, { state: 'expired' });
  }

  /**
   * Mark all unread notifications as read for a recipient
   */
  static async markAllAsRead(recipientId: string): Promise<number> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ state: 'read', updated_at: new Date().toISOString() })
      .eq('recipient_id', recipientId)
      .eq('state', 'unread')
      .select();

    if (error) {
      console.error('NotificationService.markAllAsRead error:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Delete a notification
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('NotificationService.delete error:', error);
      return false;
    }

    return true;
  }

  /**
   * Get unread count for a recipient
   */
  static async getUnreadCount(recipientId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', recipientId)
      .eq('state', 'unread');

    if (error) {
      console.error('NotificationService.getUnreadCount error:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Helper: Notify about task overdue
   */
  static notifyTaskOverdue(
    recipientId: string,
    actorId: string | undefined,
    taskId: string,
    taskTitle: string,
    dueDate: string
  ): void {
    this.createAsync({
      recipient_id: recipientId,
      actor_id: actorId,
      event_type: NotificationEventType.TASK_OVERDUE,
      resource_ref: `task:${taskId}`,
      metadata: { taskId, taskTitle, dueDate },
    });
  }

  /**
   * Helper: Notify about submission due
   */
  static notifySubmissionDue(
    recipientId: string,
    deliverableId: string,
    deliverableTitle: string,
    dueDate: string
  ): void {
    this.createAsync({
      recipient_id: recipientId,
      event_type: NotificationEventType.SUBMISSION_DUE,
      resource_ref: `deliverable:${deliverableId}`,
      metadata: { deliverableId, deliverableTitle, dueDate },
    });
  }

  /**
   * Helper: Notify about deliverable submission
   */
  static notifyDeliverableSubmitted(
    recipientId: string,
    actorId: string,
    deliverableId: string,
    deliverableTitle: string,
    taskId: string
  ): void {
    this.createAsync({
      recipient_id: recipientId,
      actor_id: actorId,
      event_type: NotificationEventType.DELIVERABLE_SUBMITTED,
      resource_ref: `deliverable:${deliverableId}`,
      metadata: { deliverableId, deliverableTitle, taskId },
    });
  }

  /**
   * Helper: Notify about task assignment
   */
  static notifyTaskAssigned(
    recipientId: string,
    actorId: string,
    taskId: string,
    taskTitle: string
  ): void {
    this.createAsync({
      recipient_id: recipientId,
      actor_id: actorId,
      event_type: NotificationEventType.TASK_ASSIGNED,
      resource_ref: `task:${taskId}`,
      metadata: { taskId, taskTitle },
    });
  }
}

export default NotificationService;
