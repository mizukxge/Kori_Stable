import { FastifyInstance } from 'fastify';
import { TemplateService } from '../services/template.js';
import { requireAdmin } from '../middleware/auth.js';

export async function templatesRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/templates/stats
   * Get template statistics
   */
  fastify.get('/admin/templates/stats', async (request, reply) => {
    try {
      const stats = await TemplateService.getTemplateStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching template stats');
      throw error;
    }
  });

  /**
   * GET /admin/templates
   * List all contract templates
   */
  fastify.get('/admin/templates', async (request, reply) => {
    try {
      const query = request.query as any;

      const templates = await TemplateService.listTemplates({
        isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
      });

      return reply.status(200).send({
        success: true,
        data: templates,
      });
    } catch (error) {
      request.log.error(error, 'Error listing templates');
      throw error;
    }
  });

  /**
   * GET /admin/templates/:id
   * Get a single template by ID
   */
  fastify.get('/admin/templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const template = await TemplateService.getTemplateById(id);

      return reply.status(200).send({
        success: true,
        data: template,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Template not found',
        });
      }

      request.log.error(error, 'Error fetching template');
      throw error;
    }
  });

  /**
   * POST /admin/templates
   * Create a new contract template
   */
  fastify.post('/admin/templates', async (request, reply) => {
    try {
      const data = request.body as any;

      // Validate required fields
      if (!data.name) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'name is required',
        });
      }

      if (!data.content) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'content is required',
        });
      }

      const template = await TemplateService.createTemplate(
        data,
        request.user!.userId
      );

      request.log.info(
        {
          templateId: template.id,
          userId: request.user!.userId,
        },
        'Template created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Template created successfully',
        data: {
          id: template.id,
          name: template.name,
          version: template.version,
          createdAt: template.createdAt,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error creating template');
      
      if (error instanceof Error && error.message.includes('validation failed')) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      throw error;
    }
  });

  /**
   * PUT /admin/templates/:id
   * Update a template
   */
  fastify.put('/admin/templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const template = await TemplateService.updateTemplate(
        id,
        data,
        request.user!.userId
      );

      request.log.info(
        {
          templateId: id,
          userId: request.user!.userId,
        },
        'Template updated'
      );

      return reply.status(200).send({
        success: true,
        message: 'Template updated successfully',
        data: template,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Template not found',
        });
      }

      if (error instanceof Error && error.message.includes('validation failed')) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error updating template');
      throw error;
    }
  });

  /**
   * DELETE /admin/templates/:id
   * Delete a template
   */
  fastify.delete('/admin/templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const template = await TemplateService.deleteTemplate(id, request.user!.userId);

      request.log.info(
        {
          templateId: id,
          userId: request.user!.userId,
        },
        'Template deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Template deleted successfully',
        data: {
          id: template.id,
          name: template.name,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Template not found',
        });
      }

      request.log.error(error, 'Error deleting template');
      throw error;
    }
  });

  /**
   * POST /admin/templates/:id/clone
   * Clone a template
   */
  fastify.post('/admin/templates/:id/clone', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (!body.name) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'name is required for cloned template',
        });
      }

      const cloned = await TemplateService.cloneTemplate(
        id,
        body.name,
        request.user!.userId
      );

      request.log.info(
        {
          originalId: id,
          clonedId: cloned.id,
          userId: request.user!.userId,
        },
        'Template cloned'
      );

      return reply.status(201).send({
        success: true,
        message: 'Template cloned successfully',
        data: cloned,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Template not found',
        });
      }

      request.log.error(error, 'Error cloning template');
      throw error;
    }
  });

  /**
   * POST /admin/templates/:id/preview
   * Preview template with sample data
   */
  fastify.post('/admin/templates/:id/preview', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const template = await TemplateService.getTemplateById(id);

      const sampleData = body.sampleData || {
        client: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
        },
        project: {
          name: 'Sample Project',
          description: 'Sample project description',
        },
        date: new Date().toLocaleDateString(),
      };

      const preview = TemplateService.previewTemplate(template.content, sampleData);

      return reply.status(200).send({
        success: true,
        data: {
          preview,
          variables: TemplateService.extractVariables(template.content),
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Template not found',
        });
      }

      request.log.error(error, 'Error previewing template');
      throw error;
    }
  });

  /**
   * POST /admin/templates/validate
   * Validate template content
   */
  fastify.post('/admin/templates/validate', async (request, reply) => {
    try {
      const body = request.body as any;

      if (!body.content) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'content is required',
        });
      }

      const validation = TemplateService.validateTemplate(
        body.content,
        body.variables
      );

      return reply.status(200).send({
        success: true,
        data: {
          valid: validation.valid,
          issues: validation.issues,
          extractedVariables: TemplateService.extractVariables(body.content),
        },
      });
    } catch (error) {
      request.log.error(error, 'Error validating template');
      throw error;
    }
  });
}