import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProposalTemplateService, createProposalTemplateSchema, updateProposalTemplateSchema } from '../services/proposalTemplate';
import { requireAuth } from '../middleware/auth';

/**
 * Register proposal template routes
 */
export async function registerProposalTemplateRoutes(fastify: FastifyInstance) {
  // Require authentication for all routes
  fastify.addHook('preHandler', requireAuth);

  /**
   * GET /admin/proposal-templates
   * List all proposal templates for the user
   */
  fastify.get<{ Reply: any }>(
    '/admin/proposal-templates',
    {
      schema: {
        description: 'List all proposal templates',
        tags: ['Proposal Templates'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                title: { type: 'string' },
                defaultTerms: { type: 'string' },
                isActive: { type: 'boolean' },
                isPublic: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                items: {
                  type: 'array',
                  items: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const templates = await ProposalTemplateService.listTemplates(request.user.id);
        return reply.send(templates);
      } catch (error) {
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to list templates',
        });
      }
    }
  );

  /**
   * GET /admin/proposal-templates/:id
   * Get a single proposal template
   */
  fastify.get<{ Params: { id: string }; Reply: any }>(
    '/admin/proposal-templates/:id',
    {
      schema: {
        description: 'Get a single proposal template',
        tags: ['Proposal Templates'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const template = await ProposalTemplateService.getTemplate(request.params.id, request.user.id);
        return reply.send(template);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get template';
        const status = message.includes('not found') ? 404 : message.includes('Unauthorized') ? 403 : 500;
        return reply.status(status).send({ error: message });
      }
    }
  );

  /**
   * POST /admin/proposal-templates
   * Create a new proposal template
   */
  fastify.post<{ Body: any; Reply: any }>(
    '/admin/proposal-templates',
    {
      schema: {
        description: 'Create a new proposal template',
        tags: ['Proposal Templates'],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            title: { type: 'string' },
            defaultTerms: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['description', 'quantity', 'unitPrice'],
                properties: {
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unitPrice: { oneOf: [{ type: 'string' }, { type: 'number' }] },
                  position: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      try {
        const template = await ProposalTemplateService.createTemplate(request.user.id, request.body);
        return reply.status(201).send(template);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create template';
        const status = message.includes('Validation error') ? 400 : 500;
        return reply.status(status).send({ error: message });
      }
    }
  );

  /**
   * PATCH /admin/proposal-templates/:id
   * Update a proposal template
   */
  fastify.patch<{ Params: { id: string }; Body: any; Reply: any }>(
    '/admin/proposal-templates/:id',
    {
      schema: {
        description: 'Update a proposal template',
        tags: ['Proposal Templates'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            title: { type: 'string' },
            defaultTerms: { type: 'string' },
            isActive: { type: 'boolean' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unitPrice: { oneOf: [{ type: 'string' }, { type: 'number' }] },
                  position: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
      try {
        const template = await ProposalTemplateService.updateTemplate(request.params.id, request.user.id, request.body);
        return reply.send(template);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update template';
        let status = 500;
        if (message.includes('not found')) status = 404;
        if (message.includes('Unauthorized')) status = 403;
        if (message.includes('Validation error')) status = 400;
        return reply.status(status).send({ error: message });
      }
    }
  );

  /**
   * DELETE /admin/proposal-templates/:id
   * Delete a proposal template (soft delete)
   */
  fastify.delete<{ Params: { id: string }; Reply: any }>(
    '/admin/proposal-templates/:id',
    {
      schema: {
        description: 'Delete a proposal template',
        tags: ['Proposal Templates'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await ProposalTemplateService.deleteTemplate(request.params.id, request.user.id);
        return reply.status(204).send();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete template';
        const status = message.includes('not found') ? 404 : message.includes('Unauthorized') ? 403 : 500;
        return reply.status(status).send({ error: message });
      }
    }
  );

  /**
   * POST /admin/proposal-templates/:id/duplicate
   * Duplicate a proposal template
   */
  fastify.post<{ Params: { id: string }; Body: { name?: string }; Reply: any }>(
    '/admin/proposal-templates/:id/duplicate',
    {
      schema: {
        description: 'Duplicate a proposal template',
        tags: ['Proposal Templates'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: { name?: string } }>, reply: FastifyReply) => {
      try {
        const template = await ProposalTemplateService.duplicateTemplate(request.params.id, request.user.id, request.body?.name);
        return reply.status(201).send(template);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to duplicate template';
        const status = message.includes('not found') ? 404 : message.includes('Unauthorized') ? 403 : 500;
        return reply.status(status).send({ error: message });
      }
    }
  );

  /**
   * GET /admin/proposal-templates/stats
   * Get proposal template statistics
   */
  fastify.get<{ Reply: any }>(
    '/admin/proposal-templates/stats',
    {
      schema: {
        description: 'Get proposal template statistics',
        tags: ['Proposal Templates'],
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              active: { type: 'number' },
              inactive: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const stats = await ProposalTemplateService.getTemplateStats(request.user.id);
        return reply.send(stats);
      } catch (error) {
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to get statistics',
        });
      }
    }
  );
}
