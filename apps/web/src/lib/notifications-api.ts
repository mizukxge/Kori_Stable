import { API_URL } from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  category?: 'info' | 'success' | 'warning' | 'error';
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  actionText?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

/**
 * Fetch user's notifications
 */
export async function getNotifications(
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<NotificationsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    unreadOnly: String(unreadOnly),
  });

  const response = await fetch(`${API_URL}/notifications?${params}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ updated: number }> {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to mark all as read: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete/dismiss a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete notification: ${response.statusText}`);
  }
}
