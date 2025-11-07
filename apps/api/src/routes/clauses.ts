import { FastifyInstance, FastifyRequest } from 'fastify';
import { ClauseService } from '../services/clause.js';

/**
 * Clause Routes
 *
 * API endpoints for managing contract clauses
 */

interface CreateClauseBody {
  slug: string;
  title: string;
  bodyHtml: string;
  tags?: string[];
  mandatory?: boolean;
  isActive?: boolean;
}

interface UpdateClauseBody {
  slug?: string;
  title?: string;
  bodyHtml?: string;
  tags?: string[];
  mandatory?: boolean;
  isActive?: boolean;
}

interface ListClausesQuery {
  search?: string;
  tags?: string;
  mandatory?: string;
  isActive?: string;
}

interface CreateClauseRuleBody {
  clauseId: string;
  expression: any;
  enabled?: boolean;
}

interface UpdateClauseRuleBody {
  expression: any;
  enabled?: boolean;
}

export async function clausesRoutes(fastify: FastifyInstance) {
  /**
   * List all clauses
   * GET /api/clauses
   */
  fastify.get<{ Querystring: ListClausesQuery }>(
    '/api/clauses',
    async (request, reply) => {
      try {
        const { search, tags, mandatory, isActive } = request.query;

        const filters: any = {};

        if (search) {
          filters.search = search;
        }

        if (tags) {
          filters.tags = tags.split(',').map((t) => t.trim());
        }

        if (mandatory !== undefined) {
          filters.mandatory = mandatory === 'true';
        }

        if (isActive !== undefined) {
          filters.isActive = isActive === 'true';
        }

        const clauses = await ClauseService.listClauses(filters);
        return reply.send(clauses);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  /**
   * Get mandatory clauses
   * GET /api/clauses/mandatory
   */
  fastify.get('/api/clauses/mandatory', async (request, reply) => {
    try {
      const clauses = await ClauseService.getMandatoryClauses();
      return reply.send(clauses);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  /**
   * Get all tags
   * GET /api/clauses/tags
   */
  fastify.get('/api/clauses/tags', async (request, reply) => {
    try {
      const tags = await ClauseService.getAllTags();
      return reply.send({ tags });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  /**
   * Get clause statistics
   * GET /api/clauses/stats
   */
  fastify.get('/api/clauses/stats', async (request, reply) => {
    try {
      const stats = await ClauseService.getClauseStats();
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  /**
   * Get clause by ID
   * GET /api/clauses/:id
   */
  fastify.get<{ Params: { id: string } }>(
    '/api/clauses/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const clause = await ClauseService.getClauseById(id);
        return reply.send(clause);
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * Get clause by slug
   * GET /api/clauses/slug/:slug
   */
  fastify.get<{ Params: { slug: string } }>(
    '/api/clauses/slug/:slug',
    async (request, reply) => {
      try {
        const { slug } = request.params;
        const clause = await ClauseService.getClauseBySlug(slug);
        return reply.send(clause);
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * Create new clause
   * POST /api/clauses
   */
  fastify.post<{ Body: CreateClauseBody }>(
    '/api/clauses',
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        const clause = await ClauseService.createClause(request.body, userId);
        return reply.status(201).send(clause);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Update clause
   * PUT /api/clauses/:id
   */
  fastify.put<{ Params: { id: string }; Body: UpdateClauseBody }>(
    '/api/clauses/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;
        const clause = await ClauseService.updateClause(id, request.body, userId);
        return reply.send(clause);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Delete clause (soft delete)
   * DELETE /api/clauses/:id
   */
  fastify.delete<{ Params: { id: string } }>(
    '/api/clauses/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;
        const clause = await ClauseService.deleteClause(id, userId);
        return reply.send({ message: 'Clause deleted successfully', clause });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Hard delete clause (permanent)
   * DELETE /api/clauses/:id/hard
   */
  fastify.delete<{ Params: { id: string } }>(
    '/api/clauses/:id/hard',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;
        await ClauseService.hardDeleteClause(id, userId);
        return reply.send({ message: 'Clause permanently deleted' });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Add rule to clause
   * POST /api/clauses/:id/rules
   */
  fastify.post<{ Params: { id: string }; Body: CreateClauseRuleBody }>(
    '/api/clauses/:id/rules',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;

        const data = {
          clauseId: id,
          expression: request.body.expression,
          enabled: request.body.enabled,
        };

        const rule = await ClauseService.addClauseRule(data, userId);
        return reply.status(201).send(rule);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Update clause rule
   * PUT /api/clause-rules/:id
   */
  fastify.put<{ Params: { id: string }; Body: UpdateClauseRuleBody }>(
    '/api/clause-rules/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;
        const { expression, enabled } = request.body;

        const rule = await ClauseService.updateClauseRule(
          id,
          expression,
          enabled,
          userId
        );
        return reply.send(rule);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * Delete clause rule
   * DELETE /api/clause-rules/:id
   */
  fastify.delete<{ Params: { id: string } }>(
    '/api/clause-rules/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = (request as any).user?.id;
        await ClauseService.deleteClauseRule(id, userId);
        return reply.send({ message: 'Clause rule deleted successfully' });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
