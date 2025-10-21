import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../middleware/auth.js';
import { ImageTools } from '../services/imageTools.js';
import { VideoTools } from '../services/videoTools.js';
import { getPreset, listPresets, getDerivativeSet, listDerivativeSets } from '../services/mediaPresets.js';
import { AuditService } from '../observability/audit.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProcessImageBody {
  assetId: string;
  preset: string;
}

interface ProcessVideoBody {
  assetId: string;
  preset: string;
}

interface GenerateDerivativesBody {
  assetId: string;
  derivativeSet: string;
}

export async function mediaProcessRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/media/presets
   * List all available presets
   */
  fastify.get('/admin/media/presets', async (request, reply) => {
    try {
      const presets = listPresets();

      return reply.status(200).send({
        success: true,
        data: presets,
      });
    } catch (error) {
      request.log.error(error, 'Error listing presets');
      throw error;
    }
  });

  /**
   * GET /admin/media/derivative-sets
   * List all derivative sets
   */
  fastify.get('/admin/media/derivative-sets', async (request, reply) => {
    try {
      const sets = listDerivativeSets();

      return reply.status(200).send({
        success: true,
        data: sets,
      });
    } catch (error) {
      request.log.error(error, 'Error listing derivative sets');
      throw error;
    }
  });

  /**
   * POST /admin/media/process-image
   * Process an image asset with a preset
   */
  fastify.post<{ Body: ProcessImageBody }>(
    '/admin/media/process-image',
    async (request, reply) => {
      const { assetId, preset: presetName } = request.body;

      // Validate input
      if (!assetId || !presetName) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Asset ID and preset are required',
        });
      }

      try {
        // Find asset
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
        });

        if (!asset) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Asset not found',
          });
        }

        // Validate asset type
        if (asset.fileType !== 'IMAGE') {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Asset is not an image',
          });
        }

        // Get preset
        const preset = getPreset(presetName);
        if (!preset) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Preset not found',
          });
        }

        // Process image
        const outputPath = asset.filePath.replace(/(\.\w+)$/, `-${presetName}$1`);
        
        const result = await ImageTools.processImage({
          inputPath: asset.filePath,
          outputPath,
          ...preset.image,
        });

        if (!result.success) {
          return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: result.error || 'Failed to process image',
          });
        }

        // Audit log
        await AuditService.log({
          action: 'IMAGE_PROCESSED',
          entityType: 'Asset',
          entityId: assetId,
          userId: request.user?.userId,
          metadata: {
            preset: presetName,
            outputPath: result.outputPath,
            hash: result.hash,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          assetId,
          preset: presetName,
          outputPath: result.outputPath,
          userId: request.user?.userId,
        }, 'Image processed');

        return reply.status(200).send({
          success: true,
          message: 'Image processed successfully',
          data: result,
        });
      } catch (error) {
        request.log.error(error, 'Error processing image');
        throw error;
      }
    }
  );

  /**
   * POST /admin/media/process-video
   * Process a video asset with a preset
   */
  fastify.post<{ Body: ProcessVideoBody }>(
    '/admin/media/process-video',
    async (request, reply) => {
      const { assetId, preset: presetName } = request.body;

      // Validate input
      if (!assetId || !presetName) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Asset ID and preset are required',
        });
      }

      try {
        // Find asset
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
        });

        if (!asset) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Asset not found',
          });
        }

        // Validate asset type
        if (asset.fileType !== 'VIDEO') {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Asset is not a video',
          });
        }

        // Get preset
        const preset = getPreset(presetName);
        if (!preset) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Preset not found',
          });
        }

        // Process video
        const outputPath = asset.filePath.replace(/\.\w+$/, `-${presetName}.mp4`);
        
        const result = await VideoTools.processVideo({
          inputPath: asset.filePath,
          outputPath,
          ...preset.video,
        });

        if (!result.success) {
          return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: result.error || 'Failed to process video',
          });
        }

        // Audit log
        await AuditService.log({
          action: 'VIDEO_PROCESSED',
          entityType: 'Asset',
          entityId: assetId,
          userId: request.user?.userId,
          metadata: {
            preset: presetName,
            outputPath: result.outputPath,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          assetId,
          preset: presetName,
          outputPath: result.outputPath,
          userId: request.user?.userId,
        }, 'Video processed');

        return reply.status(200).send({
          success: true,
          message: 'Video processed successfully',
          data: result,
        });
      } catch (error) {
        request.log.error(error, 'Error processing video');
        throw error;
      }
    }
  );

  /**
   * POST /admin/media/generate-derivatives
   * Generate multiple derivatives for an asset
   */
  fastify.post<{ Body: GenerateDerivativesBody }>(
    '/admin/media/generate-derivatives',
    async (request, reply) => {
      const { assetId, derivativeSet } = request.body;

      // Validate input
      if (!assetId || !derivativeSet) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Asset ID and derivative set are required',
        });
      }

      try {
        // Find asset
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
        });

        if (!asset) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Asset not found',
          });
        }

        // Get derivative set
        const presets = getDerivativeSet(derivativeSet);
        if (presets.length === 0) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Derivative set not found',
          });
        }

        // Process each preset
        const results: any[] = [];
        
        for (const presetName of presets) {
          const preset = getPreset(presetName);
          if (!preset) continue;

          // Determine if this preset applies to this asset type
          const isApplicable = 
            preset.type === 'both' ||
            (preset.type === 'image' && asset.fileType === 'IMAGE') ||
            (preset.type === 'video' && asset.fileType === 'VIDEO');

          if (!isApplicable) continue;

          try {
            let result;
            
            if (asset.fileType === 'IMAGE' && preset.image) {
              const outputPath = asset.filePath.replace(/(\.\w+)$/, `-${presetName}$1`);
              result = await ImageTools.processImage({
                inputPath: asset.filePath,
                outputPath,
                ...preset.image,
              });
            } else if (asset.fileType === 'VIDEO' && preset.video) {
              const outputPath = asset.filePath.replace(/\.\w+$/, `-${presetName}.mp4`);
              result = await VideoTools.processVideo({
                inputPath: asset.filePath,
                outputPath,
                ...preset.video,
              });
            }

            if (result) {
              results.push({
                preset: presetName,
                success: result.success,
                outputPath: result.outputPath,
              });
            }
          } catch (error) {
            results.push({
              preset: presetName,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Audit log
        await AuditService.log({
          action: 'DERIVATIVES_GENERATED',
          entityType: 'Asset',
          entityId: assetId,
          userId: request.user?.userId,
          metadata: {
            derivativeSet,
            count: results.length,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          assetId,
          derivativeSet,
          count: results.length,
          userId: request.user?.userId,
        }, 'Derivatives generated');

        return reply.status(200).send({
          success: true,
          message: `Generated ${results.length} derivatives`,
          data: results,
        });
      } catch (error) {
        request.log.error(error, 'Error generating derivatives');
        throw error;
      }
    }
  );

  /**
   * GET /admin/media/metadata/:assetId
   * Get metadata for an asset
   */
  fastify.get<{ Params: { assetId: string } }>(
    '/admin/media/metadata/:assetId',
    async (request, reply) => {
      const { assetId } = request.params;

      try {
        // Find asset
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
        });

        if (!asset) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Asset not found',
          });
        }

        let metadata: any = null;

        if (asset.fileType === 'IMAGE') {
          metadata = await ImageTools.getMetadata(asset.filePath);
        } else if (asset.fileType === 'VIDEO') {
          metadata = await VideoTools.getMetadata(asset.filePath);
        }

        return reply.status(200).send({
          success: true,
          data: {
            assetId,
            fileType: asset.fileType,
            metadata,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error getting metadata');
        throw error;
      }
    }
  );
}