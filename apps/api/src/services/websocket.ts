import { WebSocket } from 'ws';
import { Notification } from '@prisma/client';

/**
 * WebSocket Connection Manager
 *
 * Manages per-user WebSocket connections and provides broadcasting capabilities
 * Supports multiple connections per user (multiple browser tabs)
 */

interface ConnectionStats {
  totalConnections: number;
  usersConnected: number;
  connectionsPerUser: Record<string, number>;
}

interface IncomingMessage {
  type: 'ping' | 'pong' | 'mark_read' | 'delete';
  data?: any;
}

interface OutgoingMessage {
  type: 'notification' | 'unread_count' | 'pong' | 'error';
  data: any;
  timestamp: string;
}

// Store active WebSocket connections: userId -> Set of WebSocket connections
const userConnections = new Map<string, Set<WebSocket>>();

/**
 * Register a new WebSocket connection for a user
 */
export function registerConnection(userId: string, ws: WebSocket): void {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }

  userConnections.get(userId)!.add(ws);
  console.log(`[WS] User ${userId} connected (total: ${userConnections.get(userId)!.size})`);
}

/**
 * Unregister a WebSocket connection
 */
export function unregisterConnection(userId: string, ws: WebSocket): void {
  const connections = userConnections.get(userId);

  if (!connections) {
    return;
  }

  connections.delete(ws);

  if (connections.size === 0) {
    userConnections.delete(userId);
    console.log(`[WS] User ${userId} disconnected (no more connections)`);
  } else {
    console.log(`[WS] User ${userId} connection closed (remaining: ${connections.size})`);
  }
}

/**
 * Send message to all connections of a specific user
 */
export function sendToUser(userId: string, message: OutgoingMessage): void {
  const connections = userConnections.get(userId);

  if (!connections || connections.size === 0) {
    return;
  }

  const payload = JSON.stringify(message);
  let sent = 0;
  let failed = 0;

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
        sent++;
      } catch (error) {
        console.error(`[WS] Failed to send message to user ${userId}:`, error);
        failed++;
      }
    }
  });

  if (sent > 0) {
    console.log(`[WS] Sent ${message.type} message to user ${userId} (${sent} connections)`);
  }

  if (failed > 0) {
    console.warn(`[WS] Failed to send to ${failed} connection(s) for user ${userId}`);
  }
}

/**
 * Broadcast notification to a user
 */
export function notifyUser(userId: string, notification: Notification): void {
  sendToUser(userId, {
    type: 'notification',
    data: notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send unread count to user
 */
export function sendUnreadCount(userId: string, count: number): void {
  sendToUser(userId, {
    type: 'unread_count',
    data: { count },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send pong response (keepalive)
 */
export function sendPong(userId: string): void {
  sendToUser(userId, {
    type: 'pong',
    data: {},
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send error message to user
 */
export function sendError(userId: string, message: string): void {
  sendToUser(userId, {
    type: 'error',
    data: { message },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get connection statistics
 */
export function getConnectionStats(): ConnectionStats {
  const stats: ConnectionStats = {
    totalConnections: 0,
    usersConnected: userConnections.size,
    connectionsPerUser: {},
  };

  userConnections.forEach((connections, userId) => {
    const count = connections.size;
    stats.totalConnections += count;
    stats.connectionsPerUser[userId] = count;
  });

  return stats;
}

/**
 * Close all connections for a user (e.g., on logout)
 */
export function closeUserConnections(userId: string): void {
  const connections = userConnections.get(userId);

  if (!connections) {
    return;
  }

  connections.forEach((ws) => {
    try {
      ws.close(1000, 'User logged out');
    } catch (error) {
      console.error(`[WS] Error closing connection for user ${userId}:`, error);
    }
  });

  userConnections.delete(userId);
  console.log(`[WS] Closed all connections for user ${userId}`);
}

/**
 * Broadcast message to multiple users
 */
export function broadcastToUsers(userIds: string[], message: Omit<OutgoingMessage, 'timestamp'>): void {
  const messageWithTimestamp: OutgoingMessage = {
    ...message,
    timestamp: new Date().toISOString(),
  };

  userIds.forEach((userId) => {
    sendToUser(userId, messageWithTimestamp);
  });
}

/**
 * Parse incoming message from client
 */
export function parseMessage(data: string): IncomingMessage | null {
  try {
    const message = JSON.parse(data);

    if (!message.type || typeof message.type !== 'string') {
      return null;
    }

    return message as IncomingMessage;
  } catch (error) {
    console.error('[WS] Failed to parse message:', error);
    return null;
  }
}
