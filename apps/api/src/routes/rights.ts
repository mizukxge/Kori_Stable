import { FastifyInstance } from 'fastify';
import { RightsService } from '../services/rights.js';
import { MetadataService } from '../services/metadata.js';
import { requireAdmin } from '../middleware/auth.js';

export async function rightsRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/rights-presets
   * List all rights presets
   */
  fastify.get('/admin/rights-presets', async (request, reply) => {
    try {
      const query = request.query as any;
      const activeOnly = query.activeOnly !== 'false';

      const presets = await RightsService.listRightsPresets(activeOnly);

      return reply.status(200).send({
        success: true,
        data: presets,
      });
    } catch (error) {
      request.log.error(error, 'Error listing rights presets');
      throw error;
    }
  });

  /**
   * GET /admin/rights-presets/:id
   * Get a single rights preset
   */
  fastify.get('/admin/rights-presets/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const preset = await RightsService.getRightsPreset(id);

      return reply.status(200).send({
        success: true,
        data: preset,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Rights preset not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Rights preset not found',
        });
      }

      request.log.error(error, 'Error fetching rights preset');
      throw error;
    }
  });

  /**
   * POST /admin/rights-presets
   * Create a new rights preset
   */
  fastify.post('/admin/rights-presets', async (request, reply) => {
    try {
      const data = request.body as any;

      const preset = await RightsService.createRightsPreset(
        data,
        request.user!.userId
      );

      request.log.info(
        {
          presetId: preset.id,
          userId: request.user!.userId,
        },
        'Rights preset created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Rights preset created successfully',
        data: preset,
      });
    } catch (error) {
      request.log.error(error, 'Error creating rights preset');
      throw error;
    }
  });

  /**
   * PUT /admin/rights-presets/:id
   * Update a rights preset
   */
  fastify.put('/admin/rights-presets/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const preset = await RightsService.updateRightsPreset(
        id,
        data,
        request.user!.userId
      );

      request.log.info(
        {
          presetId: id,
          userId: request.user!.userId,
        },
        'Rights preset updated'
      );

      return reply.status(200).send({
        success: true,
        message: 'Rights preset updated successfully',
        data: preset,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Rights preset not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Rights preset not found',
        });
      }

      request.log.error(error, 'Error updating rights preset');
      throw error;
    }
  });

  /**
   * DELETE /admin/rights-presets/:id
   * Delete a rights preset (soft delete)
   */
  fastify.delete('/admin/rights-presets/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const preset = await RightsService.deleteRightsPreset(
        id,
        request.user!.userId
      );

      request.log.info(
        {
          presetId: id,
          userId: request.user!.userId,
        },
        'Rights preset deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Rights preset deleted successfully',
        data: preset,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Rights preset not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Rights preset not found',
        });
      }

      request.log.error(error, 'Error deleting rights preset');
      throw error;
    }
  });

  /**
   * POST /admin/assets/:id/apply-preset
   * Apply rights preset to a single asset
   */
  fastify.post('/admin/assets/:id/apply-preset', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (!body.presetId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'presetId is required',
        });
      }

      await MetadataService.applyRightsPreset(id, body.presetId, {
        dryRun: false,
        overwrite: body.overwrite || false,
      });

      request.log.info(
        {
          assetId: id,
          presetId: body.presetId,
          userId: request.user!.userId,
        },
        'Rights preset applied to asset'
      );

      return reply.status(200).send({
        success: true,
        message: 'Rights preset applied successfully',
      });
    } catch (error) {
      request.log.error(error, 'Error applying rights preset');
      throw error;
    }
  });

  /**
   * POST /admin/assets/batch-apply-preset
   * Batch apply rights preset to multiple assets
   */
  fastify.post('/admin/assets/batch-apply-preset', async (request, reply) => {
    try {
      const body = request.body as any;

      if (!body.presetId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'presetId is required',
        });
      }

      if (!body.assetIds || !Array.isArray(body.assetIds)) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'assetIds array is required',
        });
      }

      const results = await MetadataService.batchApplyRightsPreset(
        body.assetIds,
        body.presetId,
        {
          dryRun: false,
          overwrite: body.overwrite || false,
        }
      );

      request.log.info(
        {
          presetId: body.presetId,
          assetCount: body.assetIds.length,
          success: results.success,
          failed: results.failed,
          userId: request.user!.userId,
        },
        'Batch rights preset applied'
      );

      return reply.status(200).send({
        success: true,
        message: 'Batch operation completed',
        data: results,
      });
    } catch (error) {
      request.log.error(error, 'Error in batch apply preset');
      throw error;
    }
  });

  /**
   * GET /admin/releases
   * List all releases
   */
  fastify.get('/admin/releases', async (request, reply) => {
    try {
      const query = request.query as any;

      const releases = await RightsService.listReleases({
        type: query.type,
        clientId: query.clientId,
      });

      return reply.status(200).send({
        success: true,
        data: releases,
      });
    } catch (error) {
      request.log.error(error, 'Error listing releases');
      throw error;
    }
  });

  /**
   * GET /admin/releases/:id
   * Get a single release
   */
  fastify.get('/admin/releases/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const release = await RightsService.getRelease(id);

      return reply.status(200).send({
        success: true,
        data: release,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Release not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Release not found',
        });
      }

      request.log.error(error, 'Error fetching release');
      throw error;
    }
  });

  /**
   * POST /admin/releases
   * Create a new release
   */
  fastify.post('/admin/releases', async (request, reply) => {
    try {
      const data = request.body as any;

      const release = await RightsService.createRelease(
        data,
        request.user!.userId
      );

      request.log.info(
        {
          releaseId: release.id,
          userId: request.user!.userId,
        },
        'Release created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Release created successfully',
        data: release,
      });
    } catch (error) {
      request.log.error(error, 'Error creating release');
      throw error;
    }
  });

  /**
   * PUT /admin/releases/:id
   * Update a release
   */
  fastify.put('/admin/releases/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const release = await RightsService.updateRelease(
        id,
        data,
        request.user!.userId
      );

      request.log.info(
        {
          releaseId: id,
          userId: request.user!.userId,
        },
        'Release updated'
      );

      return reply.status(200).send({
        success: true,
        message: 'Release updated successfully',
        data: release,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Release not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Release not found',
        });
      }

      request.log.error(error, 'Error updating release');
      throw error;
    }
  });

  /**
   * DELETE /admin/releases/:id
   * Delete a release
   */
  fastify.delete('/admin/releases/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const release = await RightsService.deleteRelease(id, request.user!.userId);

      request.log.info(
        {
          releaseId: id,
          userId: request.user!.userId,
        },
        'Release deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Release deleted successfully',
        data: release,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Release not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Release not found',
        });
      }

      request.log.error(error, 'Error deleting release');
      throw error;
    }
  });
}