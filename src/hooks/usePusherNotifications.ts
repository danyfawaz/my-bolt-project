import { useEffect, useCallback, useState } from 'react';
import { pusherService } from '../services/PusherService';
import type { Notification } from '../types/notification';
import type { PusherConnectionState } from '../types/pusher';

interface UsePusherNotificationsOptions {
  userId: string | null;
  onNotificationNew?: (notification: Notification) => void;
  onNotificationUpdated?: (notification: Notification) => void;
  onNotificationDeleted?: (notificationId: string) => void;
  onNotificationCount?: (count: number) => void;
  onError?: (error: Error) => void;
}

interface UsePusherNotificationsResult {
  isConnected: boolean;
  connectionState: PusherConnectionState;
  unsubscribe: () => void;
}

/**
 * React hook for subscribing to Pusher notification events
 * Implements STY-002 specification for real-time notifications
 */
export function usePusherNotifications({
  userId,
  onNotificationNew,
  onNotificationUpdated,
  onNotificationDeleted,
  onNotificationCount,
  onError,
}: UsePusherNotificationsOptions): UsePusherNotificationsResult {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<PusherConnectionState>('initialized');

  // Subscribe to Pusher channel when userId changes
  useEffect(() => {
    if (!userId) {
      pusherService.unsubscribe();
      setIsConnected(false);
      return;
    }

    pusherService.subscribe(userId, {
      onNotificationNew: (data) => {
        onNotificationNew?.(data.notification);
      },
      onNotificationUpdated: (data) => {
        onNotificationUpdated?.(data.notification);
      },
      onNotificationDeleted: (data) => {
        onNotificationDeleted?.(data.notificationId);
      },
      onNotificationCount: (data) => {
        onNotificationCount?.(data.count);
      },
      onConnected: () => {
        setIsConnected(true);
      },
      onDisconnected: () => {
        setIsConnected(false);
      },
      onError: (error) => {
        onError?.(error);
      },
    });

    // Listen for connection state changes
    pusherService.onConnectionStateChange((state) => {
      setConnectionState(state.current as PusherConnectionState);
    });

    // Cleanup on unmount
    return () => {
      pusherService.unsubscribe();
    };
  }, [userId, onNotificationNew, onNotificationUpdated, onNotificationDeleted, onNotificationCount, onError]);

  const unsubscribe = useCallback(() => {
    pusherService.unsubscribe();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    connectionState,
    unsubscribe,
  };
}

export default usePusherNotifications;
