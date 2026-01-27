import { useState, useRef, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  ThumbsUp,
  User,
  XCircle,
  Archive,
  Check,
  MoreHorizontal,
} from 'lucide-react';
import type { Notification } from '../types/notification';
import { NotificationEventType } from '../types/notification';
import { timeAgo } from '../utils/timeAgo';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onClick: (notification: Notification) => void;
  isLast?: boolean;
}

type EventConfig = {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  darkBgColor: string;
  accentColor: string;
  label: string;
};

const eventConfig: Record<string, EventConfig> = {
  [NotificationEventType.TASK_OVERDUE]: {
    icon: AlertCircle,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-50',
    darkBgColor: 'dark:bg-red-500/10',
    accentColor: 'bg-red-500',
    label: 'Task Overdue',
  },
  [NotificationEventType.SUBMISSION_DUE]: {
    icon: Clock,
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-50',
    darkBgColor: 'dark:bg-amber-500/10',
    accentColor: 'bg-amber-500',
    label: 'Submission Due',
  },
  [NotificationEventType.DELIVERABLE_SUBMITTED]: {
    icon: FileText,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-500/10',
    accentColor: 'bg-blue-500',
    label: 'Deliverable Submitted',
  },
  [NotificationEventType.DELIVERABLE_APPROVED]: {
    icon: CheckCircle,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-500/10',
    accentColor: 'bg-emerald-500',
    label: 'Approved',
  },
  [NotificationEventType.DELIVERABLE_REJECTED]: {
    icon: XCircle,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-50',
    darkBgColor: 'dark:bg-red-500/10',
    accentColor: 'bg-red-500',
    label: 'Rejected',
  },
  [NotificationEventType.TASK_ASSIGNED]: {
    icon: User,
    color: 'text-violet-500 dark:text-violet-400',
    bgColor: 'bg-violet-50',
    darkBgColor: 'dark:bg-violet-500/10',
    accentColor: 'bg-violet-500',
    label: 'Task Assigned',
  },
  [NotificationEventType.TASK_COMPLETED]: {
    icon: CheckCircle,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-500/10',
    accentColor: 'bg-emerald-500',
    label: 'Task Completed',
  },
  [NotificationEventType.COMMENT_ADDED]: {
    icon: MessageSquare,
    color: 'text-surface-500 dark:text-surface-400',
    bgColor: 'bg-surface-100',
    darkBgColor: 'dark:bg-surface-700/50',
    accentColor: 'bg-surface-500',
    label: 'New Comment',
  },
  [NotificationEventType.REACTION_ADDED]: {
    icon: ThumbsUp,
    color: 'text-yellow-500 dark:text-yellow-400',
    bgColor: 'bg-yellow-50',
    darkBgColor: 'dark:bg-yellow-500/10',
    accentColor: 'bg-yellow-500',
    label: 'New Reaction',
  },
};

const defaultConfig: EventConfig = {
  icon: AlertCircle,
  color: 'text-surface-500 dark:text-surface-400',
  bgColor: 'bg-surface-100',
  darkBgColor: 'dark:bg-surface-800',
  accentColor: 'bg-surface-400',
  label: 'Notification',
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  onClick,
  isLast = false,
}: NotificationItemProps) {
  const [showActions, setShowActions] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const config = eventConfig[notification.event_type] || defaultConfig;
  const Icon = config.icon;
  const isUnread = notification.state === 'unread';

  const title =
    notification.metadata.taskTitle ||
    notification.metadata.deliverableTitle ||
    config.label;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(notification);
    },
    [onClick, notification]
  );

  const handleMarkAsRead = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMarkAsRead(notification.id);
      setShowActions(false);
    },
    [onMarkAsRead, notification.id]
  );

  const handleArchive = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onArchive(notification.id);
      setShowActions(false);
    },
    [onArchive, notification.id]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = itemRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      itemRef.current?.style.setProperty('--mouse-x', `${x}%`);
      itemRef.current?.style.setProperty('--mouse-y', `${y}%`);
    }
  }, []);

  return (
    <div
      ref={itemRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        notification-glow
        group relative mx-2 my-1 px-3 py-3 rounded-xl
        cursor-pointer transition-all duration-200
        ${isUnread
          ? `${config.bgColor} ${config.darkBgColor}`
          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
        }
        ${!isLast ? '' : ''}
      `}
    >
      {/* Unread accent line */}
      {isUnread && (
        <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${config.accentColor}`} />
      )}

      <div className="flex items-start gap-3">
        {/* Icon container */}
        <div className={`
          flex-shrink-0 p-2 rounded-lg
          ${isUnread
            ? `${config.bgColor} ${config.darkBgColor}`
            : 'bg-surface-100 dark:bg-surface-800'
          }
        `}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-start justify-between gap-2">
            <p className={`
              text-sm leading-snug
              ${isUnread
                ? 'font-semibold text-surface-900 dark:text-surface-50'
                : 'font-medium text-surface-700 dark:text-surface-300'
              }
            `}>
              {title}
            </p>
            {isUnread && (
              <span className="
                flex-shrink-0 mt-1.5
                h-2 w-2 rounded-full
                bg-brand-500
                animate-pulse-soft
              " />
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className={`
              text-xs
              ${isUnread
                ? 'text-surface-600 dark:text-surface-400'
                : 'text-surface-500 dark:text-surface-500'
              }
            `}>
              {config.label}
            </span>
            <span className="text-surface-300 dark:text-surface-600">&middot;</span>
            <span className="text-xs text-surface-400 dark:text-surface-500">
              {timeAgo(notification.created_at)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className={`
          flex-shrink-0 flex items-center gap-0.5
          transition-all duration-200
          ${showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
        `}>
          {isUnread && (
            <button
              onClick={handleMarkAsRead}
              className="
                p-1.5 rounded-lg
                text-surface-400 dark:text-surface-500
                hover:text-brand-600 dark:hover:text-brand-400
                hover:bg-brand-500/10 dark:hover:bg-brand-500/20
                transition-colors duration-150
              "
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleArchive}
            className="
              p-1.5 rounded-lg
              text-surface-400 dark:text-surface-500
              hover:text-surface-600 dark:hover:text-surface-300
              hover:bg-surface-100 dark:hover:bg-surface-700
              transition-colors duration-150
            "
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
