import { FastifyInstance } from 'fastify';
import { ProposalService } from '../services/proposal.js';
import { OTPService } from '../services/otp.js';

export async function publicProposalRoutes(fastify: FastifyInstance) {
  /**
   * GET /proposals/:proposalNumber
   * View proposal (public, no auth required)
   */
  fastify.get('/proposals/:proposalNumber', async (request, reply) => {
    try {
      const { proposalNumber } = request.params as { proposalNumber: string };

      const proposal = await ProposalService.getProposalByNumber(proposalNumber);

      // Helper to format tax rate as percentage (0-100 scale)
      // Uses smart detection to handle both decimal and percentage formats
      // Also detects and recovers from double-division bugs
      const formatTaxRate = (rate: any): number => {
        const numRate = Number(rate);
        const subtotalNum = Number(proposal.subtotal);
        const taxAmountNum = Number(proposal.taxAmount);

        if (numRate > 0 && numRate < 1) {
          // Stored as decimal, need to convert to percentage
          const calculatedDecimalRate = taxAmountNum / subtotalNum;
          const calculatedPercentageRate = calculatedDecimalRate * 100;

          // If difference is large, data mismatch detected (likely double-division bug)
          if (Math.abs(calculatedDecimalRate - numRate) > 0.01) {
            // Return the rate calculated from tax amount
            return calculatedPercentageRate;
          } else {
            // Normal case: multiply by 100
            return numRate * 100;
          }
        }

        // Already in percentage format or zero
        return numRate;
      };

      // Don't expose sensitive internal fields
      const publicProposal = {
        proposalNumber: proposal.proposalNumber,
        title: proposal.title,
        description: proposal.description,
        client: {
          name: proposal.client.name,
          email: proposal.client.email,
        },
        items: proposal.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          amount: item.amount.toString(),
        })),
        subtotal: proposal.subtotal.toString(),
        taxRate: formatTaxRate(proposal.taxRate).toString(),
        taxAmount: proposal.taxAmount.toString(),
        total: proposal.total.toString(),
        currency: proposal.currency,
        terms: proposal.terms,
        validUntil: proposal.validUntil,
        expiresAt: proposal.expiresAt,
        status: proposal.status,
        sentAt: proposal.sentAt,
        viewedAt: proposal.viewedAt,
        acceptedAt: proposal.acceptedAt,
        declinedAt: proposal.declinedAt,
      };

      return reply.status(200).send({
        success: true,
        data: publicProposal,
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
   * POST /proposals/:proposalNumber/request-otp
   * Request OTP code for proposal acceptance
   */
  fastify.post('/proposals/:proposalNumber/request-otp', async (request, reply) => {
    try {
      const { proposalNumber } = request.params as { proposalNumber: string };

      const proposal = await ProposalService.getProposalByNumber(proposalNumber);

      // Check if proposal can receive OTP
      if (proposal.status === 'ACCEPTED' || proposal.status === 'DECLINED') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'This proposal has already been processed',
        });
      }

      if (proposal.status === 'DRAFT') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'This proposal has not been sent yet',
        });
      }

      if (proposal.status === 'EXPIRED') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'This proposal has expired',
        });
      }

      // Generate new OTP
      const otp = await OTPService.generateForProposal(proposal.id);

      request.log.info(
        {
          proposalId: proposal.id,
          proposalNumber,
        },
        'OTP requested for proposal'
      );

      // In production, send OTP via email/SMS
      // For now, return it in response (NOT recommended for production!)
      return reply.status(200).send({
        success: true,
        message: 'OTP code has been generated',
        data: {
          // SECURITY: Remove this in production - send via email instead!
          otpCode: otp.code,
          formattedCode: OTPService.formatCode(otp.code),
          expiresAt: otp.expiresAt,
          expiresInMinutes: 15,
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

      request.log.error(error, 'Error requesting OTP');
      throw error;
    }
  });

  /**
   * POST /proposals/:proposalNumber/accept
   * Accept proposal with OTP validation
   */
  fastify.post('/proposals/:proposalNumber/accept', async (request, reply) => {
    try {
      const { proposalNumber } = request.params as { proposalNumber: string };
      const body = request.body as any;

      if (!body.otpCode) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'OTP code is required',
        });
      }

      // Parse OTP code (remove formatting)
      const otpCode = OTPService.parseCode(body.otpCode);

      // Get client IP and user agent
      const signatureIP = request.ip;
      const signatureAgent = request.headers['user-agent'] || 'Unknown';

      // Accept proposal
      const proposal = await ProposalService.acceptProposal(proposalNumber, otpCode, {
        signatureIP,
        signatureAgent,
      });

      request.log.info(
        {
          proposalId: proposal.id,
          proposalNumber,
          signatureIP,
        },
        'Proposal accepted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Proposal accepted successfully',
        data: {
          proposalNumber: proposal.proposalNumber,
          title: proposal.title,
          total: proposal.total.toString(),
          acceptedAt: proposal.acceptedAt,
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

        if (error.message.includes('Invalid OTP') || error.message.includes('expired') || error.message.includes('Maximum attempts')) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: error.message,
          });
        }
      }

      request.log.error(error, 'Error accepting proposal');
      throw error;
    }
  });

  /**
   * POST /proposals/:proposalNumber/decline
   * Decline proposal (no OTP required)
   */
  fastify.post('/proposals/:proposalNumber/decline', async (request, reply) => {
    try {
      const { proposalNumber } = request.params as { proposalNumber: string };
      const body = request.body as any;

      const proposal = await ProposalService.declineProposal(
        proposalNumber,
        body.reason
      );

      request.log.info(
        {
          proposalId: proposal.id,
          proposalNumber,
        },
        'Proposal declined'
      );

      return reply.status(200).send({
        success: true,
        message: 'Proposal declined',
        data: {
          proposalNumber: proposal.proposalNumber,
          declinedAt: proposal.declinedAt,
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

      request.log.error(error, 'Error declining proposal');
      throw error;
    }
  });

  /**
   * GET /proposals/:proposalNumber/pdf
   * Download proposal PDF (only if accepted)
   */
  fastify.get('/proposals/:proposalNumber/pdf', async (request, reply) => {
    try {
      const { proposalNumber } = request.params as { proposalNumber: string };

      const proposal = await ProposalService.getProposalByNumber(proposalNumber);

      if (proposal.status !== 'ACCEPTED') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'PDF is only available for accepted proposals',
        });
      }

      if (!proposal.pdfPath) {
        // Generate PDF if not exists
        await ProposalService.generatePDF(proposal.id);
        const updated = await ProposalService.getProposalById(proposal.id);
        
        if (!updated.pdfPath) {
          throw new Error('Failed to generate PDF');
        }

        return reply.sendFile(updated.pdfPath.split('/').pop()!, {
          root: updated.pdfPath.substring(0, updated.pdfPath.lastIndexOf('/')),
        });
      }

      return reply.sendFile(proposal.pdfPath.split('/').pop()!, {
        root: proposal.pdfPath.substring(0, proposal.pdfPath.lastIndexOf('/')),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Proposal not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Proposal not found',
        });
      }

      request.log.error(error, 'Error downloading PDF');
      throw error;
    }
  });
}