import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import {
  registerConnection,
  unregisterConnection,
  sendPong,
  sendError,
  sendUnreadCount,
  parseMessage,
} from '../services/websocket.js';

const prisma = new PrismaClient();

/**
 * WebSocket Route Handler
 *
 * Endpoint: GET /ws/notifications
 * Upgrades HTTP connection to WebSocket
 * Authenticates user via session cookie
 * Sends initial unread count
 * Handles keepalive pings
 * Auto-cleans up on disconnect
 */

export async function websocketRoutes(fastify: FastifyInstance) {
  // WebSocket upgrade endpoint
  fastify.get('/ws/notifications', { websocket: true }, async (socket: WebSocket, request: FastifyRequest) => {
    // Extract userId from session
    const userId = (request as any).user?.id;

    if (!userId) {
      console.log('[WS] Connection rejected: No authentication');
      socket.close(4001, 'Unauthorized - authentication required');
      return;
    }

    console.log(`[WS] User ${userId} connecting...`);

    // Register connection
    registerConnection(userId, socket);

    // Send initial unread count
    try {
      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      sendUnreadCount(userId, unreadCount);
      console.log(`[WS] Sent initial unread count to ${userId}: ${unreadCount}`);
    } catch (error) {
      console.error(`[WS] Failed to fetch unread count for ${userId}:`, error);
      sendError(userId, 'Failed to load notification count');
    }

    // Keepalive ping interval (30 seconds)
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.ping();
        } catch (error) {
          console.error(`[WS] Ping failed for user ${userId}:`, error);
        }
      }
    }, 30 * 1000);

    // Handle incoming messages
    socket.on('message', (data: Buffer) => {
      const message = parseMessage(data.toString());

      if (!message) {
        return;
      }

      switch (message.type) {
        case 'ping':
          // Client keepalive ping
          sendPong(userId);
          break;

        case 'pong':
          // Acknowledge server ping
          console.log(`[WS] Received pong from ${userId}`);
          break;

        case 'mark_read':
          // Client marking notification as read
          // (REST API handles actual update, this is just acknowledgment)
          console.log(`[WS] User ${userId} marked notification as read`);
          break;

        case 'delete':
          // Client deleting notification
          // (REST API handles actual deletion, this is just acknowledgment)
          console.log(`[WS] User ${userId} deleted notification`);
          break;

        default:
          console.warn(`[WS] Unknown message type from ${userId}: ${message.type}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[WS] Error for user ${userId}:`, error);
    });

    // Handle disconnect
    socket.on('close', () => {
      clearInterval(pingInterval);
      unregisterConnection(userId, socket);
    });
  });

  // Optional: Health check endpoint for connection stats
  fastify.get('/ws/stats', async (request, reply) => {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    // Import here to avoid circular dependency
    const { getConnectionStats } = await import('../services/websocket.js');
    const stats = getConnectionStats();

    return reply.send(stats);
  });
}
