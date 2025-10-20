import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check routes (public)
  await fastify.register(healthRoutes);

  // Authentication routes
  await fastify.register(authRoutes);

  // Example API route (existing hello endpoint)
  fastify.get('/api/hello', async (_request, _reply) => {
    return { 
      message: 'Hello from Kori API!', 
      timestamp: new Date().toISOString() 
    };
  });

  // Example protected route
  // Uncomment to test authentication:
  /*
  import { requireAuth, requireAdmin } from '../middleware/auth.js';
  
  fastify.get('/api/protected', { preHandler: requireAuth }, async (request, reply) => {
    return {
      message: 'This is a protected route',
      user: request.user,
    };
  });

  fastify.get('/api/admin-only', { preHandler: requireAdmin }, async (request, reply) => {
    return {
      message: 'This route requires admin role',
      user: request.user,
    };
  });
  */
}