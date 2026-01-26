/*
  # Notifications Schema

  1. New Tables
    - `notifications`
      - Core notification information
      - Tracks notifications sent to users for various events

  2. Security
    - Enable RLS on notifications table
    - Policies for notification viewing and management
*/

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  state text NOT NULL DEFAULT 'unread' CHECK (state IN ('unread', 'read', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = recipient_id);

-- Index for efficient querying by recipient
CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON notifications(recipient_id);

-- Index for efficient querying by state
CREATE INDEX IF NOT EXISTS notifications_state_idx ON notifications(state);
