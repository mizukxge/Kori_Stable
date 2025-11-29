import { FastifyInstance } from 'fastify';
import { GalleryService } from '../services/gallery.js';
import { notifyGalleryViewed } from '../services/notify.js';

export async function publicGalleryRoutes(fastify: FastifyInstance) {
  /**
   * GET /g/:token/meta
   * Get gallery metadata (public, no auth required)
   */
  fastify.get('/g/:token/meta', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const gallery = await GalleryService.getGalleryByToken(token);

      // Return basic metadata (hide sensitive info)
      return reply.status(200).send({
        success: true,
        data: {
          name: gallery.name,
          description: gallery.description,
          isPasswordProtected: !!gallery.password,
          expiresAt: gallery.expiresAt,
          isActive: gallery.isActive,
          viewCount: gallery.viewCount,
          client: gallery.client ? {
            name: gallery.client.name,
          } : null,
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

      request.log.error(error, 'Error fetching gallery metadata');
      throw error;
    }
  });

  /**
   * POST /g/:token/password
   * Verify password for protected gallery
   */
  fastify.post('/g/:token/password', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const { password } = request.body as { password: string };

      if (!password) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Password is required',
        });
      }

      const result = await GalleryService.validateAccess(token, password);

      if (!result.valid) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: result.reason || 'Access denied',
        });
      }

      request.log.info(
        {
          galleryToken: token,
          galleryName: result.gallery?.name,
        },
        'Gallery password verified'
      );

      return reply.status(200).send({
        success: true,
        message: 'Password verified',
        data: {
          name: result.gallery.name,
          description: result.gallery.description,
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

      request.log.error(error, 'Error verifying gallery password');
      throw error;
    }
  });

  /**
   * GET /g/:token/items
   * Get gallery assets (requires password if protected)
   */
  fastify.get('/g/:token/items', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const { password } = request.query as { password?: string };

      // Validate access
      const result = await GalleryService.validateAccess(token, password);

      if (!result.valid) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: result.reason || 'Access denied',
        });
      }

      // Get gallery items
      const items = await GalleryService.getGalleryItems(token);

      request.log.info(
        {
          galleryToken: token,
          itemCount: items.length,
        },
        'Gallery items accessed'
      );

      // Send notification to gallery owner
      try {
        await notifyGalleryViewed(
          result.gallery.userId,
          result.gallery.name,
          result.gallery.client?.name
        );
      } catch (notifyError) {
        request.log.warn('Failed to send gallery view notification:', notifyError);
        // Don't fail the request if notification fails
      }

      return reply.status(200).send({
        success: true,
        data: items,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Gallery not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Gallery not found',
        });
      }

      request.log.error(error, 'Error fetching gallery items');
      throw error;
    }
  });

  /**
   * GET /g/:token
   * Redirect to meta endpoint (convenience)
   */
  fastify.get('/g/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    return reply.redirect(301, `/g/${token}/meta`);
  });

  /**
   * GET /g/:token/style
   * Get gallery's default style (public, no auth required)
   */
  fastify.get('/g/:token/style', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const gallery = await GalleryService.getGalleryByToken(token);
      const style = await GalleryService.getGalleryStyle(gallery.id);

      return reply.status(200).send({
        success: true,
        data: style,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Gallery not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Gallery not found',
        });
      }

      request.log.error(error, 'Error fetching gallery style');
      throw error;
    }
  });

  /**
   * GET /g/:token/preferences
   * Get viewer's style preferences for this gallery
   */
  fastify.get('/g/:token/preferences', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const viewerIdentifier = (request.query as any).viewerId || '';

      const gallery = await GalleryService.getGalleryByToken(token);
      const preferences = await GalleryService.getViewerPreferences(
        gallery.id,
        viewerIdentifier
      );

      return reply.status(200).send({
        success: true,
        data: preferences,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Gallery not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Gallery not found',
        });
      }

      request.log.error(error, 'Error fetching viewer preferences');
      throw error;
    }
  });

  /**
   * POST /g/:token/preferences
   * Save viewer's style preferences for this gallery
   */
  fastify.post('/g/:token/preferences', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const { viewerId, styleName, customSettings } = request.body as {
        viewerId: string;
        styleName: string;
        customSettings?: Record<string, any>;
      };

      if (!viewerId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'viewerId is required',
        });
      }

      if (!styleName) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'styleName is required',
        });
      }

      const gallery = await GalleryService.getGalleryByToken(token);
      const preferences = await GalleryService.updateViewerPreferences(
        gallery.id,
        viewerId,
        styleName,
        customSettings
      );

      return reply.status(200).send({
        success: true,
        message: 'Preferences saved successfully',
        data: preferences,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Gallery not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Gallery not found',
        });
      }

      if (error instanceof Error && error.message.includes('Invalid style')) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error saving viewer preferences');
      throw error;
    }
  });
}