import { FastifyInstance } from 'fastify';
import { AssetService } from '../services/assets.js';
import { requireAdmin } from '../middleware/auth.js';
import multipart from '@fastify/multipart';

// Supported file types
const ALLOWED_MIME_TYPES = [
  // Images - RAW formats
  'image/x-canon-cr2',
  'image/x-nikon-nef',
  'image/x-sony-arw',
  'image/x-adobe-dng',
  'image/x-fuji-raf',
  'image/x-olympus-orf',
  'image/x-panasonic-raw',
  'image/x-pentax-pef',
  
  // Images - Edited formats
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
  'image/webp',
  'image/heic',
  'image/heif',
  
  // Videos
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export async function ingestRoutes(fastify: FastifyInstance) {
  // Register multipart plugin for this route prefix
  await fastify.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 1, // One file at a time
    },
  });

  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * POST /admin/assets/upload
   * Upload a new asset
   */
  fastify.post('/admin/assets/upload', async (request, reply) => {
    try {
      // Get uploaded file
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'No file uploaded',
        });
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: `Unsupported file type: ${data.mimetype}`,
        });
      }

      // Read file buffer
      const buffer = await data.toBuffer();

      // Get optional clientId from fields
      const fields = data.fields as any;
      const clientId = fields?.clientId?.value;

      // Upload asset
      const asset = await AssetService.uploadAsset(
        {
          filename: data.filename,
          data: buffer,
          mimetype: data.mimetype,
          size: buffer.length,
        },
        request.user!.userId,
        clientId
      );

      request.log.info(
        {
          assetId: asset.id,
          filename: asset.filename,
          category: asset.category,
          userId: request.user!.userId,
        },
        'Asset uploaded'
      );

      return reply.status(201).send({
        success: true,
        message: 'Asset uploaded successfully',
        data: {
          id: asset.id,
          filename: asset.filename,
          category: asset.category,
          size: asset.size.toString(),
          checksum: asset.checksum,
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
          createdAt: asset.createdAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate file')
      ) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'This file has already been uploaded',
        });
      }

      request.log.error(error, 'Error uploading asset');
      throw error;
    }
  });

  /**
   * GET /admin/assets/stats
   * Get asset statistics
   */
  fastify.get('/admin/assets/stats', async (request, reply) => {
    try {
      const stats = await AssetService.getAssetStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching asset stats');
      throw error;
    }
  });

  /**
   * GET /admin/assets
   * List all assets with filters
   */
  fastify.get('/admin/assets', async (request, reply) => {
    try {
      const query = request.query as any;

      const result = await AssetService.listAssets(
        {
          category: query.category,
          clientId: query.clientId,
          search: query.search,
        },
        {
          page: query.page ? parseInt(query.page) : 1,
          limit: query.limit ? parseInt(query.limit) : 20,
        }
      );

      return reply.status(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      request.log.error(error, 'Error listing assets');
      throw error;
    }
  });

  /**
   * GET /admin/assets/:id
   * Get single asset by ID
   */
  fastify.get('/admin/assets/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const asset = await AssetService.getAsset(id);

      return reply.status(200).send({
        success: true,
        data: asset,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Asset not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Asset not found',
        });
      }

      request.log.error(error, 'Error fetching asset');
      throw error;
    }
  });

  /**
   * DELETE /admin/assets/:id
   * Delete an asset
   */
  fastify.delete('/admin/assets/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const asset = await AssetService.deleteAsset(id, request.user!.userId);

      request.log.info(
        {
          assetId: id,
          userId: request.user!.userId,
        },
        'Asset deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Asset deleted successfully',
        data: {
          id: asset.id,
          filename: asset.filename,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Asset not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Asset not found',
        });
      }

      request.log.error(error, 'Error deleting asset');
      throw error;
    }
  });
}