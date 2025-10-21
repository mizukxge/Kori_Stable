import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  generateToken,
  hashToken,
  hashIP,
  hashUserAgent,
  getExpirationTime,
  isExpired,
  verifyToken,
  verifyIP,
  verifyUserAgent,
  generateMagicLinkURL,
} from '../utils/magicToken.js';
import { AuthService } from '../services/auth.js';
import { AuditService } from '../observability/audit.js';

const prisma = new PrismaClient();

// Rate limiting: Track requests by email
const requestCounts = new Map<string, { count: number; resetAt: Date }>();

function checkRateLimit(email: string): boolean {
  const now = new Date();
  const record = requestCounts.get(email);

  if (!record || now > record.resetAt) {
    // Reset or create new record (5 requests per hour)
    requestCounts.set(email, {
      count: 1,
      resetAt: new Date(now.getTime() + 60 * 60 * 1000),
    });
    return true;
  }

  if (record.count >= 5) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

interface RequestMagicLinkBody {
  email: string;
  purpose: 'admin_login' | 'client_login' | 'client_portal';
}

interface ConsumeMagicLinkBody {
  token: string;
}

export async function magicLinksRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/magic/request
   * Request a magic link for passwordless authentication
   */
  fastify.post<{ Body: RequestMagicLinkBody }>(
    '/auth/magic/request',
    async (request, reply) => {
      const { email, purpose } = request.body;

      // Validate input
      if (!email || !purpose) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Email and purpose are required',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid email format',
        });
      }

      // Validate purpose
      const validPurposes = ['admin_login', 'client_login', 'client_portal'];
      if (!validPurposes.includes(purpose)) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid purpose',
        });
      }

      // Check rate limit
      if (!checkRateLimit(email)) {
        request.log.warn({ email }, 'Magic link rate limit exceeded');
        return reply.status(429).send({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Too many magic link requests. Please try again later.',
        });
      }

      try {
        // Check if user/client exists
        if (purpose === 'admin_login') {
          const admin = await prisma.adminUser.findUnique({ where: { email } });
          if (!admin) {
            // Don't reveal if user exists
            request.log.warn({ email }, 'Magic link requested for non-existent admin');
            return reply.status(200).send({
              success: true,
              message: 'If an account exists, a magic link has been sent',
            });
          }
        } else {
          const client = await prisma.client.findUnique({ where: { email } });
          if (!client) {
            // Don't reveal if client exists
            request.log.warn({ email }, 'Magic link requested for non-existent client');
            return reply.status(200).send({
              success: true,
              message: 'If an account exists, a magic link has been sent',
            });
          }
        }

        // Generate token
        const token = generateToken();
        const tokenHash = hashToken(token);

        // Hash IP and User Agent for security binding
        const ipHash = request.ip ? hashIP(request.ip) : null;
        const uaHash = request.headers['user-agent']
          ? hashUserAgent(request.headers['user-agent'])
          : null;

        // Create magic link record (expires in 15 minutes)
        const expiresAt = getExpirationTime(15);

        await prisma.magicLink.create({
          data: {
            email,
            tokenHash,
            purpose,
            expiresAt,
            ipHash,
            uaHash,
            metadata: {
              requestedFrom: request.ip,
              userAgent: request.headers['user-agent'],
            },
          },
        });

        // Generate magic link URL
        const magicLinkURL = generateMagicLinkURL(token, purpose);

        // TODO: Send email (for now, log to console)
        request.log.info({
          email,
          purpose,
          magicLink: magicLinkURL,
        }, 'Magic link generated');

        console.log('\n=== MAGIC LINK GENERATED ===');
        console.log(`Email: ${email}`);
        console.log(`Purpose: ${purpose}`);
        console.log(`Token: ${token}`);
        console.log(`Link: ${magicLinkURL}`);
        console.log(`Expires: ${expiresAt.toISOString()}`);
        console.log('============================\n');

        // Audit log
        await AuditService.log({
          action: 'MAGIC_LINK_REQUESTED',
          entityType: 'MagicLink',
          metadata: { email, purpose },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.status(200).send({
          success: true,
          message: 'If an account exists, a magic link has been sent',
        });
      } catch (error) {
        request.log.error(error, 'Error creating magic link');
        throw error;
      }
    }
  );

  /**
   * POST /auth/magic/consume
   * Consume a magic link token and create session
   */
  fastify.post<{ Body: ConsumeMagicLinkBody }>(
    '/auth/magic/consume',
    async (request, reply) => {
      const { token } = request.body;

      // Validate input
      if (!token) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Token is required',
        });
      }

      try {
        // Hash the token to find it
        const tokenHash = hashToken(token);

        // Find the magic link
        const magicLink = await prisma.magicLink.findUnique({
          where: { tokenHash },
        });

        if (!magicLink) {
          request.log.warn({ tokenHash }, 'Invalid magic link token');
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid or expired magic link',
          });
        }

        // Check if already used
        if (magicLink.usedAt) {
          request.log.warn({ tokenHash }, 'Magic link already used');
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Magic link has already been used',
          });
        }

        // Check if expired
        if (isExpired(magicLink.expiresAt)) {
          request.log.warn({ tokenHash }, 'Magic link expired');
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Magic link has expired',
          });
        }

        // Verify IP binding (optional but recommended)
        if (magicLink.ipHash && request.ip) {
          if (!verifyIP(request.ip, magicLink.ipHash)) {
            request.log.warn(
              { tokenHash, ip: request.ip },
              'Magic link IP mismatch - allowing but logging'
            );
          }
        }

        // Verify User Agent binding (optional)
        if (magicLink.uaHash && request.headers['user-agent']) {
          if (!verifyUserAgent(request.headers['user-agent'], magicLink.uaHash)) {
            request.log.warn(
              { tokenHash },
              'Magic link User Agent mismatch - allowing but logging'
            );
          }
        }

        // NOTE: For now, only admin_login is supported for sessions
        // Client login would need a separate ClientSession model
        if (magicLink.purpose !== 'admin_login') {
          return reply.status(501).send({
            statusCode: 501,
            error: 'Not Implemented',
            message: 'Client magic links are not yet implemented. Only admin_login is currently supported.',
          });
        }

        // Mark as used
        await prisma.magicLink.update({
          where: { tokenHash },
          data: { usedAt: new Date() },
        });

        // Find admin user and create session
        const admin = await prisma.adminUser.findUnique({
          where: { email: magicLink.email },
        });

        if (!admin) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'User not found',
          });
        }

        // Create session
        const sessionToken = await AuthService.createSession(
          admin.id,
          request.ip,
          request.headers['user-agent']
        );

        // Set secure cookie
        reply.setCookie('sessionToken', sessionToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        // Audit log
        await AuditService.log({
          action: 'MAGIC_LINK_CONSUMED',
          entityType: 'MagicLink',
          userId: admin.id,
          metadata: {
            email: magicLink.email,
            purpose: magicLink.purpose,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          userId: admin.id,
          email: admin.email,
          purpose: magicLink.purpose,
        }, 'Magic link consumed successfully');

        return reply.status(200).send({
          success: true,
          message: 'Login successful',
          user: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error consuming magic link');
        throw error;
      }
    }
  );

  /**
   * POST /auth/magic/cleanup
   * Cleanup expired magic links (for maintenance)
   */
  fastify.post('/auth/magic/cleanup', async (request, reply) => {
    try {
      const result = await prisma.magicLink.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      request.log.info({ deleted: result.count }, 'Cleaned up expired magic links');

      return reply.status(200).send({
        success: true,
        message: `Cleaned up ${result.count} expired magic links`,
      });
    } catch (error) {
      request.log.error(error, 'Error cleaning up magic links');
      throw error;
    }
  });
}