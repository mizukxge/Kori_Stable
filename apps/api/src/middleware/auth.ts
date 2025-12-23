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

  // Debug logging
  console.log('🔍 [AUTH DEBUG] Request to:', request.url);
  console.log('🔍 [AUTH DEBUG] All cookies received:', JSON.stringify(request.cookies));
  console.log('🔍 [AUTH DEBUG] Cookie header:', request.headers.cookie);
  console.log('🔍 [AUTH DEBUG] Origin:', request.headers.origin);
  console.log('🔍 [AUTH DEBUG] SessionToken:', sessionToken ? '✓ Found' : '✗ Missing');

  if (!sessionToken) {
    console.error('❌ [AUTH] Missing session token - cookies not sent by client');
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    throw new Error('Unauthorized'); // Throw to stop execution
  }

  // Validate session
  const user = await AuthService.validateSession(sessionToken);

  if (!user) {
    // Clear invalid cookie
    reply.clearCookie('sessionToken');
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired session',
    });
    throw new Error('Unauthorized'); // Throw to stop execution
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

    // Check role (only executes if requireAuth didn't throw)
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      throw new Error('Forbidden'); // Throw to stop execution
    }
  };
}
/**
 * Middleware to require admin role
 * Convenience wrapper for requireRole
 */
export const requireAdmin = requireRole('SUPER_ADMIN', 'ADMIN');