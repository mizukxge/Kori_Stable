import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../middleware/auth.js';
import { emailService, maskEmail } from '../plugins/email.js';
import { AuditService } from '../observability/audit.js';

interface PreviewEmailBody {
  template: string;
  variables: Record<string, any>;
}

interface SendEmailBody {
  to: string | string[];
  subject: string;
  template?: string;
  variables?: Record<string, any>;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export async function emailRoutes(fastify: FastifyInstance) {
  /**
   * POST /admin/email/preview
   * Preview a rendered email template
   */
  fastify.post<{ Body: PreviewEmailBody }>(
    '/admin/email/preview',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { template, variables } = request.body;

      // Validate input
      if (!template) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Template name is required',
        });
      }

      try {
        // Render the template
        const html = emailService.renderTemplate(template, variables || {});

        request.log.info({
          template,
          userId: request.user?.userId,
        }, 'Email template previewed');

        return reply.status(200).send({
          success: true,
          data: {
            template,
            html,
            variables,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error previewing email template');
        
        if (error instanceof Error && error.message.includes('Failed to load template')) {
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

  /**
   * POST /admin/email/send
   * Send an email
   */
  fastify.post<{ Body: SendEmailBody }>(
    '/admin/email/send',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { to, subject, template, variables, html, text, cc, bcc, replyTo } = request.body;

      // Validate input
      if (!to || !subject) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'To and subject are required',
        });
      }

      // Must have either template or html
      if (!template && !html) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Either template or html is required',
        });
      }

      try {
        let emailHtml = html;

        // Render template if provided
        if (template) {
          emailHtml = emailService.renderTemplate(template, variables || {});
        }

        // Send email
        const result = await emailService.send({
          to,
          subject,
          html: emailHtml,
          text,
          cc,
          bcc,
          replyTo,
        });

        // Audit log
        await AuditService.log({
          action: 'EMAIL_SENT',
          entityType: 'Email',
          userId: request.user?.userId,
          metadata: {
            to: Array.isArray(to) ? to.map(maskEmail) : maskEmail(to),
            subject,
            template,
            success: result.success,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        request.log.info({
          to: Array.isArray(to) ? to.map(maskEmail) : maskEmail(to),
          subject,
          template,
          success: result.success,
          userId: request.user?.userId,
        }, 'Email sent');

        if (!result.success) {
          return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: result.error || 'Failed to send email',
          });
        }

        return reply.status(200).send({
          success: true,
          message: 'Email sent successfully',
          data: {
            messageId: result.messageId,
          },
        });
      } catch (error) {
        request.log.error(error, 'Error sending email');
        throw error;
      }
    }
  );

  /**
   * GET /admin/email/templates
   * List available email templates
   */
  fastify.get(
    '/admin/email/templates',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const templates = [
        {
          name: 'magic-link',
          description: 'Magic link for passwordless authentication',
          requiredVars: ['link', 'name (optional)'],
        },
        {
          name: 'otp',
          description: 'One-time password verification code',
          requiredVars: ['code', 'expiryMinutes', 'name (optional)'],
        },
        {
          name: 'proposal',
          description: 'Proposal notification',
          requiredVars: ['clientName', 'proposalTitle', 'proposalNumber', 'proposalLink', 'total', 'currency', 'description (optional)'],
        },
        {
          name: 'invoice',
          description: 'Invoice notification',
          requiredVars: ['clientName', 'invoiceNumber', 'invoiceDate', 'paymentLink', 'amountDue', 'currency', 'dueDate (optional)'],
        },
        {
          name: 'payment-receipt',
          description: 'Payment receipt confirmation',
          requiredVars: ['clientName', 'receiptNumber', 'paymentDate', 'amount', 'currency', 'paymentMethod', 'invoiceNumber (optional)'],
        },
        {
          name: 'notification',
          description: 'Generic notification',
          requiredVars: ['title', 'message', 'name (optional)'],
        },
      ];

      return reply.status(200).send({
        success: true,
        data: templates,
      });
    }
  );

  /**
   * GET /admin/email/test
   * Test email configuration
   */
  fastify.get(
    '/admin/email/test',
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const verified = await emailService.verify();

        return reply.status(200).send({
          success: true,
          data: {
            provider: process.env.EMAIL_PROVIDER || 'stub',
            verified,
            from: {
              name: process.env.EMAIL_FROM_NAME || 'Kori',
              email: process.env.EMAIL_FROM_ADDRESS || 'noreply@kori.dev',
            },
          },
        });
      } catch (error) {
        request.log.error(error, 'Error testing email configuration');
        throw error;
      }
    }
  );
}