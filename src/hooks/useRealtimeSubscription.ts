import { useEffect, useCallback, useState } from 'react';
import { useWebSocket } from './useWebSocket';

interface RealtimeEvent<T = unknown> {
  event: string;
  payload: T;
}

interface UseRealtimeSubscriptionOptions {
  channelName: string;
  isPrivate?: boolean;
  onMessage?: (event: RealtimeEvent) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  channelName,
  isPrivate = false,
  onMessage,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const { subscribeToChannel, subscribeToPrivateChannel, broadcast, status } =
    useWebSocket();
  const [lastMessage, setLastMessage] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    if (!enabled || !channelName) return;

    const handleBroadcast = (payload: { event: string; payload: unknown }) => {
      const event: RealtimeEvent = {
        event: payload.event,
        payload: payload.payload,
      };
      setLastMessage(event);
      onMessage?.(event);
    };

    const subscribe = isPrivate ? subscribeToPrivateChannel : subscribeToChannel;
    const unsubscribe = subscribe(channelName, {
      onBroadcast: handleBroadcast,
    });

    return unsubscribe;
  }, [
    channelName,
    isPrivate,
    onMessage,
    enabled,
    subscribeToChannel,
    subscribeToPrivateChannel,
  ]);

  const sendMessage = useCallback(
    (event: string, payload: unknown) => {
      const fullChannelName = isPrivate
        ? `private:${channelName}`
        : channelName;
      broadcast(fullChannelName, event, payload);
    },
    [channelName, isPrivate, broadcast]
  );

  return {
    lastMessage,
    sendMessage,
    isConnected: status === 'connected',
  };
}
