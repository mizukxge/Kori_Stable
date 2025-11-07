import { FastifyInstance } from 'fastify';
import { ContractTemplateService } from '../services/contract-template.js';
import { DocumentType, EventType } from '@prisma/client';

/**
 * Contract Template Routes
 *
 * API endpoints for managing contract templates
 */

interface CreateTemplateBody {
  name: string;
  description?: string;
  type?: DocumentType;
  eventType?: EventType;
  bodyHtml?: string;
  variablesSchema?: any;
  mandatoryClauseIds?: string[];
  isActive?: boolean;
}

interface UpdateTemplateBody {
  name?: string;
  description?: string;
  type?: DocumentType;
  eventType?: EventType;
  bodyHtml?: string;
  variablesSchema?: any;
  mandatoryClauseIds?: string[];
  isActive?: boolean;
}

interface ListTemplatesQuery {
  search?: string;
  type?: DocumentType;
  eventType?: EventType;
  isActive?: string;
  isPublished?: string;
}

export async function contractTemplatesRoutes(fastify: FastifyInstance) {
  /**
   * List all contract templates
   * GET /api/contract-templates
   */
  fastify.get<{ Querystring: ListTemplatesQuery }>(
    '/api/contract-templates',
    async (request, reply) => {
      try {
        const { search, type, eventType, isActive, isPublished } = request.query;

        const filters: any = {};

        if (search) {
          filters.search = search;
        }

        if (type) {
          filters.type = type;
        }

        if (eventType) {
          filters.eventType = eventType;
        }

        if (isActive !== undefined) {
          filters.isActive = isActive === 'true';
        }

        if (isPublished !== undefined) {
          filters.isPublished = isPublished === 'true';
        }

        const templates = await ContractTemplateService.listTemplates(filters);
        return reply.send(templates);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  /**
   * Get published templates (for contract creation)
   * GET /api/contract-templates/published
   */
  fastify.get('/api/contract-templates/published', async (request, reply) => {
    try {
      const templates = await ContractTemplateService.getPublishedTemplates();
      return reply.send(templates);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  /**
   * Get most used templates
   * GET /api/contract-templates/most-used
   */
  fastify.get<{ Querystring: { limit?: string } }>(
    '/api/contract-templates/most-used',
    async (request, reply) => {
      try {
        const limit = request.query.limit ? parseInt(request.query.limit) : 10;
        const templates = await ContractTemplateService.getMostUsedTemplates(limit);
        return reply.send(templates);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  /**
   * Get template statistics
   * GET /api/contract-templates/stats
   */
  fastify.get('/api/contract-templates/stats', async (request, reply) => {
    try {
      const stats = await ContractTemplateService.getTemplateStats();
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  /**
   * Get template by ID
   * GET /api/contract-templates/:id
   */
  fastify.get<{ Params: { id: string } }>(
    '/api/contract-templates/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const template = await ContractTemplateService.getTemplateById(id);
        return reply.send(template);
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * Get template with resolved clauses
   * GET /api/contract-templates/:id/with-clauses
   */
  fastify.get<{ Params: { id: string } }>(
    '/api/contract-templates/:id/with-clauses',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const template = await ContractTemplateService.getTemplateWithClauses(id);
        return reply.send(template);
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * Get template by name
   * GET /api/contract-templates/name/:name
   */
  fastify.get<{ Params: { name: string } }>(
    '/api/contract-templates/name/:name',
    async (request, reply) => {
      try {
        const { name } = request.params;
        const template = await ContractTemplateService.getTemplateByName(name);
        return reply.send(template);
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * Create new contract template
   * POST /api/contract-templates
   */
  fastify.post<{ Body: CreateTemplateBody }>(
    '/api/contract-templates',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;

        if (!userId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const template = await ContractTemplateService.createTemplate(
          request.body,
          userId
        );
        return reply.status(201).send(template);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Update contract template
   * PUT /api/contract-templates/:id
   */
  fastify.put<{ Params: { id: string }; Body: UpdateTemplateBody }>(
    '/api/contract-templates/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;

        if (!userId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const template = await ContractTemplateService.updateTemplate(
          id,
          request.body,
          userId
        );
        return reply.send(template);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Publish template
   * POST /api/contract-templates/:id/publish
   */
  fastify.post<{ Params: { id: string } }>(
    '/api/contract-templates/:id/publish',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;

        if (!userId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const template = await ContractTemplateService.publishTemplate(id, userId);
        return reply.send(template);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Unpublish template
   * POST /api/contract-templates/:id/unpublish
   */
  fastify.post<{ Params: { id: string } }>(
    '/api/contract-templates/:id/unpublish',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;

        if (!userId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const template = await ContractTemplateService.unpublishTemplate(id, userId);
        return reply.send(template);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Create new version of template
   * POST /api/contract-templates/:id/version
   */
  fastify.post<{ Params: { id: string } }>(
    '/api/contract-templates/:id/version',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;

        if (!userId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const newVersion = await ContractTemplateService.createTemplateVersion(
          id,
          userId
        );
        return reply.status(201).send(newVersion);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Delete template (soft delete)
   * DELETE /api/contract-templates/:id
   */
  fastify.delete<{ Params: { id: string } }>(
    '/api/contract-templates/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;

        if (!userId) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const template = await ContractTemplateService.deleteTemplate(id, userId);
        return reply.send({
          message: 'Template deleted successfully',
          template,
        });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
