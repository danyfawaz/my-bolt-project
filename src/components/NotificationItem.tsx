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
} from 'lucide-react';
import type { Notification } from '../types/notification';
import { NotificationEventType } from '../types/notification';
import { timeAgo } from '../utils/timeAgo';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onClick: (notification: Notification) => void;
}

const eventConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  [NotificationEventType.TASK_OVERDUE]: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-l-red-500',
    label: 'Task Overdue',
  },
  [NotificationEventType.SUBMISSION_DUE]: {
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-l-orange-500',
    label: 'Submission Due',
  },
  [NotificationEventType.DELIVERABLE_SUBMITTED]: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-l-blue-500',
    label: 'Deliverable Submitted',
  },
  [NotificationEventType.DELIVERABLE_APPROVED]: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-l-green-500',
    label: 'Approved',
  },
  [NotificationEventType.DELIVERABLE_REJECTED]: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-l-red-500',
    label: 'Rejected',
  },
  [NotificationEventType.TASK_ASSIGNED]: {
    icon: User,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-l-indigo-500',
    label: 'Task Assigned',
  },
  [NotificationEventType.TASK_COMPLETED]: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-l-green-500',
    label: 'Task Completed',
  },
  [NotificationEventType.COMMENT_ADDED]: {
    icon: MessageSquare,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-l-gray-500',
    label: 'New Comment',
  },
  [NotificationEventType.REACTION_ADDED]: {
    icon: ThumbsUp,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-l-yellow-500',
    label: 'New Reaction',
  },
};

const defaultConfig = {
  icon: AlertCircle,
  color: 'text-gray-600',
  bgColor: 'bg-gray-50 border-l-gray-400',
  label: 'Notification',
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  onClick,
}: NotificationItemProps) {
  const config = eventConfig[notification.event_type] || defaultConfig;
  const Icon = config.icon;
  const isUnread = notification.state === 'unread';

  const title = notification.metadata.taskTitle ||
                notification.metadata.deliverableTitle ||
                config.label;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(notification);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative px-4 py-3 border-l-4 cursor-pointer transition-colors
        ${config.bgColor}
        ${isUnread ? 'bg-opacity-100' : 'bg-opacity-50'}
        hover:bg-opacity-75
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
              {title}
            </p>
            {isUnread && (
              <span className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {config.label} &middot; {timeAgo(notification.created_at)}
          </p>
        </div>

        {/* Action buttons - visible on hover */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUnread && (
            <button
              onClick={handleMarkAsRead}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleArchive}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
