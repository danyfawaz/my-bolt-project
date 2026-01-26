/*
  # STY-001: Enhanced Notifications Schema

  Updates to support the full NotificationService specification:
  1. Add new columns: actor_id, resource_ref, metadata
  2. Expand state enum to include: actioned, expired
  3. Add index for event_type queries
*/

-- Add new columns to notifications table
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resource_ref text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Drop the old state constraint and add the new one with all states
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_state_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_state_check
  CHECK (state IN ('unread', 'read', 'actioned', 'archived', 'expired'));

-- Index for efficient querying by event_type
CREATE INDEX IF NOT EXISTS notifications_event_type_idx ON notifications(event_type);

-- Index for efficient querying by actor_id
CREATE INDEX IF NOT EXISTS notifications_actor_id_idx ON notifications(actor_id);

-- Composite index for common query pattern: recipient + state + created_at
CREATE INDEX IF NOT EXISTS notifications_recipient_state_created_idx
  ON notifications(recipient_id, state, created_at DESC);
