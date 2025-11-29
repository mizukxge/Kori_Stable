import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MagicLinkService } from '../services/magic-link.js';
import { SignatureService } from '../services/signature.js';
import { notifyContractSigned } from '../services/notify.js';

const prisma = new PrismaClient();

/**
 * Public Contract Signing Routes
 *
 * No authentication required - uses magic links and OTP for access
 */

export async function publicContractRoutes(fastify: FastifyInstance) {
  /**
   * GET /contract/dev/otp/:contractId
   * [DEVELOPMENT ONLY] Retrieve OTP code for a contract
   * Used during development when EMAIL_ENABLED=false
   */
  fastify.get('/contract/dev/otp/:contractId', async (request, reply) => {
    try {
      // Safety check: only allow in development
      if (process.env.NODE_ENV === 'production') {
        return reply.status(403).send({
          success: false,
          message: 'This endpoint is not available in production',
        });
      }

      const { contractId } = request.params as { contractId: string };

      // Get the current OTP from database
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        select: {
          id: true,
          otpCode: true,
          otpEmail: true,
          otpExpiresAt: true,
        },
      });

      if (!contract) {
        return reply.status(404).send({
          success: false,
          message: 'Contract not found',
        });
      }

      return reply.status(200).send({
        success: true,
        contractId,
        otpCode: contract.otpCode || null,
        otpEmail: contract.otpEmail || null,
        otpExpiresAt: contract.otpExpiresAt || null,
        message: '[DEVELOPMENT ONLY] OTP Code (check API logs for security)',
      });
    } catch (error: any) {
      request.log.error(error, 'Error retrieving OTP');
      return reply.status(500).send({
        success: false,
        message: 'Failed to retrieve OTP info',
      });
    }
  });

  /**
   * GET /contract/validate/:token
   * Validate magic link token
   */
  fastify.get('/contract/validate/:token', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const validation = await MagicLinkService.validateMagicLink(token);

      if (!validation.valid) {
        return reply.status(400).send({
          success: false,
          expired: validation.expired,
          notFound: validation.notFound,
          message: validation.expired
            ? 'This link has expired'
            : validation.notFound
            ? 'Invalid link'
            : 'This link is no longer valid',
        });
      }

      return reply.status(200).send({
        success: true,
        contractId: validation.contractId,
      });
    } catch (error) {
      request.log.error(error, 'Error validating magic link');
      return reply.status(500).send({
        success: false,
        message: 'Failed to validate link',
      });
    }
  });

  /**
   * POST /contract/request-otp
   * Request OTP for contract access
   */
  fastify.post('/contract/request-otp', async (request, reply) => {
    try {
      const { token, email } = request.body as { token: string; email: string };

      // Validate magic link first
      const validation = await MagicLinkService.validateMagicLink(token);

      if (!validation.valid || !validation.contractId) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid or expired link',
        });
      }

      // Generate OTP
      const result = await MagicLinkService.generateOTP(
        validation.contractId,
        email
      );

      request.log.info(
        {
          contractId: validation.contractId,
          email,
          expiresAt: result.expiresAt,
        },
        'OTP generated for contract signing'
      );

      return reply.status(200).send({
        success: true,
        message: 'OTP sent to your email',
        expiresAt: result.expiresAt,
      });
    } catch (error: any) {
      request.log.error(
        {
          error: error?.message || String(error),
          stack: error?.stack,
        },
        'Error generating OTP'
      );
      return reply.status(500).send({
        success: false,
        message: `Failed to generate OTP: ${error?.message || 'Unknown error'}`,
      });
    }
  });

  /**
   * POST /contract/verify-otp
   * Verify OTP and create signing session
   */
  fastify.post('/contract/verify-otp', async (request, reply) => {
    try {
      const { token, otp } = request.body as { token: string; otp: string };

      // Validate magic link
      const validation = await MagicLinkService.validateMagicLink(token);

      if (!validation.valid || !validation.contractId) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid or expired link',
        });
      }

      // Verify OTP
      const result = await MagicLinkService.verifyOTP(
        validation.contractId,
        otp
      );

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid OTP code',
          attemptsRemaining: result.attemptsRemaining,
        });
      }

      request.log.info(
        {
          contractId: validation.contractId,
          sessionId: result.sessionId,
        },
        'OTP verified, session created'
      );

      return reply.status(200).send({
        success: true,
        sessionId: result.sessionId,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      request.log.error(error, 'Error verifying OTP');
      return reply.status(500).send({
        success: false,
        message: 'Failed to verify OTP',
      });
    }
  });

  /**
   * GET /contract/view/:contractId
   * Get contract for signing (requires valid session)
   */
  fastify.get('/contract/view/:contractId', async (request, reply) => {
    try {
      const { contractId } = request.params as { contractId: string };
      const { sessionId } = request.query as { sessionId: string };

      if (!sessionId) {
        return reply.status(401).send({
          success: false,
          message: 'Session required',
        });
      }

      // Validate session
      const isValid = await MagicLinkService.validateSession(
        contractId,
        sessionId
      );

      if (!isValid) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or expired session',
        });
      }

      // Get contract data
      const contract = await MagicLinkService.getContractForSigning(contractId);

      // Record view event
      await MagicLinkService.recordView(contractId);

      return reply.status(200).send({
        success: true,
        data: contract,
      });
    } catch (error: any) {
      if (error.message.includes('already signed')) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }

      request.log.error(error, 'Error getting contract for signing');
      return reply.status(500).send({
        success: false,
        message: 'Failed to load contract',
      });
    }
  });

  /**
   * POST /contract/sign/:contractId
   * Sign the contract
   */
  fastify.post('/contract/sign/:contractId', async (request, reply) => {
    try {
      const { contractId } = request.params as { contractId: string };
      const body = request.body as any;

      const { sessionId, signatureDataUrl, signerName, signerEmail, agreedToTerms } = body;

      if (!sessionId) {
        return reply.status(401).send({
          success: false,
          message: 'Session required',
        });
      }

      // Validate session
      const isValid = await MagicLinkService.validateSession(
        contractId,
        sessionId
      );

      if (!isValid) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or expired session',
        });
      }

      // Validate signature data
      const signatureData = {
        signatureDataUrl,
        signerName,
        signerEmail,
        signerIP: request.ip,
        signerUserAgent: request.headers['user-agent'],
        agreedToTerms,
      };

      const validation = SignatureService.validateSignatureData(signatureData);

      if (!validation.valid) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid signature data',
          errors: validation.errors,
        });
      }

      // Sign the contract
      const result = await SignatureService.signContract(
        contractId,
        sessionId,
        signatureData
      );

      request.log.info(
        {
          contractId,
          signerName,
          signerEmail,
          signedAt: result.signedAt,
        },
        'Contract signed successfully'
      );

      // Send notification to contract creator
      try {
        const contract = await prisma.contract.findUnique({
          where: { id: contractId },
          include: { client: true },
        });

        if (contract && contract.createdById) {
          await notifyContractSigned(
            contract.createdById,
            contract.contractNumber || contractId,
            contract.client?.name || 'Client'
          );
        }
      } catch (notifyError) {
        request.log.warn('Failed to send contract signed notification:', notifyError);
        // Don't fail the response if notification fails
      }

      return reply.status(200).send({
        success: true,
        message: 'Contract signed successfully',
        data: result,
      });
    } catch (error: any) {
      if (error.message.includes('already signed') || error.message.includes('Invalid session')) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }

      request.log.error(error, 'Error signing contract');
      return reply.status(500).send({
        success: false,
        message: 'Failed to sign contract',
      });
    }
  });

  /**
   * POST /contract/decline/:contractId
   * Decline the contract
   */
  fastify.post('/contract/decline/:contractId', async (request, reply) => {
    try {
      const { contractId } = request.params as { contractId: string };
      const { sessionId, reason } = request.body as { sessionId: string; reason?: string };

      if (!sessionId) {
        return reply.status(401).send({
          success: false,
          message: 'Session required',
        });
      }

      // Decline contract
      await SignatureService.declineContract(contractId, sessionId, reason);

      request.log.info(
        {
          contractId,
          reason,
        },
        'Contract declined'
      );

      return reply.status(200).send({
        success: true,
        message: 'Contract declined',
      });
    } catch (error: any) {
      if (error.message.includes('Invalid session')) {
        return reply.status(401).send({
          success: false,
          message: error.message,
        });
      }

      request.log.error(error, 'Error declining contract');
      return reply.status(500).send({
        success: false,
        message: 'Failed to decline contract',
      });
    }
  });

  /**
   * POST /contract/extend-session/:contractId
   * Extend signing session
   */
  fastify.post('/contract/extend-session/:contractId', async (request, reply) => {
    try {
      const { contractId } = request.params as { contractId: string };
      const { sessionId } = request.body as { sessionId: string };

      if (!sessionId) {
        return reply.status(401).send({
          success: false,
          message: 'Session required',
        });
      }

      const newExpiresAt = await MagicLinkService.extendSession(contractId, sessionId, 1);

      if (!newExpiresAt) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or expired session',
        });
      }

      return reply.status(200).send({
        success: true,
        expiresAt: newExpiresAt,
      });
    } catch (error) {
      request.log.error(error, 'Error extending session');
      return reply.status(500).send({
        success: false,
        message: 'Failed to extend session',
      });
    }
  });
}
