/**
 * Proposal Email Templates Routes
 * API endpoints for managing email templates for proposals
 */

import { FastifyInstance } from 'fastify';
import { ProposalEmailTemplateService } from '../services/proposalEmailTemplate.js';
import { requireAdmin } from '../middleware/auth.js';

export async function proposalEmailTemplatesRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * POST /admin/proposal-email-templates
   * Create a new email template
   */
  fastify.post('/admin/proposal-email-templates', async (request, reply) => {
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

      if (!data.subject) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'subject is required',
        });
      }

      if (!data.content) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'content is required',
        });
      }

      const template = await ProposalEmailTemplateService.createTemplate(
        request.user!.userId,
        {
          name: data.name,
          subject: data.subject,
          content: data.content,
          isDefault: data.isDefault || false,
        }
      );

      request.log.info(
        {
          templateId: template.id,
          userId: request.user!.userId,
        },
        'Email template created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Email template created successfully',
        data: template,
      });
    } catch (error) {
      request.log.error(error, 'Error creating email template');
      throw error;
    }
  });

  /**
   * GET /admin/proposal-email-templates
   * List all email templates for the current user
   */
  fastify.get('/admin/proposal-email-templates', async (request, reply) => {
    try {
      const templates = await ProposalEmailTemplateService.listTemplates(
        request.user!.userId
      );

      return reply.status(200).send({
        success: true,
        data: templates,
      });
    } catch (error) {
      request.log.error(error, 'Error listing email templates');
      throw error;
    }
  });

  /**
   * GET /admin/proposal-email-templates/stats
   * Get template statistics
   */
  fastify.get('/admin/proposal-email-templates/stats', async (request, reply) => {
    try {
      const stats = await ProposalEmailTemplateService.getTemplateStats(
        request.user!.userId
      );

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
   * GET /admin/proposal-email-templates/:id
   * Get a single email template
   */
  fastify.get('/admin/proposal-email-templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const template = await ProposalEmailTemplateService.getTemplate(
        id,
        request.user!.userId
      );

      return reply.status(200).send({
        success: true,
        data: template,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Email template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Email template not found',
        });
      }

      request.log.error(error, 'Error fetching email template');
      throw error;
    }
  });

  /**
   * PUT /admin/proposal-email-templates/:id
   * Update an email template
   */
  fastify.put('/admin/proposal-email-templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const template = await ProposalEmailTemplateService.updateTemplate(
        id,
        request.user!.userId,
        {
          name: data.name,
          subject: data.subject,
          content: data.content,
          isActive: data.isActive,
          isDefault: data.isDefault,
        }
      );

      request.log.info(
        {
          templateId: id,
          userId: request.user!.userId,
        },
        'Email template updated'
      );

      return reply.status(200).send({
        success: true,
        message: 'Email template updated successfully',
        data: template,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Email template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Email template not found',
        });
      }

      request.log.error(error, 'Error updating email template');
      throw error;
    }
  });

  /**
   * DELETE /admin/proposal-email-templates/:id
   * Delete an email template (soft delete)
   */
  fastify.delete('/admin/proposal-email-templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      await ProposalEmailTemplateService.deleteTemplate(id, request.user!.userId);

      request.log.info(
        {
          templateId: id,
          userId: request.user!.userId,
        },
        'Email template deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Email template deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Email template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Email template not found',
        });
      }

      request.log.error(error, 'Error deleting email template');
      throw error;
    }
  });

  /**
   * POST /admin/proposal-email-templates/:id/set-default
   * Set a template as default
   */
  fastify.post('/admin/proposal-email-templates/:id/set-default', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const template = await ProposalEmailTemplateService.setDefaultTemplate(
        id,
        request.user!.userId
      );

      request.log.info(
        {
          templateId: id,
          userId: request.user!.userId,
        },
        'Email template set as default'
      );

      return reply.status(200).send({
        success: true,
        message: 'Template set as default successfully',
        data: template,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Email template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Email template not found',
        });
      }

      request.log.error(error, 'Error setting default template');
      throw error;
    }
  });

  /**
   * POST /admin/proposal-email-templates/:id/preview
   * Preview template with sample data
   */
  fastify.post('/admin/proposal-email-templates/:id/preview', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const result = await ProposalEmailTemplateService.previewTemplate(
        id,
        request.user!.userId
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Email template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Email template not found',
        });
      }

      request.log.error(error, 'Error previewing template');
      throw error;
    }
  });

  /**
   * POST /admin/proposal-email-templates/preview
   * Preview template content without saving (for create form)
   */
  fastify.post('/admin/proposal-email-templates/preview', async (request, reply) => {
    try {
      const data = request.body as any;

      if (!data.subject || !data.content) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'subject and content are required',
        });
      }

      // Create sample context (same as preview)
      const sampleContext = {
        client: {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+44 123 456 7890',
          company: 'ABC Corporation',
          address: '123 Main Street, London, UK',
        },
        proposal: {
          number: 'PROP-2025-001',
          title: 'Wedding Photography Package',
          description: 'Full day wedding photography with 2 photographers',
          subtotal: '£1,500.00',
          tax: '£300.00',
          total: '£1,800.00',
          url: 'http://localhost:3000/proposals/PROP-2025-001',
        },
        date: {
          today: new Date().toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          tomorrow: new Date(Date.now() + 86400000).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          nextWeek: new Date(Date.now() + 604800000).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
        business: {
          name: 'Kori Photography',
          email: 'hello@koriphotography.com',
          phone: '+44 987 654 3210',
          address: '456 Photo Lane, London, UK',
          website: 'https://koriphotography.com',
        },
      };

      // Use VariableSubstitutionService dynamically
      const { VariableSubstitutionService } = await import('../services/variableSubstitution.js');

      const subject = VariableSubstitutionService.substitute(data.subject, sampleContext);
      const content = VariableSubstitutionService.substitute(data.content, sampleContext);

      const subjectVars = VariableSubstitutionService.extractVariables(data.subject);
      const contentVars = VariableSubstitutionService.extractVariables(data.content);
      const variables = [...new Set([...subjectVars, ...contentVars])];

      return reply.status(200).send({
        success: true,
        data: {
          subject,
          content,
          variables,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error previewing template content');
      throw error;
    }
  });
}
