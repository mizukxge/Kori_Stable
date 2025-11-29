import { useEffect, useRef, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { markAllNotificationsAsRead } from '../../lib/notifications-api';
import type { Notification } from '../../lib/notifications-api';

interface NotificationTrayProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationsChange: (notifications: Notification[]) => void;
  onUnreadCountChange: (count: number) => void;
}

export function NotificationTray({
  isOpen,
  onClose,
  notifications,
  onNotificationsChange,
  onUnreadCountChange,
}: NotificationTrayProps) {
  const trayRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasNotifications = notifications.length > 0;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setLoading(true);
      await markAllNotificationsAsRead();

      // Update local state
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      onNotificationsChange(updated);
      onUnreadCountChange(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id && !n.isRead ? { ...n, isRead: true } : n
    );
    onNotificationsChange(updated);

    const newUnreadCount = updated.filter((n) => !n.isRead).length;
    onUnreadCountChange(newUnreadCount);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    const deleted = notifications.find((n) => n.id === id);
    const updated = notifications.filter((n) => n.id !== id);
    onNotificationsChange(updated);

    if (deleted && !deleted.isRead) {
      const newUnreadCount = updated.filter((n) => !n.isRead).length;
      onUnreadCountChange(newUnreadCount);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={trayRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close notifications"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {hasNotifications ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-gray-500 text-center">No notifications yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between gap-2">
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
        )}

        <a
          href="/admin/notifications"
          className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
