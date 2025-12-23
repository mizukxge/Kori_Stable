import { Bell } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  isOpen: boolean;
}

export function NotificationBell({ unreadCount, onClick, isOpen }: NotificationBellProps) {
  // Format badge count (99+ for > 99)
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);
  const showBadge = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg transition-colors ${
        isOpen
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-6 h-6" />

      {showBadge && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white dark:text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 dark:bg-red-500 rounded-full min-w-6 h-6">
          {badgeText}
        </span>
      )}
    </button>
  );
}
