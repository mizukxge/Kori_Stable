import { useEffect, useRef, useState, useCallback } from 'react';
import type { Notification } from '../lib/notifications-api';
import { getNotifications, markNotificationAsRead, deleteNotification } from '../lib/notifications-api';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
  loading: boolean;
  error: string | null;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (id: string) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

/**
 * Hook for managing WebSocket notifications
 *
 * Features:
 * - Auto-connect to WebSocket on mount
 * - Auto-reconnect with exponential backoff
 * - Heartbeat keepalive
 * - Real-time notification updates
 * - Unread count tracking
 * - Fallback to REST API polling if needed
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get WebSocket URL from environment
  const getWsUrl = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    return `${wsUrl}/ws/notifications`;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        console.log('[Notifications] WebSocket connected');
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Send keepalive ping every 30 seconds
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30 * 1000);

        // Load initial notifications
        loadNotifications();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'notification':
              // New notification arrived
              console.log('[Notifications] Received notification:', message.data);
              setNotifications((prev) => [message.data, ...prev]);
              // Update unread count
              setUnreadCount((prev) => prev + 1);
              break;

            case 'unread_count':
              // Unread count update
              console.log('[Notifications] Unread count:', message.data.count);
              setUnreadCount(message.data.count);
              break;

            case 'pong':
              // Keepalive acknowledgment
              console.debug('[Notifications] Received pong');
              break;

            case 'error':
              console.error('[Notifications] Server error:', message.data.message);
              setError(message.data.message);
              break;

            default:
              console.warn('[Notifications] Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('[Notifications] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[Notifications] WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = () => {
        console.log('[Notifications] WebSocket disconnected');
        setConnected(false);

        // Clear keepalive interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt to reconnect with exponential backoff
        attemptReconnect();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[Notifications] Failed to create WebSocket:', err);
      setError('Failed to connect');
      attemptReconnect();
    }
  }, [getWsUrl]);

  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    const maxAttempts = 10;
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    if (reconnectAttemptsRef.current >= maxAttempts) {
      console.warn('[Notifications] Max reconnect attempts reached, falling back to polling');
      startPolling();
      return;
    }

    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current), maxDelay);
    reconnectAttemptsRef.current += 1;

    console.log(`[Notifications] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  // Load notifications via REST API
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNotifications(1, 20, false);
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      setError(null);
    } catch (err) {
      console.error('[Notifications] Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Start polling as fallback
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      return; // Already polling
    }

    console.log('[Notifications] Starting polling fallback');

    pollIntervalRef.current = setInterval(() => {
      loadNotifications();
    }, 60 * 1000); // Poll every 60 seconds
  }, [loadNotifications]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await markNotificationAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('[Notifications] Failed to mark as read:', err);
        setError('Failed to mark as read');
      }
    },
    []
  );

  // Delete notification
  const deleteNotificationFn = useCallback(
    async (id: string) => {
      try {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        // Adjust unread count if deleting unread notification
        setNotifications((prev) => {
          const deleted = prev.find((n) => n.id === id);
          if (deleted && !deleted.isRead) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev;
        });
      } catch (err) {
        console.error('[Notifications] Failed to delete notification:', err);
        setError('Failed to delete notification');
      }
    },
    []
  );

  // Initialize WebSocket connection on mount
  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      stopPolling();
    };
  }, [connect, stopPolling]);

  return {
    notifications,
    unreadCount,
    connected,
    loading,
    error,
    setNotifications,
    setUnreadCount,
    markAsRead,
    delete: deleteNotificationFn,
  };
}
