import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../middleware/auth.js';
import { docGenService } from '../services/docgen.js';
import { AuditService } from '../observability/audit.js';

interface RenderDocumentBody {
  template: string;
  data: Record<string, any>;
  watermark?: {
    text: string;
    opacity?: number;
  };
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

interface VerifyDocumentBody {
  filePath: string;
  expectedHash: string;
}

export async function docgenRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * POST /admin/docgen/render
   * Render a document template to PDF
   */
  fastify.post<{ Body: RenderDocumentBody }>(
    '/admin/docgen/render',
    async (request, reply) => {
      const { template, data, watermark, metadata } = request.body;

      // Validate input
      if (!template || !data) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Template and data are required',
        });
      }

      try {
        // Generate PDF
        const result = await docGenService.generatePDF({
          template,
          data,
          watermark,
          metadata,
        });

        if (!result.success) {
          return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: result.error || 'Failed to generate PDF',
          });
        }

        // Audit log
        await AuditService.log({
          action: 'DOCUMENT_GENERATED',
          entityType: 'Document',
          userId: request.user?.userId,
          metadata: {
            template,
            filePath: result.filePath,
            hash: result.hash,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          template,
          filePath: result.filePath,
          hash: result.hash,
          userId: request.user?.userId,
        }, 'Document generated');

        return reply.status(200).send({
          success: true,
          message: 'Document generated successfully',
          data: {
            filePath: result.filePath,
            hash: result.hash,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error generating document');
        throw error;
      }
    }
  );

  /**
   * POST /admin/docgen/pdfa
   * Render a document template to PDF/A (archival format)
   */
  fastify.post<{ Body: RenderDocumentBody }>(
    '/admin/docgen/pdfa',
    async (request, reply) => {
      const { template, data, watermark, metadata } = request.body;

      // Validate input
      if (!template || !data) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Template and data are required',
        });
      }

      try {
        // Generate PDF/A
        const result = await docGenService.generatePDFA({
          template,
          data,
          watermark,
          metadata,
        });

        if (!result.success) {
          return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: result.error || 'Failed to generate PDF/A',
          });
        }

        // Audit log
        await AuditService.log({
          action: 'DOCUMENT_GENERATED_PDFA',
          entityType: 'Document',
          userId: request.user?.userId,
          metadata: {
            template,
            filePath: result.filePath,
            hash: result.hash,
            format: 'PDF/A',
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          template,
          filePath: result.filePath,
          hash: result.hash,
          format: 'PDF/A',
          userId: request.user?.userId,
        }, 'PDF/A document generated');

        return reply.status(200).send({
          success: true,
          message: 'PDF/A document generated successfully',
          data: {
            filePath: result.filePath,
            hash: result.hash,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error generating PDF/A document');
        throw error;
      }
    }
  );

  /**
   * GET /admin/docgen/templates
   * List available document templates
   */
  fastify.get('/admin/docgen/templates', async (request, reply) => {
    try {
      const templates = docGenService.listTemplates();

      return reply.status(200).send({
        success: true,
        data: templates.map(name => ({
          name,
          description: getTemplateDescription(name),
        })),
      });
    } catch (error) {
      request.log.error(error, 'Error listing templates');
      throw error;
    }
  });

  /**
   * POST /admin/docgen/verify
   * Verify document integrity using hash
   */
  fastify.post<{ Body: VerifyDocumentBody }>(
    '/admin/docgen/verify',
    async (request, reply) => {
      const { filePath, expectedHash } = request.body;

      // Validate input
      if (!filePath || !expectedHash) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'File path and expected hash are required',
        });
      }

      try {
        const isValid = docGenService.verifyDocument(filePath, expectedHash);

        // Audit log
        await AuditService.log({
          action: 'DOCUMENT_VERIFIED',
          entityType: 'Document',
          userId: request.user?.userId,
          metadata: {
            filePath,
            isValid,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          filePath,
          isValid,
          userId: request.user?.userId,
        }, 'Document verified');

        return reply.status(200).send({
          success: true,
          data: {
            filePath,
            isValid,
            message: isValid
              ? 'Document is valid and has not been tampered with'
              : 'Document verification failed - content has been modified',
          },
        });
      } catch (error) {
        request.log.error(error, 'Error verifying document');
        throw error;
      }
    }
  );

  /**
   * POST /admin/docgen/preview
   * Preview rendered HTML without generating PDF
   */
  fastify.post<{ Body: { template: string; data: Record<string, any> } }>(
    '/admin/docgen/preview',
    async (request, reply) => {
      const { template, data } = request.body;

      // Validate input
      if (!template || !data) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Template and data are required',
        });
      }

      try {
        const html = docGenService.renderHTML(template, data);

        return reply.status(200).send({
          success: true,
          data: {
            template,
            html,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error previewing template');
        
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: error.message,
          });
        }

        throw error;
      }
    }
  );
}

/**
 * Get template description
 */
function getTemplateDescription(name: string): string {
  const descriptions: Record<string, string> = {
    proposal: 'Professional proposal with pricing and terms',
    invoice: 'Invoice with line items and payment details',
    contract: 'Legal contract with signature blocks',
    document: 'Generic document template',
  };

  return descriptions[name] || 'Custom document template';
}