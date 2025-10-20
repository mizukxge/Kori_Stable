import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService, SessionData } from '../services/auth.js';

// Extend FastifyRequest to include user data
declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionData;
  }
}

/**
 * Middleware to require authentication
 * Validates session token from cookie and attaches user to request
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const sessionToken = request.cookies.sessionToken;

  if (!sessionToken) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Validate session
  const user = await AuthService.validateSession(sessionToken);

  if (!user) {
    // Clear invalid cookie
    reply.clearCookie('sessionToken');
    
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired session',
    });
  }

  // Attach user to request
  request.user = user;
}

/**
 * Middleware to require specific role
 */
export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // First check authentication
    await requireAuth(request, reply);

    // Check role
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}

/**
 * Middleware to require admin role (ADMIN or SUPER_ADMIN)
 */
export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN');

/**
 * Middleware to require super admin role
 */
export const requireSuperAdmin = requireRole('SUPER_ADMIN');

/**
 * Optional auth middleware - attaches user if session exists, but doesn't require it
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const sessionToken = request.cookies.sessionToken;

  if (sessionToken) {
    const user = await AuthService.validateSession(sessionToken);
    if (user) {
      request.user = user;
    }
  }
}