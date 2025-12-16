import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';
import { websocketRoutes } from './websocket.js';
import { adminClientRoutes } from './clients.js';
import { inquiryRoutes, adminInquiryRoutes } from './inquiries.js';
import { ingestRoutes } from './ingest.js';
import { rightsRoutes } from './rights.js';
import { galleriesRoutes } from './galleries.js';
import { publicGalleryRoutes } from './publicGallery.js';
import { proposalsRoutes } from './proposals.js';
import { publicProposalRoutes } from './publicProposal.js';
import { registerProposalTemplateRoutes } from './proposalTemplates.js';
import { proposalEmailTemplatesRoutes } from './proposalEmailTemplates.js';
import { registerVariableRoutes } from './variables.js';
import { templatesRoutes } from './templates.js';
import { contractsRoutes } from './contracts.js';
import { publicContractRoutes } from './publicContract.js';
import { clausesRoutes } from './clauses.js';
import { contractTemplatesRoutes } from './contract-templates.js';
import { invoicesRoutes } from './invoices.js';
import { publicInvoiceRoutes } from './publicInvoice.js';
import { paymentsRoutes } from './payments.js';
import { reconciliationRoutes } from './reconciliation.js';
import { periodsRoutes } from './periods.js';
import { journalsRoutes } from './journals.js';
import { recordsRoutes } from './records.js';
import { metricsRoutes } from './metrics.js';
import { auditRoutes } from './audit.js';
import { magicLinksRoutes } from './magicLinks.js';
import { emailRoutes } from './email.js';
import { docgenRoutes } from './docgen.js';
import { mediaProcessRoutes } from './mediaProcess.js';
import { cdnRoutes } from './cdn.js';
import { analyticsRoutes } from './analytics.js';
import { envelopesRoutes } from './envelopes.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check routes (public)
  await fastify.register(healthRoutes);

  // CDN & Image Optimization routes (public image serving + admin management)
  await fastify.register(cdnRoutes);

  // Authentication routes
  await fastify.register(authRoutes);

  // WebSocket routes (real-time notifications)
  await fastify.register(websocketRoutes);

  // Public gallery routes (no auth required)
  await fastify.register(publicGalleryRoutes);

  // Public proposal routes (no auth required)
  await fastify.register(publicProposalRoutes);

  // Public contract signing routes (no auth required, uses magic links)
  await fastify.register(publicContractRoutes);

  // Public envelope signing routes (no auth required, uses magic links)
  // Also includes admin envelope management routes
  await fastify.register(envelopesRoutes);

  // Public invoice routes (no auth required)
  await fastify.register(publicInvoiceRoutes);

  // Public inquiry routes (lead capture form - no auth required)
  await fastify.register(inquiryRoutes);

  // Admin inquiry management routes (admin only)
  await fastify.register(adminInquiryRoutes);

  // Admin client management routes (admin only)
  await fastify.register(adminClientRoutes);

  // Asset ingest routes (admin only)
  await fastify.register(ingestRoutes);

  // Rights presets and releases routes (admin only)
  await fastify.register(rightsRoutes);

  // Gallery management routes (admin only)
  await fastify.register(galleriesRoutes);

  // Proposal management routes (admin only)
  await fastify.register(proposalsRoutes);

  // Proposal template routes (admin only)
  await fastify.register(registerProposalTemplateRoutes);

  // Proposal email template routes (admin only)
  await fastify.register(proposalEmailTemplatesRoutes);

  // Variable substitution routes (admin only)
  await fastify.register(registerVariableRoutes);

  // Contract template routes (admin only)
  await fastify.register(templatesRoutes);

  // Clause management routes (admin only)
  await fastify.register(clausesRoutes);

  // Contract template management routes (admin only)
  await fastify.register(contractTemplatesRoutes);

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

  // Metrics routes (Prometheus)
  await fastify.register(metricsRoutes);

  // Audit log routes (admin only)
  await fastify.register(auditRoutes);

  // Magic links routes (passwordless auth)
  await fastify.register(magicLinksRoutes);

  // Email routes (admin only)
  await fastify.register(emailRoutes);

  // Document generation routes (admin only)
  await fastify.register(docgenRoutes);

  // Media processing routes (admin only)
  await fastify.register(mediaProcessRoutes);

  // Analytics routes (admin only)
  await fastify.register(analyticsRoutes);

  // Example API route (existing hello endpoint)
  fastify.get('/api/hello', async (_request, _reply) => {
    return { 
      message: 'Hello from Kori API!', 
      timestamp: new Date().toISOString() 
    };
  });
}