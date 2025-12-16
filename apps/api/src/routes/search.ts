import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const searchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(['client', 'asset', 'invoice', 'contract', 'document', 'gallery', 'all']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  category: z.string().optional(),
  clientId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  tags: z.string().optional(),
});

const savedFilterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  query: z.string().optional(),
  entityType: z.string(),
  filters: z.record(z.string(), z.any()),
  isDefault: z.boolean().default(false),
});

export default async function searchRoutes(fastify: FastifyInstance) {
  // ============================================
  // SEARCH ROUTES
  // ============================================

  /**
   * GET /api/search
   * Universal search across all entities
   */
  fastify.get<{ Querystring: any }>('/', async (request, reply) => {
    try {
      const params = searchSchema.parse(request.query);
      const { q, type, page, limit, status, category, clientId, dateFrom, dateTo, tags } = params;

      const skip = (page - 1) * limit;
      const results: any = {
        query: q,
        type,
        page,
        limit,
        results: [],
        total: 0,
        facets: {},
      };

      // Search Clients
      if (type === 'client' || type === 'all') {
        const where: any = {};
        
        if (q) {
          where.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
          ];
        }
        
        if (status) where.status = status;
        if (tags) where.tags = { hasSome: tags.split(',') };

        const [clients, clientCount] = await Promise.all([
          prisma.client.findMany({
            where,
            skip: type === 'all' ? 0 : skip,
            take: type === 'all' ? 5 : limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.client.count({ where }),
        ]);

        if (type === 'client') {
          results.results = clients;
          results.total = clientCount;
          
          const statusFacets = await prisma.client.groupBy({
            by: ['status'],
            where: q ? where : {},
            _count: true,
          });
          results.facets.status = statusFacets.map((f) => ({ value: f.status, count: f._count }));
        } else {
          results.results.push(...clients.map((c) => ({ ...c, _type: 'client' })));
        }
      }

      // Search Assets
      if (type === 'asset' || type === 'all') {
        const where: any = {};
        
        if (q) {
          where.OR = [
            { filename: { contains: q, mode: 'insensitive' } },
            { storedName: { contains: q, mode: 'insensitive' } },
          ];
        }
        
        if (category) where.category = category;
        if (clientId) where.clientId = clientId;
        if (dateFrom || dateTo) {
          where.createdAt = {};
          if (dateFrom) where.createdAt.gte = new Date(dateFrom);
          if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const [assets, assetCount] = await Promise.all([
          prisma.asset.findMany({
            where,
            skip: type === 'all' ? 0 : skip,
            take: type === 'all' ? 5 : limit,
            include: {
              client: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.asset.count({ where }),
        ]);

        if (type === 'asset') {
          results.results = assets;
          results.total = assetCount;
          
          const categoryFacets = await prisma.asset.groupBy({
            by: ['category'],
            where: q ? where : {},
            _count: true,
          });
          results.facets.category = categoryFacets.map((f) => ({ value: f.category, count: f._count }));
        } else {
          results.results.push(...assets.map((a) => ({ ...a, _type: 'asset' })));
        }
      }

      // Search Invoices
      if (type === 'invoice' || type === 'all') {
        const where: any = {};
        
        if (q) {
          where.OR = [
            { invoiceNumber: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
          ];
        }
        
        if (status) where.status = status;
        if (clientId) where.clientId = clientId;
        if (dateFrom || dateTo) {
          where.createdAt = {};
          if (dateFrom) where.createdAt.gte = new Date(dateFrom);
          if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const [invoices, invoiceCount] = await Promise.all([
          prisma.invoice.findMany({
            where,
            skip: type === 'all' ? 0 : skip,
            take: type === 'all' ? 5 : limit,
            include: {
              client: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.invoice.count({ where }),
        ]);

        if (type === 'invoice') {
          results.results = invoices;
          results.total = invoiceCount;
          
          const statusFacets = await prisma.invoice.groupBy({
            by: ['status'],
            where: q ? where : {},
            _count: true,
          });
          results.facets.status = statusFacets.map((f) => ({ value: f.status, count: f._count }));
        } else {
          results.results.push(...invoices.map((i) => ({ ...i, _type: 'invoice' })));
        }
      }

      // Search Contracts
      if (type === 'contract' || type === 'all') {
        const where: any = {};
        
        if (q) {
          where.OR = [
            { contractNumber: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
          ];
        }
        
        if (status) where.status = status;
        if (clientId) where.clientId = clientId;

        const [contracts, contractCount] = await Promise.all([
          prisma.contract.findMany({
            where,
            skip: type === 'all' ? 0 : skip,
            take: type === 'all' ? 5 : limit,
            include: {
              client: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.contract.count({ where }),
        ]);

        if (type === 'contract') {
          results.results = contracts;
          results.total = contractCount;
          
          const statusFacets = await prisma.contract.groupBy({
            by: ['status'],
            where: q ? where : {},
            _count: true,
          });
          results.facets.status = statusFacets.map((f) => ({ value: f.status, count: f._count }));
        } else {
          results.results.push(...contracts.map((c) => ({ ...c, _type: 'contract' })));
        }
      }

      // Search Galleries
      if (type === 'gallery' || type === 'all') {
        const where: any = {};
        
        if (q) {
          where.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ];
        }
        
        if (clientId) where.clientId = clientId;
        if (status === 'active') where.isActive = true;
        if (status === 'inactive') where.isActive = false;

        const [galleries, galleryCount] = await Promise.all([
          prisma.gallery.findMany({
            where,
            skip: type === 'all' ? 0 : skip,
            take: type === 'all' ? 5 : limit,
            include: {
              client: { select: { id: true, name: true, email: true } },
              _count: { select: { assets: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.gallery.count({ where }),
        ]);

        if (type === 'gallery') {
          results.results = galleries;
          results.total = galleryCount;
        } else {
          results.results.push(...galleries.map((g) => ({ ...g, _type: 'gallery' })));
        }
      }

      // For 'all' type, sort by relevance/date and limit
      if (type === 'all') {
        results.results = results.results
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
        results.total = results.results.length;
      }

      return reply.send(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid search parameters', details: error.issues });
      }
      request.log.error(error, 'Search error');
      return reply.code(500).send({ error: 'Search failed' });
    }
  });

  // ============================================
  // SAVED FILTERS ROUTES
  // ============================================

  /**
   * GET /api/search/filters
   * List user's saved filters
   */
  fastify.get<{ Querystring: { userId?: string } }>('/filters', async (request, reply) => {
    try {
      const userId = request.query.userId;
      
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const filters = await prisma.savedFilter.findMany({
        where: { userId },
        orderBy: [
          { isDefault: 'desc' },
          { lastUsedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return reply.send(filters);
    } catch (error) {
      request.log.error(error, 'Error fetching saved filters');
      return reply.code(500).send({ error: 'Failed to fetch saved filters' });
    }
  });

  /**
   * POST /api/search/filters
   * Save a new filter
   */
  fastify.post<{ Body: any }>('/filters', async (request, reply) => {
    try {
      const userId = (request.body as any).userId;
      
      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const data = savedFilterSchema.parse(request.body);

      // If setting as default, unset other defaults for this entity type
      if (data.isDefault) {
        await prisma.savedFilter.updateMany({
          where: {
            userId,
            entityType: data.entityType,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const filter = await prisma.savedFilter.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          query: data.query,
          entityType: data.entityType,
          filters: data.filters as any,
          isDefault: data.isDefault,
        },
      });

      return reply.code(201).send(filter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid filter data', details: error.issues });
      }
      request.log.error(error, 'Error saving filter');
      return reply.code(500).send({ error: 'Failed to save filter' });
    }
  });

  /**
   * PATCH /api/search/filters/:filterId
   * Update a saved filter
   */
  fastify.patch<{ Params: { filterId: string }; Body: any }>(
    '/filters/:filterId',
    async (request, reply) => {
      try {
        const { filterId } = request.params;
        const userId = (request.body as any).userId;

        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        const data = savedFilterSchema.partial().parse(request.body);

        // If setting as default, unset other defaults
        if (data.isDefault) {
          const existingFilter = await prisma.savedFilter.findUnique({
            where: { id: filterId },
          });

          if (existingFilter) {
            await prisma.savedFilter.updateMany({
              where: {
                userId,
                entityType: existingFilter.entityType,
                isDefault: true,
                id: { not: filterId },
              },
              data: { isDefault: false },
            });
          }
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.query !== undefined) updateData.query = data.query;
        if (data.entityType !== undefined) updateData.entityType = data.entityType;
        if (data.filters !== undefined) updateData.filters = data.filters;
        if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

        const filter = await prisma.savedFilter.update({
          where: {
            id: filterId,
            userId,
          },
          data: updateData,
        });

        return reply.send(filter);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid filter data', details: error.issues });
        }
        request.log.error(error, 'Error updating filter');
        return reply.code(500).send({ error: 'Failed to update filter' });
      }
    }
  );

  /**
   * DELETE /api/search/filters/:filterId
   * Delete a saved filter
   */
  fastify.delete<{ Params: { filterId: string }; Querystring: { userId?: string } }>(
    '/filters/:filterId',
    async (request, reply) => {
      try {
        const { filterId } = request.params;
        const userId = request.query.userId;

        if (!userId) {
          return reply.code(401).send({ error: 'Authentication required' });
        }

        await prisma.savedFilter.delete({
          where: {
            id: filterId,
            userId,
          },
        });

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, 'Error deleting filter');
        return reply.code(500).send({ error: 'Failed to delete filter' });
      }
    }
  );

  /**
   * POST /api/search/filters/:filterId/use
   * Track filter usage
   */
  fastify.post<{ Params: { filterId: string } }>(
    '/filters/:filterId/use',
    async (request, reply) => {
      try {
        const { filterId } = request.params;

        const filter = await prisma.savedFilter.update({
          where: { id: filterId },
          data: {
            lastUsedAt: new Date(),
            usageCount: { increment: 1 },
          },
        });

        return reply.send(filter);
      } catch (error) {
        request.log.error(error, 'Error tracking filter usage');
        return reply.code(500).send({ error: 'Failed to track filter usage' });
      }
    }
  );
}