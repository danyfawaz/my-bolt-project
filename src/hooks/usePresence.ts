import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface PresenceState {
  user_id: string;
  online_at: string;
  [key: string]: unknown;
}

interface UsePresenceOptions {
  channelName: string;
  initialState?: Record<string, unknown>;
}

export function usePresence({ channelName, initialState = {} }: UsePresenceOptions) {
  const { subscribeToPrivateChannel, user, status } = useWebSocket();
  const [presenceState, setPresenceState] = useState<Map<string, PresenceState[]>>(
    new Map()
  );
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user || status !== 'connected') return;

    const unsubscribe = subscribeToPrivateChannel(channelName, {
      onPresenceSync: () => {
        // This would be called when presence syncs
        // The actual state would come from the channel
      },
      onPresenceJoin: ({ key, newPresences }) => {
        setPresenceState((prev) => {
          const next = new Map(prev);
          const existing = next.get(key) || [];
          next.set(key, [...existing, ...(newPresences as PresenceState[])]);
          return next;
        });
        setOnlineUsers((prev) => {
          if (!prev.includes(key)) {
            return [...prev, key];
          }
          return prev;
        });
      },
      onPresenceLeave: ({ key, leftPresences }) => {
        setPresenceState((prev) => {
          const next = new Map(prev);
          const existing = next.get(key) || [];
          const leftIds = (leftPresences as PresenceState[]).map((p) => p.user_id);
          next.set(
            key,
            existing.filter((p) => !leftIds.includes(p.user_id))
          );
          if (next.get(key)?.length === 0) {
            next.delete(key);
          }
          return next;
        });
        setOnlineUsers((prev) => prev.filter((id) => id !== key));
      },
    });

    return unsubscribe;
  }, [channelName, user, status, subscribeToPrivateChannel, initialState]);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.includes(userId),
    [onlineUsers]
  );

  return {
    presenceState,
    onlineUsers,
    isUserOnline,
    currentUserId: user?.id,
  };
}
