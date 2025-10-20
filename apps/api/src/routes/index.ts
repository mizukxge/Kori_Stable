import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';
import { clientRoutes } from './clients.js';
import { ingestRoutes } from './ingest.js';
import { rightsRoutes } from './rights.js';
import { galleriesRoutes } from './galleries.js';
import { publicGalleryRoutes } from './publicGallery.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check routes (public)
  await fastify.register(healthRoutes);

  // Authentication routes
  await fastify.register(authRoutes);

  // Public gallery routes (no auth required)
  await fastify.register(publicGalleryRoutes);

  // Client management routes (admin only)
  await fastify.register(clientRoutes);

  // Asset ingest routes (admin only)
  await fastify.register(ingestRoutes);

  // Rights presets and releases routes (admin only)
  await fastify.register(rightsRoutes);

  // Gallery management routes (admin only)
  await fastify.register(galleriesRoutes);

  // Example API route (existing hello endpoint)
  fastify.get('/api/hello', async (_request, _reply) => {
    return { 
      message: 'Hello from Kori API!', 
      timestamp: new Date().toISOString() 
    };
  });
}