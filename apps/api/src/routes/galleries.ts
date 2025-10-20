import { FastifyInstance } from 'fastify';
import { GalleryService } from '../services/gallery.js';
import { requireAdmin } from '../middleware/auth.js';

export async function galleriesRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/galleries/stats
   * Get gallery statistics
   */
  fastify.get('/admin/galleries/stats', async (request, reply) => {
    try {
      const stats = await GalleryService.getGalleryStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching gallery stats');
      throw error;
    }
  });

  /**
   * GET /admin/galleries
   * List all galleries
   */
  fastify.get('/admin/galleries', async (request, reply) => {
    try {
      const query = request.query as any;

      const galleries = await GalleryService.listGalleries({
        clientId: query.clientId,
        isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
      });

      return reply.status(200).send({
        success: true,
        data: galleries,
      });
    } catch (error) {
      request.log.error(error, 'Error listing galleries');
      throw error;
    }
  });

  /**
   * GET /admin/galleries/:id
   * Get a single gallery by ID
   */
  fastify.get('/admin/galleries/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const gallery = await GalleryService.getGalleryById(id);

      return reply.status(200).send({
        success: true,
        data: gallery,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Gallery not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Gallery not found',
        });
      }

      request.log.error(error, 'Error fetching gallery');
      throw error;
    }
  });

  /**
   * POST /admin/galleries
   * Create a new gallery
   */
  fastify.post('/admin/galleries', async (request, reply) => {
    try {
      const data = request.body as any;

      const gallery = await GalleryService.createGallery(
        data,
        request.user!.userId
      );

      request.log.info(
        {
          galleryId: gallery.id,
          token: gallery.token,
          userId: request.user!.userId,
        },
        'Gallery created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Gallery created successfully',
        data: {
          id: gallery.id,
          token: gallery.token,
          name: gallery.name,
          description: gallery.description,
          publicUrl: `/g/${gallery.token}`,
          isPasswordProtected: !!gallery.password,
          expiresAt: gallery.expiresAt,
          createdAt: gallery.createdAt,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error creating gallery');
      throw error;
    }
  });

  /**
   * PUT /admin/galleries/:id
   * Update a gallery
   */
  fastify.put('/admin/galleries/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const gallery = await GalleryService.updateGallery(
        id,
        data,
        request.user!.userId
      );

      request.log.info(
        {
          galleryId: id,
          userId: request.user!.userId,
        },
        'Gallery updated'
      );

      return reply.status(200).send({
        success: true,
        message: 'Gallery updated successfully',
        data: gallery,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Gallery not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Gallery not found',
        });
      }

      request.log.error(error, 'Error updating gallery');
      throw error;
    }
  });

  /**
   * DELETE /admin/galleries/:id
   * Delete a gallery
   */
  fastify.delete('/admin/galleries/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const gallery = await GalleryService.deleteGallery(id, request.user!.userId);

      request.log.info(
        {
          galleryId: id,
          userId: request.user!.userId,
        },
        'Gallery deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Gallery deleted successfully',
        data: {
          id: gallery.id,
          name: gallery.name,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Gallery not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Gallery not found',
        });
      }

      request.log.error(error, 'Error deleting gallery');
      throw error;
    }
  });

  /**
   * POST /admin/galleries/:id/assets
   * Add assets to gallery
   */
  fastify.post('/admin/galleries/:id/assets', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { assetIds } = request.body as { assetIds: string[] };

      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'assetIds array is required',
        });
      }

      await GalleryService.addAssetsToGallery(id, assetIds);

      request.log.info(
        {
          galleryId: id,
          assetCount: assetIds.length,
          userId: request.user!.userId,
        },
        'Assets added to gallery'
      );

      return reply.status(200).send({
        success: true,
        message: 'Assets added to gallery',
        data: {
          galleryId: id,
          addedCount: assetIds.length,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error adding assets to gallery');
      throw error;
    }
  });

  /**
   * DELETE /admin/galleries/:id/assets/:assetId
   * Remove asset from gallery
   */
  fastify.delete('/admin/galleries/:id/assets/:assetId', async (request, reply) => {
    try {
      const { id, assetId } = request.params as { id: string; assetId: string };

      await GalleryService.removeAssetFromGallery(id, assetId);

      request.log.info(
        {
          galleryId: id,
          assetId,
          userId: request.user!.userId,
        },
        'Asset removed from gallery'
      );

      return reply.status(200).send({
        success: true,
        message: 'Asset removed from gallery',
      });
    } catch (error) {
      request.log.error(error, 'Error removing asset from gallery');
      throw error;
    }
  });

  /**
   * PUT /admin/galleries/:id/reorder
   * Reorder assets in gallery
   */
  fastify.put('/admin/galleries/:id/reorder', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { assetIds } = request.body as { assetIds: string[] };

      if (!assetIds || !Array.isArray(assetIds)) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'assetIds array is required',
        });
      }

      await GalleryService.reorderAssets(id, assetIds);

      request.log.info(
        {
          galleryId: id,
          userId: request.user!.userId,
        },
        'Gallery assets reordered'
      );

      return reply.status(200).send({
        success: true,
        message: 'Assets reordered successfully',
      });
    } catch (error) {
      request.log.error(error, 'Error reordering gallery assets');
      throw error;
    }
  });
}