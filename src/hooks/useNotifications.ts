import { useEffect, useState, useCallback, useMemo } from 'react';
import { useWebSocket } from './useWebSocket';
import { supabase } from '../lib/supabase';
import type { Notification, NotificationState } from '../types/notification';
import { mockNotifications, getMockUnreadCount } from '../mocks/notifications';

/**
 * Check if demo mode is enabled via URL param ?demo=true
 * Demo mode uses mock data and localStorage - for development/testing only
 */
const isDemoMode = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'true';
  }
  return false;
};

export function useNotifications() {
  const { user } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check demo mode once on mount
  const demoMode = useMemo(() => isDemoMode(), []);

  // User ID from authenticated session
  const effectiveUserId = user?.id ?? null;

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!effectiveUserId || demoMode) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setNotifications(data || []);
        setUnreadCount(data?.filter((n) => n.state === 'unread').length || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, demoMode]);

  // Fetch initial notifications and set up realtime subscription
  useEffect(() => {
    // Demo mode - use mock data
    if (demoMode) {
      setLoading(true);
      const timer = setTimeout(() => {
        setNotifications([...mockNotifications]);
        setUnreadCount(getMockUnreadCount());
        setLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }

    // No authenticated user - show empty state
    if (!effectiveUserId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Fetch notifications
    fetchNotifications();

    // Set up Supabase Realtime subscription for this user's notifications
    const channel = supabase
      .channel(`notifications:${effectiveUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${effectiveUserId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          if (newNotification.state === 'unread') {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${effectiveUserId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
          // Recalculate unread count
          setNotifications((prev) => {
            setUnreadCount(prev.filter((n) => n.state === 'unread').length);
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${effectiveUserId}`,
        },
        (payload) => {
          const deletedNotification = payload.old as Notification;
          setNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id));
          if (deletedNotification.state === 'unread') {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to notifications realtime');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveUserId, demoMode, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
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

      if (!effectiveUserId) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, state: 'read' as NotificationState, updated_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const { error } = await supabase
        .from('notifications')
        .update({ state: 'read' as NotificationState, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', effectiveUserId);

      if (error) {
        console.error('Error marking notification as read:', error);
        fetchNotifications(); // Refetch on error
      }
    },
    [effectiveUserId, demoMode, fetchNotifications]
  );

  const markAsUnread = useCallback(
    async (notificationId: string) => {
      if (demoMode) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, state: 'unread' as NotificationState, updated_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => prev + 1);
        return;
      }

      if (!effectiveUserId) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, state: 'unread' as NotificationState, updated_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => prev + 1);

      const { error } = await supabase
        .from('notifications')
        .update({ state: 'unread' as NotificationState, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', effectiveUserId);

      if (error) {
        console.error('Error marking notification as unread:', error);
        fetchNotifications();
      }
    },
    [effectiveUserId, demoMode, fetchNotifications]
  );

  const markAsActioned = useCallback(
    async (notificationId: string) => {
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

      if (!effectiveUserId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ state: 'actioned' as NotificationState, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', effectiveUserId);

      if (error) {
        console.error('Error marking notification as actioned:', error);
      }
    },
    [effectiveUserId, demoMode]
  );

  const archive = useCallback(
    async (notificationId: string) => {
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

      if (!effectiveUserId) return;

      // Optimistic update
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

      const { error } = await supabase
        .from('notifications')
        .update({ state: 'archived' as NotificationState, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', effectiveUserId);

      if (error) {
        console.error('Error archiving notification:', error);
        fetchNotifications();
      }
    },
    [effectiveUserId, demoMode, notifications, fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
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

    if (!effectiveUserId) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.state === 'unread'
          ? { ...n, state: 'read' as NotificationState, updated_at: new Date().toISOString() }
          : n
      )
    );
    setUnreadCount(0);

    const { error } = await supabase
      .from('notifications')
      .update({ state: 'read' as NotificationState, updated_at: new Date().toISOString() })
      .eq('recipient_id', effectiveUserId)
      .eq('state', 'unread');

    if (error) {
      console.error('Error marking all notifications as read:', error);
      fetchNotifications();
    }
  }, [effectiveUserId, demoMode, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    markAsActioned,
    archive,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
