import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { supabase } from '../lib/supabase';
import type { Notification, NotificationState } from '../types/notification';
import { mockNotifications, getMockUnreadCount } from '../mocks/notifications';

// Enable demo mode when no user is authenticated or via URL param ?demo=true
const isDemoMode = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'true';
  }
  return false;
};

interface PostgresChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Notification;
  old: Notification | null;
}

export function useNotifications() {
  const { subscribeToPrivateChannel, user, status } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [demoMode] = useState(isDemoMode);

  // Fetch initial notifications (or use mock data in demo mode)
  useEffect(() => {
    // Demo mode - use mock data
    if (demoMode || !user) {
      if (demoMode) {
        // Simulate loading delay for realistic UX
        setLoading(true);
        const timer = setTimeout(() => {
          setNotifications([...mockNotifications]);
          setUnreadCount(getMockUnreadCount());
          setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
      }

      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data || []);
        setUnreadCount(data?.filter((n) => n.state === 'unread').length || 0);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [user, demoMode]);

  // Subscribe to realtime notification updates
  useEffect(() => {
    if (!user || status !== 'connected') return;

    const unsubscribe = subscribeToPrivateChannel('notifications', {
      onPostgresChanges: (payload: unknown) => {
        const change = payload as PostgresChangePayload;

        if (change.eventType === 'INSERT') {
          setNotifications((prev) => [change.new, ...prev]);
          if (change.new.state === 'unread') {
            setUnreadCount((prev) => prev + 1);
          }
        } else if (change.eventType === 'UPDATE') {
          setNotifications((prev) =>
            prev.map((n) => (n.id === change.new.id ? change.new : n))
          );
          // Recalculate unread count
          setNotifications((prev) => {
            setUnreadCount(prev.filter((n) => n.state === 'unread').length);
            return prev;
          });
        } else if (change.eventType === 'DELETE' && change.old) {
          setNotifications((prev) => prev.filter((n) => n.id !== change.old!.id));
          if (change.old.state === 'unread') {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      },
    });

    return unsubscribe;
  }, [user, status, subscribeToPrivateChannel]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Demo mode - update local state only
      if (demoMode) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, state: 'read' as NotificationState, updated_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return;
      }

      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ state: 'read' as NotificationState, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    [user, demoMode]
  );

  const markAsActioned = useCallback(
    async (notificationId: string) => {
      // Demo mode - update local state only
      if (demoMode) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, state: 'actioned' as NotificationState, updated_at: new Date().toISOString() }
              : n
          )
        );
        return;
      }

      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ state: 'actioned' as NotificationState, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id);

      if (error) {
        console.error('Error marking notification as actioned:', error);
      }
    },
    [user, demoMode]
  );

  const archive = useCallback(
    async (notificationId: string) => {
      // Demo mode - update local state only
      if (demoMode) {
        const notification = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, state: 'archived' as NotificationState, updated_at: new Date().toISOString() }
              : n
          )
        );
        if (notification?.state === 'unread') {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        return;
      }

      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ state: 'archived' as NotificationState, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id);

      if (error) {
        console.error('Error archiving notification:', error);
      }
    },
    [user, demoMode, notifications]
  );

  const markAllAsRead = useCallback(async () => {
    // Demo mode - update local state only
    if (demoMode) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.state === 'unread'
            ? { ...n, state: 'read' as NotificationState, updated_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(0);
      return;
    }

    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ state: 'read' as NotificationState, updated_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('state', 'unread');

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user, demoMode]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsActioned,
    archive,
    markAllAsRead,
  };
}
