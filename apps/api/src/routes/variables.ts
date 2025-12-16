import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { VariableSubstitutionService } from '../services/variableSubstitution';

/**
 * Register variable routes for template variables
 */
export async function registerVariableRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/variables
   * Get all available variables
   */
  fastify.get<{ Reply: any }>(
    '/admin/variables',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                placeholder: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                example: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const variables = VariableSubstitutionService.getAvailableVariables();
        return reply.send(variables);
      } catch (error) {
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to get variables',
        });
      }
    }
  );

  /**
   * GET /admin/variables/by-category
   * Get all available variables grouped by category
   */
  fastify.get<{ Reply: any }>(
    '/admin/variables/by-category',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              client: { type: 'array' },
              proposal: { type: 'array' },
              date: { type: 'array' },
              business: { type: 'array' },
              custom: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const variables = VariableSubstitutionService.getVariablesByCategory();
        return reply.send(variables);
      } catch (error) {
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to get variables',
        });
      }
    }
  );

  /**
   * GET /admin/variables/category/:category
   * Get variables for a specific category
   */
  fastify.get<{ Params: { category: string }; Reply: any }>(
    '/admin/variables/category/:category',
    {
      schema: {
        params: {
          type: 'object',
          required: ['category'],
          properties: {
            category: { type: 'string', enum: ['client', 'proposal', 'date', 'business'] },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { category: string } }>, reply: FastifyReply) => {
      try {
        const variables = VariableSubstitutionService.getAvailableVariables(
          request.params.category
        );
        return reply.send(variables);
      } catch (error) {
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to get variables',
        });
      }
    }
  );

  /**
   * POST /admin/variables/substitute
   * Substitute variables in text with sample values
   * Request body: { text: string, category?: string }
   */
  fastify.post<{ Body: { text: string; category?: string }; Reply: any }>(
    '/admin/variables/substitute',
    {
      schema: {
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string' },
            category: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { text: string; category?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Create sample context with example data
        const sampleContext = {
          client: {
            name: 'John Smith',
            email: 'john@example.com',
            phone: '+44 123 456 7890',
            company: 'ABC Corporation',
            address: '123 Main Street, London',
          },
          user: {
            name: 'Jane Photographer',
            email: 'jane@acmephoto.com',
          },
          proposal: {
            number: 'PROP-2025-001',
            subtotal: '£1,500.00',
            tax: '£300.00',
            total: '£1,800.00',
          },
          date: {
            today: '7 November 2025',
            tomorrow: '8 November 2025',
            nextWeek: '14 November 2025',
          },
          business: {
            name: 'Acme Photography',
            email: 'hello@acmephoto.com',
            phone: '+44 987 654 3210',
            address: '456 Photo Lane, London',
            website: 'https://acmephoto.com',
          },
        };

        const result = VariableSubstitutionService.substitute(request.body.text, sampleContext);

        return reply.send({
          original: request.body.text,
          substituted: result,
          changed: result !== request.body.text,
        });
      } catch (error) {
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to substitute variables',
        });
      }
    }
  );

  /**
   * POST /admin/variables/validate
   * Validate that all variables in text are known/available
   * Request body: { text: string }
   */
  fastify.post<{ Body: { text: string }; Reply: any }>(
    '/admin/variables/validate',
    {
      schema: {
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { text: string } }>, reply: FastifyReply) => {
      try {
        const validation = VariableSubstitutionService.validateVariables(request.body.text);
        return reply.send(validation);
      } catch (error) {
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to validate variables',
        });
      }
    }
  );
}
