import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const searchSchema = z.object({
  q: z.string().optional(), // Search query
  type: z.enum(['client', 'asset', 'invoice', 'contract', 'document', 'gallery', 'all']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  // Facets/Filters
  status: z.string().optional(),
  category: z.string().optional(),
  clientId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  tags: z.string().optional(), // Comma-separated
});

const savedFilterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  query: z.string().optional(),
  entityType: z.string(),
  filters: z.record(z.any()),
  isDefault: z.boolean().default(false),
});

// ============================================
// SEARCH ROUTES
// ============================================

/**
 * GET /api/search
 * Universal search across all entities
 */
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const params = searchSchema.parse(req.query);
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
        
        // Get facets
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
        
        // Get facets
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
        
        // Get facets
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
        
        // Get facets
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

    res.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid search parameters', details: error.errors });
    }
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================
// SAVED FILTERS ROUTES
// ============================================

/**
 * GET /api/search/filters
 * List user's saved filters
 */
router.get('/filters', async (req: Request, res: Response): Promise<any> => {
  try {
    // TODO: Get userId from auth middleware
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const filters = await prisma.savedFilter.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { lastUsedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(filters);
  } catch (error) {
    console.error('Error fetching saved filters:', error);
    res.status(500).json({ error: 'Failed to fetch saved filters' });
  }
});

/**
 * POST /api/search/filters
 * Save a new filter
 */
router.post('/filters', async (req: Request, res: Response): Promise<any> => {
  try {
    // TODO: Get userId from auth middleware
    const userId = req.body.userId as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const data = savedFilterSchema.parse(req.body);

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
        ...data,
        userId,
      },
    });

    res.status(201).json(filter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filter data', details: error.errors });
    }
    console.error('Error saving filter:', error);
    res.status(500).json({ error: 'Failed to save filter' });
  }
});

/**
 * PATCH /api/search/filters/:filterId
 * Update a saved filter
 */
router.patch('/filters/:filterId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { filterId } = req.params;
    const userId = req.body.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const data = savedFilterSchema.partial().parse(req.body);

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

    const filter = await prisma.savedFilter.update({
      where: {
        id: filterId,
        userId, // Ensure user owns this filter
      },
      data,
    });

    res.json(filter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filter data', details: error.errors });
    }
    console.error('Error updating filter:', error);
    res.status(500).json({ error: 'Failed to update filter' });
  }
});

/**
 * DELETE /api/search/filters/:filterId
 * Delete a saved filter
 */
router.delete('/filters/:filterId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { filterId } = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await prisma.savedFilter.delete({
      where: {
        id: filterId,
        userId, // Ensure user owns this filter
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting filter:', error);
    res.status(500).json({ error: 'Failed to delete filter' });
  }
});

/**
 * POST /api/search/filters/:filterId/use
 * Track filter usage
 */
router.post('/filters/:filterId/use', async (req: Request, res: Response): Promise<any> => {
  try {
    const { filterId } = req.params;

    const filter = await prisma.savedFilter.update({
      where: { id: filterId },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });

    res.json(filter);
  } catch (error) {
    console.error('Error tracking filter usage:', error);
    res.status(500).json({ error: 'Failed to track filter usage' });
  }
});

export default router;