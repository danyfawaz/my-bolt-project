import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useMemo } from 'react';
import { X, Bell, CheckCheck, Inbox, Settings } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '../types/notification';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Group notifications by time period
 */
function groupNotificationsByTime(notifications: Notification[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups: { label: string; notifications: Notification[] }[] = [
    { label: 'Today', notifications: [] },
    { label: 'Yesterday', notifications: [] },
    { label: 'This Week', notifications: [] },
    { label: 'Earlier', notifications: [] },
  ];

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);
    if (date >= today) {
      groups[0].notifications.push(notification);
    } else if (date >= yesterday) {
      groups[1].notifications.push(notification);
    } else if (date >= weekAgo) {
      groups[2].notifications.push(notification);
    } else {
      groups[3].notifications.push(notification);
    }
  });

  return groups.filter((group) => group.notifications.length > 0);
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    archive,
    markAllAsRead,
  } = useNotifications();

  // Filter out archived and expired notifications
  const visibleNotifications = useMemo(
    () => notifications.filter((n) => n.state !== 'archived' && n.state !== 'expired'),
    [notifications]
  );

  // Group notifications by time period
  const groupedNotifications = useMemo(
    () => groupNotificationsByTime(visibleNotifications),
    [visibleNotifications]
  );

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.state === 'unread') {
      markAsRead(notification.id);
    }

    if (notification.resource_ref) {
      const [type, id] = notification.resource_ref.split(':');
      if (type === 'task' && id) {
        navigate(`/task/${id}`);
        onClose();
      }
    } else if (notification.metadata.taskId) {
      navigate(`/task/${notification.metadata.taskId}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        className="
          fixed bottom-4 right-4 z-50 w-[400px] max-h-[calc(100vh-8rem)]
          glass-panel rounded-2xl
          flex flex-col overflow-hidden
          animate-slide-up
        "
      >
        {/* Header */}
        <div className="
          px-5 py-4
          border-b border-surface-200/80 dark:border-surface-700/50
          bg-gradient-to-r from-surface-50 to-white dark:from-surface-850 dark:to-surface-900
        ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="
                p-2 rounded-xl
                bg-brand-500/10 dark:bg-brand-500/20
              ">
                <Bell className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="
                    p-2 rounded-lg
                    text-surface-500 dark:text-surface-400
                    hover:text-brand-600 dark:hover:text-brand-400
                    hover:bg-brand-500/10 dark:hover:bg-brand-500/20
                    transition-all duration-200
                  "
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="
                  p-2 rounded-lg
                  text-surface-500 dark:text-surface-400
                  hover:text-surface-700 dark:hover:text-surface-200
                  hover:bg-surface-100 dark:hover:bg-surface-800
                  transition-all duration-200
                "
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto notification-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="h-10 w-10 rounded-full border-2 border-surface-200 dark:border-surface-700" />
                <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              </div>
              <p className="mt-4 text-sm text-surface-500 dark:text-surface-400">
                Loading notifications...
              </p>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="
                p-4 rounded-2xl mb-4
                bg-surface-100 dark:bg-surface-800
              ">
                <Inbox className="h-10 w-10 text-surface-400 dark:text-surface-500" />
              </div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                All caught up!
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 text-center">
                No new notifications at the moment.
                <br />
                We'll let you know when something happens.
              </p>
            </div>
          ) : (
            <div className="py-2">
              {groupedNotifications.map((group) => (
                <div key={group.label}>
                  {/* Time group header */}
                  <div className="
                    px-5 py-2
                    text-[11px] font-semibold uppercase tracking-wider
                    text-surface-400 dark:text-surface-500
                    bg-surface-50/50 dark:bg-surface-900/50
                    sticky top-0 backdrop-blur-sm
                  ">
                    {group.label}
                  </div>
                  {/* Notifications in group */}
                  <div>
                    {group.notifications.map((notification, index) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onArchive={archive}
                        onClick={handleNotificationClick}
                        isLast={index === group.notifications.length - 1}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {visibleNotifications.length > 0 && (
          <div className="
            px-5 py-3
            border-t border-surface-200/80 dark:border-surface-700/50
            bg-surface-50/50 dark:bg-surface-900/50
          ">
            <div className="flex items-center justify-between">
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {visibleNotifications.length} notification{visibleNotifications.length !== 1 ? 's' : ''}
              </p>
              <button className="
                flex items-center gap-1.5 px-2 py-1 rounded-md
                text-xs text-surface-500 dark:text-surface-400
                hover:text-surface-700 dark:hover:text-surface-200
                hover:bg-surface-100 dark:hover:bg-surface-800
                transition-all duration-200
              ">
                <Settings className="h-3 w-3" />
                Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
