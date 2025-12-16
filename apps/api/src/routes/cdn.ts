import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../middleware/auth.js';
import { imageSigner, verifyRequestSignature, ImageParams } from '../utils/signResize.js';
import { imageOptimization } from '../services/imageOptimization.js';
import { AuditService } from '../observability/audit.js';
import { existsSync } from 'fs';
import { join } from 'path';

interface GenerateSignedURLBody {
  path: string;
  params: ImageParams;
}

interface PurgeCacheBody {
  paths?: string[];
  prefix?: string;
  tags?: string[];
  purgeAll?: boolean;
}

interface VerifySignedURLBody {
  url: string;
}

/**
 * CDN Provider Interface
 */
interface CDNProvider {
  name: string;
  purge(options: PurgeCacheBody): Promise<{ success: boolean; message: string }>;
}

/**
 * Cloudflare CDN Provider
 */
class CloudflareCDN implements CDNProvider {
  name = 'Cloudflare';

  async purge(options: PurgeCacheBody): Promise<{ success: boolean; message: string }> {
    const apiKey = process.env.CDN_API_KEY;
    const email = process.env.CDN_API_EMAIL;
    const zoneId = process.env.CDN_ZONE_ID;

    if (!apiKey || !email || !zoneId) {
      return {
        success: false,
        message: 'Cloudflare credentials not configured',
      };
    }

    try {
      const body: any = {};

      if (options.purgeAll) {
        body.purge_everything = true;
      } else if (options.paths && options.paths.length > 0) {
        body.files = options.paths;
      } else if (options.prefix) {
        body.prefixes = [options.prefix];
      } else if (options.tags && options.tags.length > 0) {
        body.tags = options.tags;
      }

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'X-Auth-Email': email,
            'X-Auth-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json() as Record<string, unknown>;

      if (data.success === true) {
        return {
          success: true,
          message: 'Cache purged successfully',
        };
      } else {
        const errors = data.errors as Array<{ message: string }> | undefined;
        return {
          success: false,
          message: errors?.[0]?.message || 'Purge failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * AWS CloudFront CDN Provider
 */
class CloudFrontCDN implements CDNProvider {
  name = 'CloudFront';

  async purge(options: PurgeCacheBody): Promise<{ success: boolean; message: string }> {
    // Placeholder - would use AWS SDK
    return {
      success: false,
      message: 'CloudFront purge not yet implemented',
    };
  }
}

/**
 * Fastly CDN Provider
 */
class FastlyCDN implements CDNProvider {
  name = 'Fastly';

  async purge(options: PurgeCacheBody): Promise<{ success: boolean; message: string }> {
    // Placeholder - would use Fastly API
    return {
      success: false,
      message: 'Fastly purge not yet implemented',
    };
  }
}

/**
 * No CDN Provider (local/disabled)
 */
class NoCDN implements CDNProvider {
  name = 'None';

  async purge(options: PurgeCacheBody): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'No CDN configured - cache purge skipped',
    };
  }
}

/**
 * Get CDN provider instance
 */
function getCDNProvider(): CDNProvider {
  const provider = process.env.CDN_PROVIDER?.toLowerCase() || 'none';

  switch (provider) {
    case 'cloudflare':
      return new CloudflareCDN();
    case 'cloudfront':
      return new CloudFrontCDN();
    case 'fastly':
      return new FastlyCDN();
    default:
      return new NoCDN();
  }
}

export async function cdnRoutes(fastify: FastifyInstance) {
  /**
   * GET /img/:path*
   * Serve optimized images with signed URLs
   * Public endpoint but requires valid signature
   */
  fastify.get<{ Params: { '*': string }; Querystring: any }>(
    '/img/*',
    async (request, reply) => {
      const path = `/${request.params['*']}`;
      const query = request.query;

      // Verify signature
      const isValid = verifyRequestSignature(path, query);
      if (!isValid) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Invalid or missing signature',
        });
      }

      // Extract parameters
      const params: ImageParams = {};
      if (typeof query.w === 'string') params.w = parseInt(query.w, 10);
      if (typeof query.h === 'string') params.h = parseInt(query.h, 10);
      if (typeof query.fit === 'string') params.fit = query.fit;
      if (typeof query.q === 'string') params.q = parseInt(query.q, 10);
      if (typeof query.f === 'string') params.f = query.f;
      if (typeof query.dpr === 'string') params.dpr = parseInt(query.dpr, 10);
      if (typeof query.crop === 'string') params.crop = query.crop;
      if (typeof query.blur === 'string') params.blur = parseFloat(query.blur);
      if (typeof query.sharpen === 'string') params.sharpen = parseFloat(query.sharpen);
      if (typeof query.grayscale === 'string') params.grayscale = query.grayscale === 'true';
      if (typeof query.rotate === 'string') params.rotate = parseInt(query.rotate, 10);
      if (typeof query.flip === 'string') params.flip = query.flip;
      if (typeof query.bg === 'string') params.bg = query.bg;

      try {
        // Find source file
        const uploadsDir = join(process.cwd(), 'uploads');
        const sourcePath = join(uploadsDir, path);

        if (!existsSync(sourcePath)) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Image not found',
          });
        }

        // Process image
        const buffer = await imageOptimization.processImage(sourcePath, params);

        // Determine content type
        let contentType = 'image/jpeg';
        if (params.f === 'png') contentType = 'image/png';
        else if (params.f === 'webp') contentType = 'image/webp';
        else if (params.f === 'avif') contentType = 'image/avif';

        // Set cache headers
        const cacheHeaders = imageOptimization.getCacheHeaders();

        return reply
          .headers(cacheHeaders)
          .type(contentType)
          .send(buffer);
      } catch (error) {
        request.log.error(error, 'Error serving optimized image');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to process image',
        });
      }
    }
  );

  /**
   * POST /admin/cdn/generate-url
   * Generate signed URL for image transformation
   */
  fastify.post<{ Body: GenerateSignedURLBody }>(
    '/admin/cdn/generate-url',
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      const { path, params } = request.body;

      if (!path) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Path is required',
        });
      }

      try {
        const signedURL = imageSigner.generateSignedURL(path, params);

        return reply.status(200).send({
          success: true,
          data: {
            url: signedURL,
            path,
            params,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error generating signed URL');
        throw error;
      }
    }
  );

  /**
   * POST /admin/cdn/verify-url
   * Verify a signed URL
   */
  fastify.post<{ Body: VerifySignedURLBody }>(
    '/admin/cdn/verify-url',
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      const { url } = request.body;

      if (!url) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'URL is required',
        });
      }

      try {
        const result = imageSigner.parseSignedURL(url);

        if (!result) {
          return reply.status(200).send({
            success: true,
            data: {
              valid: false,
              message: 'Invalid URL format',
            },
          });
        }

        return reply.status(200).send({
          success: true,
          data: {
            valid: result.valid,
            path: result.path,
            params: result.params,
            message: result.valid ? 'Valid signature' : 'Invalid signature',
          },
        });
      } catch (error) {
        request.log.error(error, 'Error verifying URL');
        throw error;
      }
    }
  );

  /**
   * POST /admin/cdn/purge
   * Purge CDN cache
   */
  fastify.post<{ Body: PurgeCacheBody }>(
    '/admin/cdn/purge',
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      const { paths, prefix, tags, purgeAll } = request.body;

      try {
        const provider = getCDNProvider();
        const result = await provider.purge({ paths, prefix, tags, purgeAll });

        // Audit log
        await AuditService.log({
          action: 'CDN_CACHE_PURGED',
          entityType: 'CDN',
          userId: request.user?.userId,
          metadata: {
            provider: provider.name,
            paths,
            prefix,
            tags,
            purgeAll,
            success: result.success,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          provider: provider.name,
          paths,
          prefix,
          tags,
          purgeAll,
          success: result.success,
          userId: request.user?.userId,
        }, 'CDN cache purge requested');

        return reply.status(200).send({
          success: result.success,
          message: result.message,
          data: {
            provider: provider.name,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error purging CDN cache');
        throw error;
      }
    }
  );

  /**
   * DELETE /admin/cdn/cache/local
   * Clear local image cache
   */
  fastify.delete(
    '/admin/cdn/cache/local',
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      try {
        imageOptimization.clearAllCache();

        // Audit log
        await AuditService.log({
          action: 'LOCAL_CACHE_CLEARED',
          entityType: 'Cache',
          userId: request.user?.userId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          userId: request.user?.userId,
        }, 'Local image cache cleared');

        return reply.status(200).send({
          success: true,
          message: 'Local image cache cleared',
        });
      } catch (error) {
        request.log.error(error, 'Error clearing local cache');
        throw error;
      }
    }
  );

  /**
   * GET /admin/cdn/cache/stats
   * Get cache statistics
   */
  fastify.get(
    '/admin/cdn/cache/stats',
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      try {
        const size = imageOptimization.getCacheSize();

        return reply.status(200).send({
          success: true,
          data: {
            size,
            sizeFormatted: `${(size / 1024 / 1024).toFixed(2)} MB`,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error getting cache stats');
        throw error;
      }
    }
  );

  /**
   * GET /admin/cdn/config
   * Get CDN configuration
   */
  fastify.get(
    '/admin/cdn/config',
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      const provider = getCDNProvider();

      return reply.status(200).send({
        success: true,
        data: {
          provider: provider.name,
          cdnUrl: process.env.CDN_URL || 'Not configured',
          hasApiKey: !!process.env.CDN_API_KEY,
        },
      });
    }
  );
}