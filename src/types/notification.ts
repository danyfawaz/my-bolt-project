export interface Notification {
  id: string;
  recipient_id: string;
  event_type: string;
  state: 'unread' | 'read' | 'archived';
  created_at: string;
  updated_at: string;
}
