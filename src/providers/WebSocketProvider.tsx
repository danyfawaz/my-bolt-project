import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { RealtimeChannel, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ChannelSubscription {
  channel: RealtimeChannel;
  refCount: number;
}

interface WebSocketContextValue {
  status: ConnectionStatus;
  user: User | null;
  subscribeToChannel: (
    channelName: string,
    handlers: ChannelHandlers
  ) => () => void;
  subscribeToPrivateChannel: (
    channelName: string,
    handlers: ChannelHandlers
  ) => () => void;
  broadcast: (channelName: string, event: string, payload: unknown) => void;
}

interface ChannelHandlers {
  onBroadcast?: (payload: { event: string; payload: unknown }) => void;
  onPresenceSync?: () => void;
  onPresenceJoin?: (payload: { key: string; newPresences: unknown[] }) => void;
  onPresenceLeave?: (payload: { key: string; leftPresences: unknown[] }) => void;
  onPostgresChanges?: (payload: unknown) => void;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [user, setUser] = useState<User | null>(null);
  const channelsRef = useRef<Map<string, ChannelSubscription>>(new Map());

  // Initialize auth state and listen for changes
  useEffect(() => {
    setStatus('connecting');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setStatus(session ? 'connected' : 'disconnected');
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setStatus(session ? 'connected' : 'disconnected');

      // Clean up all channels on logout
      if (!session) {
        channelsRef.current.forEach((sub) => {
          supabase.removeChannel(sub.channel);
        });
        channelsRef.current.clear();
      }
    });

    // Capture ref value for cleanup
    const channels = channelsRef.current;

    return () => {
      subscription.unsubscribe();
      // Cleanup all channels on unmount
      channels.forEach((sub) => {
        supabase.removeChannel(sub.channel);
      });
      channels.clear();
    };
  }, []);

  // Subscribe to a public channel
  const subscribeToChannel = useCallback(
    (channelName: string, handlers: ChannelHandlers): (() => void) => {
      const existingSub = channelsRef.current.get(channelName);

      if (existingSub) {
        existingSub.refCount++;
        return createUnsubscribe(channelName);
      }

      const channel = supabase.channel(channelName);

      if (handlers.onBroadcast) {
        channel.on('broadcast', { event: '*' }, handlers.onBroadcast);
      }

      if (handlers.onPresenceSync) {
        channel.on('presence', { event: 'sync' }, handlers.onPresenceSync);
      }

      if (handlers.onPresenceJoin) {
        channel.on('presence', { event: 'join' }, handlers.onPresenceJoin);
      }

      if (handlers.onPresenceLeave) {
        channel.on('presence', { event: 'leave' }, handlers.onPresenceLeave);
      }

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to channel: ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to channel: ${channelName}`);
          setStatus('error');
        }
      });

      channelsRef.current.set(channelName, { channel, refCount: 1 });

      return createUnsubscribe(channelName);
    },
    []
  );

  // Subscribe to a private channel with user authentication
  const subscribeToPrivateChannel = useCallback(
    (channelName: string, handlers: ChannelHandlers): (() => void) => {
      if (!user) {
        console.warn(
          'Cannot subscribe to private channel: user not authenticated'
        );
        return () => {};
      }

      // Prefix private channels with user ID for isolation
      const privateChannelName = `private:${user.id}:${channelName}`;
      const existingSub = channelsRef.current.get(privateChannelName);

      if (existingSub) {
        existingSub.refCount++;
        return createUnsubscribe(privateChannelName);
      }

      // Create channel with private configuration
      const channel = supabase.channel(privateChannelName, {
        config: {
          broadcast: { self: true },
          presence: { key: user.id },
        },
      });

      if (handlers.onBroadcast) {
        channel.on('broadcast', { event: '*' }, handlers.onBroadcast);
      }

      if (handlers.onPresenceSync) {
        channel.on('presence', { event: 'sync' }, handlers.onPresenceSync);
      }

      if (handlers.onPresenceJoin) {
        channel.on('presence', { event: 'join' }, handlers.onPresenceJoin);
      }

      if (handlers.onPresenceLeave) {
        channel.on('presence', { event: 'leave' }, handlers.onPresenceLeave);
      }

      if (handlers.onPostgresChanges) {
        // Subscribe to postgres changes filtered by user
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            filter: `recipient_id=eq.${user.id}`,
          },
          handlers.onPostgresChanges
        );
      }

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to private channel: ${privateChannelName}`);
          // Track presence
          channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error(
            `Error subscribing to private channel: ${privateChannelName}`
          );
          setStatus('error');
        }
      });

      channelsRef.current.set(privateChannelName, { channel, refCount: 1 });

      return createUnsubscribe(privateChannelName);
    },
    [user]
  );

  // Helper to create unsubscribe function
  const createUnsubscribe = (channelName: string) => {
    return () => {
      const sub = channelsRef.current.get(channelName);
      if (sub) {
        sub.refCount--;
        if (sub.refCount <= 0) {
          supabase.removeChannel(sub.channel);
          channelsRef.current.delete(channelName);
          console.log(`Unsubscribed from channel: ${channelName}`);
        }
      }
    };
  };

  // Broadcast a message to a channel
  const broadcast = useCallback(
    (channelName: string, event: string, payload: unknown) => {
      const sub = channelsRef.current.get(channelName);
      if (sub) {
        sub.channel.send({
          type: 'broadcast',
          event,
          payload,
        });
      } else {
        console.warn(`Cannot broadcast: channel ${channelName} not found`);
      }
    },
    []
  );

  const value: WebSocketContextValue = {
    status,
    user,
    subscribeToChannel,
    subscribeToPrivateChannel,
    broadcast,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export { WebSocketContext };
export type { WebSocketContextValue, ChannelHandlers };
