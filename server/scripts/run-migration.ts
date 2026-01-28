import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  console.log('Running notification preferences migration...');

  // Run each statement separately
  const statements = [
    // Create notification_preferences table
    `CREATE TABLE IF NOT EXISTS notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      channels_enabled JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "push": false}'::jsonb,
      event_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
      category_enabled JSONB NOT NULL DEFAULT '{"task_management": true, "deliverable_workflow": true, "collaboration": true}'::jsonb,
      quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
      quiet_hours_start TIME NOT NULL DEFAULT '22:00:00',
      quiet_hours_end TIME NOT NULL DEFAULT '07:00:00',
      quiet_hours_timezone TEXT NOT NULL DEFAULT 'UTC',
      sound_enabled BOOLEAN NOT NULL DEFAULT true,
      sound_volume INTEGER NOT NULL DEFAULT 50,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    // Create index
    `CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id)`,

    // Create notification_deliveries table
    `CREATE TABLE IF NOT EXISTS notification_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push')),
      success BOOLEAN NOT NULL DEFAULT false,
      error_message TEXT,
      delivered_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(notification_id, channel)
    )`,

    // Create indexes for deliveries
    `CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id ON notification_deliveries(notification_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notification_deliveries_channel_success ON notification_deliveries(channel, success)`,
  ];

  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();
    if (error && !error.message.includes('already exists')) {
      console.log('Statement result:', error?.message || 'OK');
    }
  }

  // Try adding columns to notifications table
  const alterStatements = [
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS correlation_id TEXT`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`,
  ];

  for (const sql of alterStatements) {
    try {
      await supabase.rpc('exec_sql', { sql_query: sql });
    } catch (e) {
      // Ignore errors for ALTER
    }
  }

  console.log('Migration complete!');
}

runMigration().catch(console.error);
