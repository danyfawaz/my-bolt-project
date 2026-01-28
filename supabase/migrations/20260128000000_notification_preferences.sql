-- Notification Preferences Table
-- Stores user notification preferences with JSONB for flexibility

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Channel enablement (global toggle for each delivery channel)
  channels_enabled JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "push": false}'::jsonb,

  -- Per-event preferences (maps event type to channel preferences)
  event_preferences JSONB NOT NULL DEFAULT '{
    "TASK_ASSIGNED": {"in_app": true, "email": true, "push": false},
    "TASK_OVERDUE": {"in_app": true, "email": true, "push": false},
    "TASK_COMPLETED": {"in_app": true, "email": false, "push": false},
    "SUBMISSION_DUE": {"in_app": true, "email": true, "push": false},
    "DELIVERABLE_SUBMITTED": {"in_app": true, "email": true, "push": false},
    "DELIVERABLE_APPROVED": {"in_app": true, "email": true, "push": false},
    "DELIVERABLE_REJECTED": {"in_app": true, "email": true, "push": false},
    "COMMENT_ADDED": {"in_app": true, "email": false, "push": false},
    "REACTION_ADDED": {"in_app": true, "email": false, "push": false}
  }'::jsonb,

  -- Category enablement (quick toggle for categories)
  category_enabled JSONB NOT NULL DEFAULT '{"task_management": true, "deliverable_workflow": true, "collaboration": true}'::jsonb,

  -- Quiet hours configuration
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME NOT NULL DEFAULT '22:00:00',
  quiet_hours_end TIME NOT NULL DEFAULT '07:00:00',
  quiet_hours_timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Sound settings
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  sound_volume INTEGER NOT NULL DEFAULT 50 CHECK (sound_volume >= 0 AND sound_volume <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
  ON notification_preferences(user_id);

-- RLS Policies: Users can only access their own preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON notification_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-create preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create preferences when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Comment on table
COMMENT ON TABLE notification_preferences IS 'User notification preferences with per-channel and per-event settings';

-- ============================================
-- Notification Deliveries Table
-- Tracks delivery status for each channel
-- ============================================

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push')),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One delivery record per notification per channel
  UNIQUE(notification_id, channel)
);

-- Index for querying delivery status
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id
  ON notification_deliveries(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_channel_success
  ON notification_deliveries(channel, success);

-- RLS for notification_deliveries
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by worker)
-- No user policies needed as users don't directly access this table

-- ============================================
-- Add columns to notifications table
-- ============================================

-- Add priority and correlation_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'priority'
  ) THEN
    ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'correlation_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN correlation_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Function to get user email (for notification worker)
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
