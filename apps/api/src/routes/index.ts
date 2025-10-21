import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';
import { clientRoutes } from './clients.js';
import { ingestRoutes } from './ingest.js';
import { rightsRoutes } from './rights.js';
import { galleriesRoutes } from './galleries.js';
import { publicGalleryRoutes } from './publicGallery.js';
import { proposalsRoutes } from './proposals.js';
import { publicProposalRoutes } from './publicProposal.js';
import { templatesRoutes } from './templates.js';
import { contractsRoutes } from './contracts.js';
import { invoicesRoutes } from './invoices.js';
import { paymentsRoutes } from './payments.js';
import { reconciliationRoutes } from './reconciliation.js';
import { periodsRoutes } from './periods.js';
import { journalsRoutes } from './journals.js';
import { recordsRoutes } from './records.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check routes (public)
  await fastify.register(healthRoutes);

  // Authentication routes
  await fastify.register(authRoutes);

  // Public gallery routes (no auth required)
  await fastify.register(publicGalleryRoutes);

  // Public proposal routes (no auth required)
  await fastify.register(publicProposalRoutes);

  // Client management routes (admin only)
  await fastify.register(clientRoutes);

  // Asset ingest routes (admin only)
  await fastify.register(ingestRoutes);

  // Rights presets and releases routes (admin only)
  await fastify.register(rightsRoutes);

  // Gallery management routes (admin only)
  await fastify.register(galleriesRoutes);

  // Proposal management routes (admin only)
  await fastify.register(proposalsRoutes);

  // Contract template routes (admin only)
  await fastify.register(templatesRoutes);

  // Contract routes (admin only)
  await fastify.register(contractsRoutes);

  // Invoice routes (admin only)
  await fastify.register(invoicesRoutes);

  // Payment routes (admin + webhook)
  await fastify.register(paymentsRoutes);

  // Reconciliation routes (admin only)
  await fastify.register(reconciliationRoutes);

  // Accounting period routes (admin only)
  await fastify.register(periodsRoutes);

  // Journal entry routes (admin only)
  await fastify.register(journalsRoutes);

  // Records and WORM archive routes (admin only)
  await fastify.register(recordsRoutes);

  // Example API route (existing hello endpoint)
  fastify.get('/api/hello', async (_request, _reply) => {
    return { 
      message: 'Hello from Kori API!', 
      timestamp: new Date().toISOString() 
    };
  });
}