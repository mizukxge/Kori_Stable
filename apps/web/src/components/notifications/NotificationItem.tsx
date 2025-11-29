import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, Info, Trash2, AlertTriangle } from 'lucide-react';
import type { Notification } from '../../lib/notifications-api';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const { id, title, message, category = 'info', actionUrl, actionText, isRead, createdAt } = notification;

  // Get icon and color based on category
  const getIconAndColor = () => {
    switch (category) {
      case 'success':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' };
      case 'info':
      default:
        return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' };
    }
  };

  const { icon: Icon, color, bg } = getIconAndColor();
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <div
      className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        !isRead ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-1 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
              <p className="text-gray-600 text-sm mt-1">{message}</p>

              {/* Timestamp */}
              <p className="text-gray-500 text-xs mt-2">{timeAgo}</p>

              {/* Action button */}
              {actionUrl && actionText && (
                <a
                  href={actionUrl}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-2 inline-block hover:underline"
                >
                  {actionText} →
                </a>
              )}
            </div>

            {/* Unread indicator */}
            {!isRead && (
              <div className="flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
          {!isRead && onMarkAsRead && (
            <button
              onClick={() => onMarkAsRead(id)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Mark as read"
              aria-label="Mark as read"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
              aria-label="Delete notification"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
