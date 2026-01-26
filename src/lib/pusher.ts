import Pusher from 'pusher-js';
import { supabase } from './supabase';

const pusherKey = import.meta.env.VITE_PUSHER_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!pusherKey || !pusherCluster) {
  console.warn('Pusher environment variables not configured. Real-time features may be limited.');
}

// Derive the Supabase functions URL from the Supabase URL
const functionsUrl = supabaseUrl
  ? supabaseUrl.replace('.supabase.co', '.supabase.co/functions/v1')
  : '';

/**
 * Pusher client instance configured for private channel authentication
 * Channel pattern: private-user-{userId}
 * Events: notification:new, notification:updated, notification:deleted, notification:count
 */
export const pusher = new Pusher(pusherKey || '', {
  cluster: pusherCluster || 'us2',
  authorizer: (channel) => ({
    authorize: async (socketId, callback) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          callback(new Error('User not authenticated'), null);
          return;
        }

        const response = await fetch(`${functionsUrl}/pusher-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          callback(new Error(error.message || 'Authorization failed'), null);
          return;
        }

        const authData = await response.json();
        callback(null, authData);
      } catch (error) {
        callback(error as Error, null);
      }
    },
  }),
});

/**
 * Pusher event types for notifications
 */
export const PusherEvents = {
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_UPDATED: 'notification:updated',
  NOTIFICATION_DELETED: 'notification:deleted',
  NOTIFICATION_COUNT: 'notification:count',
} as const;

export type PusherEventType = typeof PusherEvents[keyof typeof PusherEvents];

/**
 * Get the private channel name for a user
 */
export function getUserChannelName(userId: string): string {
  return `private-user-${userId}`;
}

export default pusher;
