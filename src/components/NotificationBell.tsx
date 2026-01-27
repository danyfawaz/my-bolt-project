import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationBellProps {
  onClick: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const [animate, setAnimate] = useState(false);
  const [prevCount, setPrevCount] = useState(unreadCount);

  // Trigger animation when unread count increases
  useEffect(() => {
    if (unreadCount > prevCount) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevCount(unreadCount);
  }, [unreadCount, prevCount]);

  return (
    <button
      onClick={onClick}
      className={`
        relative p-2.5 rounded-xl
        text-surface-500 dark:text-surface-400
        hover:text-surface-700 dark:hover:text-surface-200
        hover:bg-surface-100 dark:hover:bg-surface-800
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2
        dark:focus:ring-offset-surface-900
        ${animate ? 'animate-bell-ring' : ''}
      `}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className={`
          absolute -top-0.5 -right-0.5
          flex items-center justify-center
          min-w-[20px] h-[20px] px-1
          text-[11px] font-bold
          text-white
          bg-gradient-to-br from-brand-500 to-brand-600
          dark:from-brand-400 dark:to-brand-500
          rounded-full
          shadow-sm shadow-brand-500/30
          ${animate ? 'animate-scale-in' : ''}
        `}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Pulse ring for new notifications */}
      {unreadCount > 0 && (
        <span className="
          absolute -top-0.5 -right-0.5
          h-[20px] w-[20px]
          rounded-full
          bg-brand-500/30
          animate-ping
          pointer-events-none
        " />
      )}
    </button>
  );
}
