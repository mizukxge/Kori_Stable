import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, NotificationType, NotificationDigestFrequency } from '@prisma/client';
import { z } from 'zod';
import { attemptDelivery } from '../services/webhook';

const prisma = new PrismaClient();

// Validation schemas
const updatePreferenceSchema = z.object({
  eventType: z.nativeEnum(NotificationType),
  enabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  webhookEnabled: z.boolean().optional(),
  digestEnabled: z.boolean().optional(),
  digestFrequency: z.nativeEnum(NotificationDigestFrequency).optional(),
  digestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  secret: z.string().optional(),
  description: z.string().max(500).optional(),
  events: z.array(z.nativeEnum(NotificationType)).optional(),
  headers: z.record(z.string()).optional(),
  maxRetries: z.number().int().min(0).max(10).default(3),
  timeoutSeconds: z.number().int().min(1).max(300).default(30),
});

export default async function notificationRoutes(fastify: FastifyInstance) {
  // ============================================
  // IN-APP NOTIFICATIONS
  // ============================================

  /**
   * GET /api/notifications
   * Get user's in-app notifications
   */
  fastify.get<{ Querystring: { page?: string; limit?: string; unreadOnly?: string } }>(
    '/',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const page = parseInt(request.query.page || '1');
        const limit = parseInt(request.query.limit || '20');
        const unreadOnly = request.query.unreadOnly === 'true';
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (unreadOnly) {
          where.isRead = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
          prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.notification.count({ where }),
          prisma.notification.count({
            where: { userId, isRead: false },
          }),
        ]);

        return reply.send({
          notifications,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
          unreadCount,
        });
      } catch (error) {
        fastify.log.error('Error fetching notifications:', error);
        return reply.code(500).send({ error: 'Failed to fetch notifications' });
      }
    }
  );

  /**
   * PATCH /api/notifications/:id/read
   * Mark notification as read
   */
  fastify.patch<{ Params: { id: string } }>(
    '/:id/read',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const { id } = request.params;

        const notification = await prisma.notification.update({
          where: {
            id,
            userId, // Ensure user owns this notification
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        return reply.send(notification);
      } catch (error) {
        fastify.log.error('Error marking notification as read:', error);
        return reply.code(500).send({ error: 'Failed to update notification' });
      }
    }
  );

  /**
   * POST /api/notifications/read-all
   * Mark all notifications as read
   */
  fastify.post('/read-all', async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return reply.send({ updated: result.count });
    } catch (error) {
      fastify.log.error('Error marking all as read:', error);
      return reply.code(500).send({ error: 'Failed to update notifications' });
    }
  });

  /**
   * DELETE /api/notifications/:id
   * Delete/dismiss a notification
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        await prisma.notification.delete({
          where: {
            id: request.params.id,
            userId,
          },
        });

        return reply.code(204).send();
      } catch (error) {
        fastify.log.error('Error deleting notification:', error);
        return reply.code(500).send({ error: 'Failed to delete notification' });
      }
    }
  );

  // ============================================
  // NOTIFICATION PREFERENCES
  // ============================================

  /**
   * GET /api/notifications/preferences
   * Get user's notification preferences
   */
  fastify.get('/preferences', async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const preferences = await prisma.notificationPreference.findMany({
        where: { userId },
        orderBy: { eventType: 'asc' },
      });

      return reply.send(preferences);
    } catch (error) {
      fastify.log.error('Error fetching preferences:', error);
      return reply.code(500).send({ error: 'Failed to fetch preferences' });
    }
  });

  /**
   * PUT /api/notifications/preferences
   * Update notification preference
   */
  fastify.put<{ Body: any }>('/preferences', async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const data = updatePreferenceSchema.parse(request.body);

      const preference = await prisma.notificationPreference.upsert({
        where: {
          userId_eventType: {
            userId,
            eventType: data.eventType,
          },
        },
        update: {
          enabled: data.enabled,
          emailEnabled: data.emailEnabled,
          inAppEnabled: data.inAppEnabled,
          webhookEnabled: data.webhookEnabled,
          digestEnabled: data.digestEnabled,
          digestFrequency: data.digestFrequency,
          digestTime: data.digestTime,
        },
        create: {
          userId,
          eventType: data.eventType,
          enabled: data.enabled ?? true,
          emailEnabled: data.emailEnabled ?? true,
          inAppEnabled: data.inAppEnabled ?? true,
          webhookEnabled: data.webhookEnabled ?? false,
          digestEnabled: data.digestEnabled ?? false,
          digestFrequency: data.digestFrequency ?? NotificationDigestFrequency.DAILY,
          digestTime: data.digestTime,
        },
      });

      return reply.send(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid preference data', details: error.issues });
      }
      fastify.log.error('Error updating preference:', error);
      return reply.code(500).send({ error: 'Failed to update preference' });
    }
  });

  // ============================================
  // WEBHOOK ENDPOINTS
  // ============================================

  /**
   * GET /api/notifications/webhooks
   * List user's webhook endpoints
   */
  fastify.get('/webhooks', async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const webhooks = await prisma.webhookEndpoint.findMany({
        where: { userId },
        include: {
          _count: {
            select: { deliveries: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(webhooks);
    } catch (error) {
      fastify.log.error('Error fetching webhooks:', error);
      return reply.code(500).send({ error: 'Failed to fetch webhooks' });
    }
  });

  /**
   * POST /api/notifications/webhooks
   * Create a webhook endpoint
   */
  fastify.post<{ Body: any }>('/webhooks', async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const data = createWebhookSchema.parse(request.body);

      const webhook = await prisma.webhookEndpoint.create({
        data: {
          userId,
          name: data.name,
          url: data.url,
          secret: data.secret,
          description: data.description,
          events: data.events || [],
          headers: data.headers || {},
          maxRetries: data.maxRetries,
          timeoutSeconds: data.timeoutSeconds,
        },
      });

      return reply.code(201).send(webhook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid webhook data', details: error.issues });
      }
      fastify.log.error('Error creating webhook:', error);
      return reply.code(500).send({ error: 'Failed to create webhook' });
    }
  });

  /**
   * PATCH /api/notifications/webhooks/:id
   * Update webhook endpoint
   */
  fastify.patch<{ Params: { id: string }; Body: any }>(
    '/webhooks/:id',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const data = createWebhookSchema.partial().parse(request.body);

        const webhook = await prisma.webhookEndpoint.update({
          where: {
            id: request.params.id,
            userId,
          },
          data: {
            name: data.name,
            url: data.url,
            secret: data.secret,
            description: data.description,
            events: data.events,
            headers: data.headers,
            maxRetries: data.maxRetries,
            timeoutSeconds: data.timeoutSeconds,
          },
        });

        return reply.send(webhook);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid webhook data', details: error.issues });
        }
        fastify.log.error('Error updating webhook:', error);
        return reply.code(500).send({ error: 'Failed to update webhook' });
      }
    }
  );

  /**
   * DELETE /api/notifications/webhooks/:id
   * Delete webhook endpoint
   */
  fastify.delete<{ Params: { id: string } }>(
    '/webhooks/:id',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        await prisma.webhookEndpoint.delete({
          where: {
            id: request.params.id,
            userId,
          },
        });

        return reply.code(204).send();
      } catch (error) {
        fastify.log.error('Error deleting webhook:', error);
        return reply.code(500).send({ error: 'Failed to delete webhook' });
      }
    }
  );

  /**
   * GET /api/notifications/webhooks/:id/deliveries
   * Get webhook delivery history
   */
  fastify.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/webhooks/:id/deliveries',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const page = parseInt(request.query.page || '1');
        const limit = parseInt(request.query.limit || '50');
        const skip = (page - 1) * limit;

        // Verify ownership
        const webhook = await prisma.webhookEndpoint.findFirst({
          where: {
            id: request.params.id,
            userId,
          },
        });

        if (!webhook) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }

        const [deliveries, total] = await Promise.all([
          prisma.webhookDelivery.findMany({
            where: { endpointId: request.params.id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.webhookDelivery.count({
            where: { endpointId: request.params.id },
          }),
        ]);

        return reply.send({
          deliveries,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        fastify.log.error('Error fetching deliveries:', error);
        return reply.code(500).send({ error: 'Failed to fetch deliveries' });
      }
    }
  );

  /**
   * POST /api/notifications/webhooks/:webhookId/deliveries/:deliveryId/retry
   * Retry a failed webhook delivery
   */
  fastify.post<{ Params: { webhookId: string; deliveryId: string } }>(
    '/webhooks/:webhookId/deliveries/:deliveryId/retry',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        // Verify ownership
        const webhook = await prisma.webhookEndpoint.findFirst({
          where: {
            id: request.params.webhookId,
            userId,
          },
        });

        if (!webhook) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }

        // Attempt retry
        const success = await attemptDelivery(request.params.deliveryId);

        return reply.send({ success });
      } catch (error) {
        fastify.log.error('Error retrying delivery:', error);
        return reply.code(500).send({ error: 'Failed to retry delivery' });
      }
    }
  );

  /**
   * POST /api/notifications/webhooks/:id/test
   * Send a test webhook
   */
  fastify.post<{ Params: { id: string } }>(
    '/webhooks/:id/test',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const webhook = await prisma.webhookEndpoint.findFirst({
          where: {
            id: request.params.id,
            userId,
          },
        });

        if (!webhook) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }

        // Import deliverWebhook dynamically to avoid circular deps
        const { deliverWebhook } = await import('../services/webhook');

        await deliverWebhook(
          webhook.id,
          NotificationType.CUSTOM,
          'test-' + Date.now(),
          {
            message: 'This is a test webhook notification',
            timestamp: new Date().toISOString(),
          }
        );

        return reply.send({ message: 'Test webhook sent' });
      } catch (error) {
        fastify.log.error('Error sending test webhook:', error);
        return reply.code(500).send({ error: 'Failed to send test webhook' });
      }
    }
  );

  // ============================================
  // EMAIL LOGS
  // ============================================

  /**
   * GET /api/notifications/emails
   * Get email delivery logs (admin only)
   */
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/emails',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const page = parseInt(request.query.page || '1');
        const limit = parseInt(request.query.limit || '50');
        const skip = (page - 1) * limit;

        const [emails, total] = await Promise.all([
          prisma.emailLog.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
              id: true,
              to: true,
              subject: true,
              status: true,
              sentAt: true,
              deliveredAt: true,
              createdAt: true,
            },
          }),
          prisma.emailLog.count(),
        ]);

        return reply.send({
          emails,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        fastify.log.error('Error fetching email logs:', error);
        return reply.code(500).send({ error: 'Failed to fetch email logs' });
      }
    }
  );
}