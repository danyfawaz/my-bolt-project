import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types/notification';

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

  // Fetch initial notifications
  useEffect(() => {
    if (!user) {
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
  }, [user]);

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
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ state: 'read', updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    [user]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ state: 'read', updated_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('state', 'unread');

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
