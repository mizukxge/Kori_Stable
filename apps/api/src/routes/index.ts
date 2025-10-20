import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check routes
  await fastify.register(healthRoutes);

  // Example API route (existing hello endpoint)
  fastify.get('/api/hello', async (_request, _reply) => {
    return { 
      message: 'Hello from Kori API!', 
      timestamp: new Date().toISOString() 
    };
  });
}