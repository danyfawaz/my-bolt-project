-- Enable Realtime for notifications table
-- This allows clients to subscribe to INSERT, UPDATE, DELETE events

-- Add the notifications table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Also add notification_preferences for real-time preference updates
ALTER PUBLICATION supabase_realtime ADD TABLE notification_preferences;

-- Comment
COMMENT ON TABLE notifications IS 'User notifications with realtime enabled for live updates';
