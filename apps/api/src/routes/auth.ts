import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../../../../config/env.js';

// Request body schemas
interface LoginBody {
  email: string;
  password: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/login
   * Authenticate user and create session
   */
  fastify.post<{ Body: LoginBody }>('/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    // Validate input
    if (!email || !password) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    try {
      // Attempt login
      const user = await AuthService.login({ email, password });

      if (!user) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Create session token
      const sessionToken = await AuthService.createSession(
        user.userId,
        request.ip,
        request.headers['user-agent']
      );

      // Set secure cookie
      reply.setCookie('sessionToken', sessionToken, {
        path: '/',
        httpOnly: true,
        secure: env.SESSION_COOKIE_SECURE ?? (env.NODE_ENV === 'production'),
        sameSite: (env.SESSION_COOKIE_SAMESITE?.toLowerCase() || 'lax') as 'strict' | 'lax' | 'none',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      // Log successful login
      request.log.info({
        userId: user.userId,
        email: user.email,
        ip: request.ip,
      }, 'User logged in successfully');

      return reply.status(200).send({
        success: true,
        message: 'Login successful',
        user: {
          id: user.userId,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Account is inactive') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Account is inactive',
        });
      }

      request.log.error(error, 'Login error');
      throw error;
    }
  });

  /**
   * POST /auth/logout
   * Destroy current session
   */
  fastify.post('/auth/logout', { preHandler: requireAuth }, async (request, reply) => {
    const sessionToken = request.cookies.sessionToken;

    if (sessionToken) {
      await AuthService.deleteSession(sessionToken);
    }

    // Clear cookie
    reply.clearCookie('sessionToken', { path: '/' });

    request.log.info({
      userId: request.user?.userId,
    }, 'User logged out');

    return reply.status(200).send({
      success: true,
      message: 'Logout successful',
    });
  });

  /**
   * GET /auth/me
   * Get current authenticated user
   */
  fastify.get('/auth/me', { preHandler: requireAuth }, async (request, reply) => {
    return reply.status(200).send({
      success: true,
      user: {
        id: request.user!.userId,
        email: request.user!.email,
        name: request.user!.name,
        role: request.user!.role,
      },
    });
  });

  /**
   * POST /auth/logout-all
   * Destroy all sessions for current user
   */
  fastify.post('/auth/logout-all', { preHandler: requireAuth }, async (request, reply) => {
    if (request.user) {
      await AuthService.deleteAllUserSessions(request.user.userId);
    }

    // Clear current cookie
    reply.clearCookie('sessionToken', { path: '/' });

    request.log.info({
      userId: request.user?.userId,
    }, 'User logged out from all sessions');

    return reply.status(200).send({
      success: true,
      message: 'Logged out from all sessions',
    });
  });
}