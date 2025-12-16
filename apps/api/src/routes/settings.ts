import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  legalName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postcode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  vatNumber: z.string().max(50).optional(),
  taxId: z.string().max(50).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  currency: z.string().length(3).optional(),
  features: z.record(z.boolean()).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateSettingSchema = z.object({
  value: z.any(),
  category: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  reason: z.string().max(500).optional(),
});

export default async function settingsRoutes(fastify: FastifyInstance) {
  // ============================================
  // ORGANIZATION ROUTES
  // ============================================

  /**
   * GET /api/settings/organization
   * Get organization profile
   */
  fastify.get('/organization', async (request, reply) => {
    try {
      // Get or create default organization
      let organization = await prisma.organization.findFirst();

      if (!organization) {
        organization = await prisma.organization.create({
          data: {
            name: 'Kori Photography',
            email: 'hello@kori.photography',
            country: 'GB',
            defaultTaxRate: 20,
            timezone: 'Europe/London',
            locale: 'en-GB',
            currency: 'GBP',
            features: {},
          },
        });
      }

      return reply.send(organization);
    } catch (error) {
      request.log.error(error, 'Error fetching organization');
      return reply.code(500).send({ error: 'Failed to fetch organization' });
    }
  });

  /**
   * PATCH /api/settings/organization
   * Update organization profile
   */
  fastify.patch<{ Body: any }>('/organization', async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const data = updateOrganizationSchema.parse(request.body);

      // Get or create organization
      let organization = await prisma.organization.findFirst();

      if (!organization) {
        organization = await prisma.organization.create({
          data: {
            name: data.name || 'Kori Photography',
            legalName: data.legalName,
            email: data.email || 'hello@kori.photography',
            phone: data.phone,
            website: data.website,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            postcode: data.postcode,
            country: data.country || 'GB',
            vatNumber: data.vatNumber,
            taxId: data.taxId,
            defaultTaxRate: data.defaultTaxRate || 20,
            logoUrl: data.logoUrl,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            accentColor: data.accentColor,
            timezone: data.timezone || 'Europe/London',
            locale: data.locale || 'en-GB',
            currency: data.currency || 'GBP',
            features: (data.features as any) || {},
            metadata: (data.metadata as any),
          },
        });
      } else {
        organization = await prisma.organization.update({
          where: { id: organization.id },
          data: {
            name: data.name,
            legalName: data.legalName,
            email: data.email,
            phone: data.phone,
            website: data.website,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            postcode: data.postcode,
            country: data.country,
            vatNumber: data.vatNumber,
            taxId: data.taxId,
            defaultTaxRate: data.defaultTaxRate,
            logoUrl: data.logoUrl,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            accentColor: data.accentColor,
            timezone: data.timezone,
            locale: data.locale,
            currency: data.currency,
            features: (data.features as any),
            metadata: (data.metadata as any),
          },
        });
      }

      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'Organization',
          entityId: organization.id,
          userId,
          changes: data as any,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });

      return reply.send(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid data', details: error.issues });
      }
      request.log.error(error, 'Error updating organization');
      return reply.code(500).send({ error: 'Failed to update organization' });
    }
  });

  // ============================================
  // SETTINGS ROUTES
  // ============================================

  /**
   * GET /api/settings
   * Get all settings (optionally filtered by category)
   */
  fastify.get<{ Querystring: { category?: string; publicOnly?: string } }>(
    '/',
    async (request, reply) => {
      try {
        const { category, publicOnly } = request.query;

        const where: any = {};
        if (category) where.category = category;
        if (publicOnly === 'true') where.isPublic = true;

        const settings = await prisma.setting.findMany({
          where,
          orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });

        return reply.send(settings);
      } catch (error) {
        request.log.error(error, 'Error fetching settings');
        return reply.code(500).send({ error: 'Failed to fetch settings' });
      }
    }
  );

  /**
   * GET /api/settings/:key
   * Get a specific setting by key
   */
  fastify.get<{ Params: { key: string } }>('/:key', async (request, reply) => {
    try {
      const { key } = request.params;

      const setting = await prisma.setting.findUnique({
        where: { key },
      });

      if (!setting) {
        return reply.code(404).send({ error: 'Setting not found' });
      }

      return reply.send(setting);
    } catch (error) {
      request.log.error(error, 'Error fetching setting');
      return reply.code(500).send({ error: 'Failed to fetch setting' });
    }
  });

  /**
   * PUT /api/settings/:key
   * Create or update a setting
   */
  fastify.put<{ Params: { key: string }; Body: any }>(
    '/:key',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const { key } = request.params;
        const data = updateSettingSchema.parse(request.body);

        // Get existing setting for history
        const existing = await prisma.setting.findUnique({
          where: { key },
        });

        // Upsert setting
        const setting = await prisma.setting.upsert({
          where: { key },
          update: {
            value: data.value as any,
            category: data.category,
            description: data.description,
            isPublic: data.isPublic,
            lastChangedBy: userId,
          },
          create: {
            key,
            value: data.value as any,
            category: data.category,
            description: data.description,
            isPublic: data.isPublic ?? false,
            isEncrypted: false,
            lastChangedBy: userId,
          },
        });

        // Create history entry
        await prisma.settingHistory.create({
          data: {
            settingKey: key,
            oldValue: existing?.value || null,
            newValue: data.value as any,
            changedBy: userId,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            reason: data.reason,
          },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: existing ? 'UPDATE' : 'CREATE',
            entityType: 'Setting',
            entityId: key,
            userId,
            changes: {
              key,
              oldValue: existing?.value,
              newValue: data.value,
            } as any,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          },
        });

        return reply.send(setting);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid data', details: error.issues });
        }
        request.log.error(error, 'Error updating setting');
        return reply.code(500).send({ error: 'Failed to update setting' });
      }
    }
  );

  /**
   * DELETE /api/settings/:key
   * Delete a setting
   */
  fastify.delete<{ Params: { key: string } }>('/:key', async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const { key } = request.params;

      // Get setting before deletion for history
      const setting = await prisma.setting.findUnique({
        where: { key },
      });

      if (!setting) {
        return reply.code(404).send({ error: 'Setting not found' });
      }

      // Create history entry
      await prisma.settingHistory.create({
        data: {
          settingKey: key,
          oldValue: setting.value,
          newValue: null as any,
          changedBy: userId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          reason: 'Setting deleted',
        },
      });

      // Delete setting
      await prisma.setting.delete({
        where: { key },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'Setting',
          entityId: key,
          userId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });

      return reply.code(204).send();
    } catch (error) {
      request.log.error(error, 'Error deleting setting');
      return reply.code(500).send({ error: 'Failed to delete setting' });
    }
  });

  /**
   * GET /api/settings/:key/history
   * Get change history for a setting
   */
  fastify.get<{ Params: { key: string }; Querystring: { page?: string; limit?: string } }>(
    '/:key/history',
    async (request, reply) => {
      try {
        const { key } = request.params;
        const page = parseInt(request.query.page || '1');
        const limit = parseInt(request.query.limit || '50');
        const skip = (page - 1) * limit;

        const [history, total] = await Promise.all([
          prisma.settingHistory.findMany({
            where: { settingKey: key },
            include: {
              changedByUser: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.settingHistory.count({
            where: { settingKey: key },
          }),
        ]);

        return reply.send({
          history,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        request.log.error(error, 'Error fetching setting history');
        return reply.code(500).send({ error: 'Failed to fetch history' });
      }
    }
  );

  // ============================================
  // FEATURE FLAGS
  // ============================================

  /**
   * GET /api/settings/features
   * Get all feature flags
   */
  fastify.get('/features', async (request, reply) => {
    try {
      const organization = await prisma.organization.findFirst();

      if (!organization) {
        return reply.send({ features: {} });
      }

      return reply.send({ features: organization.features || {} });
    } catch (error) {
      request.log.error(error, 'Error fetching features');
      return reply.code(500).send({ error: 'Failed to fetch features' });
    }
  });

  /**
   * PUT /api/settings/features/:feature
   * Toggle a feature flag
   */
  fastify.put<{ Params: { feature: string }; Body: { enabled: boolean } }>(
    '/features/:feature',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const { feature } = request.params;
        const { enabled } = z.object({ enabled: z.boolean() }).parse(request.body);

        // Get or create organization
        let organization = await prisma.organization.findFirst();

        if (!organization) {
          organization = await prisma.organization.create({
            data: {
              name: 'Kori Photography',
              email: 'hello@kori.photography',
              features: { [feature]: enabled },
            },
          });
        } else {
          const features = (organization.features as any) || {};
          features[feature] = enabled;

          organization = await prisma.organization.update({
            where: { id: organization.id },
            data: { features: features as any },
          });
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: 'UPDATE',
            entityType: 'FeatureFlag',
            entityId: feature,
            userId,
            changes: { feature, enabled } as any,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          },
        });

        return reply.send({ feature, enabled, features: organization.features });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid data', details: error.issues });
        }
        request.log.error(error, 'Error updating feature');
        return reply.code(500).send({ error: 'Failed to update feature' });
      }
    }
  );

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * POST /api/settings/bulk
   * Bulk update multiple settings
   */
  fastify.post<{ Body: { settings: Record<string, any>; reason?: string } }>(
    '/bulk',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const { settings, reason } = z
          .object({
            settings: z.record(z.any()),
            reason: z.string().optional(),
          })
          .parse(request.body);

        const results = [];

        for (const [key, value] of Object.entries(settings)) {
          // Get existing for history
          const existing = await prisma.setting.findUnique({
            where: { key },
          });

          // Upsert setting
          const setting = await prisma.setting.upsert({
            where: { key },
            update: {
              value: value as any,
              lastChangedBy: userId,
            },
            create: {
              key,
              value: value as any,
              lastChangedBy: userId,
            },
          });

          // Create history
          await prisma.settingHistory.create({
            data: {
              settingKey: key,
              oldValue: existing?.value || null,
              newValue: value as any,
              changedBy: userId,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              reason,
            },
          });

          results.push(setting);
        }

        // Create audit log for bulk operation
        await prisma.auditLog.create({
          data: {
            action: 'BULK_UPDATE',
            entityType: 'Setting',
            entityId: 'bulk',
            userId,
            changes: { count: results.length, settings } as any,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          },
        });

        return reply.send({ updated: results.length, settings: results });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid data', details: error.issues });
        }
        request.log.error(error, 'Error bulk updating settings');
        return reply.code(500).send({ error: 'Failed to bulk update settings' });
      }
    }
  );
}