import { FastifyInstance } from 'fastify';
import { ProposalService } from '../services/proposal.js';
import { ProposalConversionService } from '../services/proposalConversion.js';
import { ProposalEmailTemplateService } from '../services/proposalEmailTemplate.js';
import { sendEmail } from '../services/email.js';
import { requireAdmin } from '../middleware/auth.js';

export async function proposalsRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/proposals/stats
   * Get proposal statistics
   */
  fastify.get('/admin/proposals/stats', async (request, reply) => {
    try {
      const stats = await ProposalService.getProposalStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching proposal stats');
      throw error;
    }
  });

  /**
   * GET /admin/proposals
   * List all proposals
   */
  fastify.get('/admin/proposals', async (request, reply) => {
    try {
      const query = request.query as any;

      const proposals = await ProposalService.listProposals({
        clientId: query.clientId,
        status: query.status,
      });

      return reply.status(200).send({
        success: true,
        data: proposals,
      });
    } catch (error) {
      request.log.error(error, 'Error listing proposals');
      throw error;
    }
  });

  /**
   * GET /admin/proposals/:id
   * Get a single proposal by ID
   */
  fastify.get('/admin/proposals/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const proposal = await ProposalService.getProposalById(id);

      return reply.status(200).send({
        success: true,
        data: proposal,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Proposal not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Proposal not found',
        });
      }

      request.log.error(error, 'Error fetching proposal');
      throw error;
    }
  });

  /**
   * POST /admin/proposals
   * Create a new proposal
   */
  fastify.post('/admin/proposals', async (request, reply) => {
    try {
      const data = request.body as any;

      // Validate required fields
      if (!data.title) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'title is required',
        });
      }

      if (!data.clientId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'clientId is required',
        });
      }

      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'items array is required and must not be empty',
        });
      }

      const proposal = await ProposalService.createProposal(
        data,
        request.user!.userId
      );

      request.log.info(
        {
          proposalId: proposal.id,
          proposalNumber: proposal.proposalNumber,
          userId: request.user!.userId,
        },
        'Proposal created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Proposal created successfully',
        data: {
          id: proposal.id,
          proposalNumber: proposal.proposalNumber,
          title: proposal.title,
          total: proposal.total.toString(),
          status: proposal.status,
          createdAt: proposal.createdAt,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error creating proposal');
      throw error;
    }
  });

  /**
   * PUT /admin/proposals/:id
   * Update a proposal (only if DRAFT)
   */
  fastify.put('/admin/proposals/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      // Check if proposal is still draft
      const existing = await ProposalService.getProposalById(id);
      if (existing.status !== 'DRAFT') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Only draft proposals can be updated',
        });
      }

      const proposal = await ProposalService.updateProposal(
        id,
        data,
        request.user!.userId
      );

      request.log.info(
        {
          proposalId: id,
          userId: request.user!.userId,
        },
        'Proposal updated'
      );

      return reply.status(200).send({
        success: true,
        message: 'Proposal updated successfully',
        data: proposal,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Proposal not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Proposal not found',
        });
      }

      request.log.error(error, 'Error updating proposal');
      throw error;
    }
  });

  /**
   * POST /admin/proposals/:id/send
   * Send proposal to client (generates OTP)
   */
  fastify.post('/admin/proposals/:id/send', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const result = await ProposalService.sendProposal(id, request.user!.userId);

      request.log.info(
        {
          proposalId: id,
          proposalNumber: result.proposal.proposalNumber,
          userId: request.user!.userId,
        },
        'Proposal sent'
      );

      return reply.status(200).send({
        success: true,
        message: 'Proposal sent successfully',
        data: {
          proposalNumber: result.proposal.proposalNumber,
          status: result.proposal.status,
          sentAt: result.proposal.sentAt,
          publicUrl: `/proposals/${result.proposal.proposalNumber}`,
          // For testing - remove in production
          otpCode: result.otp.code,
          otpExpiresAt: result.otp.expiresAt,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Proposal not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Proposal not found',
          });
        }

        if (error.message === 'Only draft proposals can be sent') {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }
      }

      request.log.error(error, 'Error sending proposal');
      throw error;
    }
  });

  /**
   * POST /admin/proposals/:id/generate-pdf
   * Generate PDF for proposal
   */
  fastify.post('/admin/proposals/:id/generate-pdf', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const pdfPath = await ProposalService.generatePDF(id);

      request.log.info(
        {
          proposalId: id,
          userId: request.user!.userId,
        },
        'Proposal PDF generated'
      );

      return reply.status(200).send({
        success: true,
        message: 'PDF generated successfully',
        data: {
          pdfPath,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Proposal not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Proposal not found',
        });
      }

      request.log.error(error, 'Error generating PDF');
      throw error;
    }
  });

  /**
   * DELETE /admin/proposals/:id
   * Delete a proposal
   */
  fastify.delete('/admin/proposals/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const proposal = await ProposalService.deleteProposal(id, request.user!.userId);

      request.log.info(
        {
          proposalId: id,
          userId: request.user!.userId,
        },
        'Proposal deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Proposal deleted successfully',
        data: {
          id: proposal.id,
          proposalNumber: proposal.proposalNumber,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Proposal not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Proposal not found',
        });
      }

      request.log.error(error, 'Error deleting proposal');
      throw error;
    }
  });

  /**
   * POST /admin/proposals/:id/send-email
   * Send proposal via email using an email template
   */
  fastify.post('/admin/proposals/:id/send-email', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      // Get proposal
      const proposal = await ProposalService.getProposalById(id);

      if (!proposal.client) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Proposal must have a client associated',
        });
      }

      // Get or use template
      let templateId = body.templateId;
      let renderedEmail;

      if (templateId) {
        // Render using specified template
        renderedEmail = await ProposalEmailTemplateService.renderTemplate(
          templateId,
          id,
          request.user!.userId
        );
      } else {
        // Get default template
        const defaultTemplate = await ProposalEmailTemplateService.getDefaultTemplate(
          request.user!.userId
        );

        if (!defaultTemplate) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'No template specified and no default template found',
          });
        }

        templateId = defaultTemplate.id;
        renderedEmail = await ProposalEmailTemplateService.renderTemplate(
          defaultTemplate.id,
          id,
          request.user!.userId
        );
      }

      // Use custom recipient email if provided, otherwise use client email
      const recipientEmail = body.recipientEmail || proposal.client.email;

      // Add custom message if provided
      let emailContent = renderedEmail.content;
      if (body.customMessage) {
        emailContent = `
          <div style="padding: 20px; background: #f7fafc; border-left: 4px solid #4F46E5; margin-bottom: 20px;">
            <p style="margin: 0; white-space: pre-wrap;">${body.customMessage}</p>
          </div>
          ${emailContent}
        `;
      }

      // Send email
      const emailLogId = await sendEmail({
        to: recipientEmail,
        subject: renderedEmail.subject,
        html: emailContent,
        template: 'proposal',
        metadata: {
          proposalId: proposal.id,
          proposalNumber: proposal.proposalNumber,
          templateId,
          customMessage: body.customMessage || null,
        },
      });

      if (!emailLogId) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to send email',
        });
      }

      // Update proposal with email template ID
      await ProposalService.updateProposal(id, { emailTemplateId: templateId }, request.user!.userId);

      request.log.info(
        {
          proposalId: id,
          proposalNumber: proposal.proposalNumber,
          recipientEmail,
          emailLogId,
          userId: request.user!.userId,
        },
        'Proposal email sent'
      );

      return reply.status(200).send({
        success: true,
        message: 'Proposal email sent successfully',
        data: {
          emailLogId,
          recipientEmail,
          subject: renderedEmail.subject,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Proposal not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Proposal not found',
          });
        }

        if (error.message === 'Email template not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Email template not found',
          });
        }
      }

      request.log.error(error, 'Error sending proposal email');
      throw error;
    }
  });

  /**
   * POST /admin/proposals/:id/accept-and-convert
   * Accept a proposal and automatically create linked contract and invoice
   * Single-click conversion feature
   */
  fastify.post('/admin/proposals/:id/accept-and-convert', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const result = await ProposalConversionService.acceptAndConvert(id);

      request.log.info(
        {
          proposalId: id,
          contractId: result.contract.id,
          invoiceId: result.invoice.id,
          userId: request.user!.userId,
        },
        'Proposal accepted and converted to contract and invoice'
      );

      return reply.status(201).send({
        success: true,
        message: 'Proposal accepted and converted successfully',
        data: {
          proposal: result.proposal,
          contract: result.contract,
          invoice: result.invoice,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Proposal not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Proposal not found',
        });
      }

      if (
        error instanceof Error &&
        error.message.includes('Proposal cannot be accepted from status')
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error accepting and converting proposal');
      throw error;
    }
  });

  /**
   * GET /admin/proposals/:id/conversion-status
   * Get the conversion status of a proposal
   */
  fastify.get('/admin/proposals/:id/conversion-status', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const status = await ProposalConversionService.getConversionStatus(id);

      return reply.status(200).send({
        success: true,
        data: status,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Proposal not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Proposal not found',
        });
      }

      request.log.error(error, 'Error getting conversion status');
      throw error;
    }
  });

  /**
   * POST /admin/proposals/:id/undo-conversion
   * Undo a proposal acceptance and mark contract/invoice as voided/cancelled
   */
  fastify.post('/admin/proposals/:id/undo-conversion', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      await ProposalConversionService.undoConversion(id);

      request.log.info(
        {
          proposalId: id,
          userId: request.user!.userId,
        },
        'Proposal conversion undone'
      );

      return reply.status(200).send({
        success: true,
        message: 'Proposal conversion undone successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Proposal not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Proposal not found',
        });
      }

      if (
        error instanceof Error &&
        error.message === 'Proposal must be accepted to undo conversion'
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error undoing conversion');
      throw error;
    }
  });
}