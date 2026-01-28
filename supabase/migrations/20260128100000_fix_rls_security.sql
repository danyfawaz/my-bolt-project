-- Migration: Fix RLS Security Issues
-- Date: 2026-01-28
-- Description: Restrict notification INSERT to service_role only, add validation trigger

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Create a more restrictive INSERT policy
-- Only service_role (backend) can insert notifications
CREATE POLICY "Only service role can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    -- Check if the current role is service_role
    -- This ensures only backend services can create notifications
    current_setting('role') = 'service_role'
    OR
    -- Allow authenticated users to create notifications for themselves only
    -- (for edge cases like user-initiated actions)
    (auth.uid() IS NOT NULL AND recipient_id = auth.uid())
  );

-- Create a function to validate notification inserts
CREATE OR REPLACE FUNCTION validate_notification_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify recipient exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.recipient_id) THEN
    RAISE EXCEPTION 'Invalid recipient_id: user does not exist';
  END IF;

  -- Verify actor exists if provided
  IF NEW.actor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.actor_id) THEN
    RAISE EXCEPTION 'Invalid actor_id: user does not exist';
  END IF;

  -- Validate event_type is a known type
  IF NEW.event_type NOT IN (
    'TASK_ASSIGNED', 'TASK_OVERDUE', 'TASK_COMPLETED',
    'SUBMISSION_DUE', 'DELIVERABLE_SUBMITTED',
    'DELIVERABLE_APPROVED', 'DELIVERABLE_REJECTED',
    'COMMENT_ADDED', 'REACTION_ADDED'
  ) THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;

  -- Validate state
  IF NEW.state NOT IN ('unread', 'read', 'actioned', 'archived', 'expired') THEN
    RAISE EXCEPTION 'Invalid state: %', NEW.state;
  END IF;

  -- Validate priority
  IF NEW.priority IS NOT NULL AND NEW.priority NOT IN ('normal', 'high') THEN
    RAISE EXCEPTION 'Invalid priority: %', NEW.priority;
  END IF;

  -- Limit metadata size (10KB max)
  IF NEW.metadata IS NOT NULL AND length(NEW.metadata::text) > 10240 THEN
    RAISE EXCEPTION 'Metadata too large (max 10KB)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS check_notification_insert ON notifications;
CREATE TRIGGER check_notification_insert
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION validate_notification_insert();

-- Add comment explaining the security model
COMMENT ON POLICY "Only service role can insert notifications" ON notifications IS
  'Restricts notification creation to backend services (service_role) or self-notifications';

COMMENT ON FUNCTION validate_notification_insert() IS
  'Validates notification data before insert: checks recipient/actor exist, validates event_type, state, priority, and metadata size';
