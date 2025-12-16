import { FastifyInstance } from 'fastify';
import { EnvelopeService } from '../services/envelope.js';
import { requireAdmin } from '../middleware/auth.js';

export async function envelopesRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/envelopes/stats
   * Get envelope statistics
   */
  fastify.get('/admin/envelopes/stats', async (request, reply) => {
    try {
      const stats = await EnvelopeService.getEnvelopeStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching envelope stats');
      throw error;
    }
  });

  /**
   * GET /admin/envelopes
   * List all envelopes
   */
  fastify.get('/admin/envelopes', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const query = request.query as any;

      const envelopes = await EnvelopeService.listEnvelopes({
        status: query.status,
        createdById: query.createdById,
      });

      return reply.status(200).send({
        success: true,
        data: envelopes,
      });
    } catch (error) {
      request.log.error(error, 'Error listing envelopes');
      throw error;
    }
  });

  /**
   * GET /admin/envelopes/:id
   * Get a single envelope by ID
   */
  fastify.get('/admin/envelopes/:id', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const envelope = await EnvelopeService.getEnvelopeById(id);

      return reply.status(200).send({
        success: true,
        data: envelope,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Envelope not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Envelope not found',
        });
      }

      request.log.error(error, 'Error fetching envelope');
      throw error;
    }
  });

  /**
   * POST /admin/envelopes
   * Create a new envelope
   */
  fastify.post('/admin/envelopes', { onRequest: [requireAdmin] }, async (request, reply) => {
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

      const envelope = await EnvelopeService.createEnvelope({
        name: data.name,
        description: data.description,
        createdById: request.user!.userId,
        signingWorkflow: data.signingWorkflow || 'SEQUENTIAL',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });

      return reply.status(201).send({
        success: true,
        data: envelope,
      });
    } catch (error) {
      request.log.error(error, 'Error creating envelope');
      throw error;
    }
  });

  /**
   * PATCH /admin/envelopes/:id
   * Update envelope
   */
  fastify.patch('/admin/envelopes/:id', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const envelope = await EnvelopeService.updateEnvelope(id, {
        name: data.name,
        description: data.description,
        signingWorkflow: data.signingWorkflow,
        status: data.status,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });

      return reply.status(200).send({
        success: true,
        data: envelope,
      });
    } catch (error) {
      request.log.error(error, 'Error updating envelope');
      throw error;
    }
  });

  /**
   * POST /admin/envelopes/:id/send
   * Send envelope to signers
   */
  fastify.post('/admin/envelopes/:id/send', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const envelope = await EnvelopeService.sendEnvelope(id);

      return reply.status(200).send({
        success: true,
        data: envelope,
        message: 'Envelope sent successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error sending envelope');
      throw error;
    }
  });

  /**
   * POST /admin/envelopes/:id/documents
   * Add document to envelope
   */
  fastify.post('/admin/envelopes/:id/documents', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      // Validate required fields
      if (!data.name || !data.fileName || !data.filePath || !data.fileHash || !data.fileSize) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'name, fileName, filePath, fileHash, and fileSize are required',
        });
      }

      const document = await EnvelopeService.addDocument({
        envelopeId: id,
        name: data.name,
        fileName: data.fileName,
        filePath: data.filePath,
        fileHash: data.fileHash,
        fileSize: data.fileSize,
      });

      return reply.status(201).send({
        success: true,
        data: document,
      });
    } catch (error) {
      request.log.error(error, 'Error adding document');
      throw error;
    }
  });

  /**
   * DELETE /admin/envelopes/:id/documents/:documentId
   * Remove document from envelope
   */
  fastify.delete('/admin/envelopes/:id/documents/:documentId', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const { id, documentId } = request.params as { id: string; documentId: string };

      const result = await EnvelopeService.removeDocument(id, documentId);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Document not found in this envelope') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message,
        });
      }

      request.log.error(error, 'Error removing document');
      throw error;
    }
  });

  /**
   * POST /admin/envelopes/:id/signers
   * Add signer to envelope
   */
  fastify.post('/admin/envelopes/:id/signers', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      // Validate required fields
      if (!data.name || !data.email) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'name and email are required',
        });
      }

      const signer = await EnvelopeService.addSigner({
        envelopeId: id,
        name: data.name,
        email: data.email,
        role: data.role,
        sequenceNumber: data.sequenceNumber,
      });

      return reply.status(201).send({
        success: true,
        data: signer,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: error.message,
        });
      }

      request.log.error(error, 'Error adding signer');
      throw error;
    }
  });

  /**
   * DELETE /admin/envelopes/:id/signers/:signerId
   * Remove signer from envelope
   */
  fastify.delete('/admin/envelopes/:id/signers/:signerId', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const { id, signerId } = request.params as { id: string; signerId: string };

      const result = await EnvelopeService.removeSigner(id, signerId);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Signer not found in this envelope') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message,
        });
      }

      request.log.error(error, 'Error removing signer');
      throw error;
    }
  });

  /**
   * GET /sign/:token
   * Get envelope info for signer (public endpoint - no auth required)
   */
  fastify.get('/sign/:token', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const signer = await EnvelopeService.getSignerByMagicToken(token);
      const envelope = await EnvelopeService.getEnvelopeForSigner(signer.id);

      return reply.status(200).send({
        success: true,
        data: envelope,
      });
    } catch (error) {
      if (error instanceof Error && (error.message === 'Invalid magic link' || error.message === 'Magic link has expired')) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: error.message,
        });
      }

      request.log.error(error, 'Error fetching signer envelope');
      throw error;
    }
  });

  /**
   * POST /sign/:token/view
   * Mark envelope as viewed by signer
   */
  fastify.post('/sign/:token/view', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const signer = await EnvelopeService.getSignerByMagicToken(token);
      await EnvelopeService.viewEnvelope(signer.id);

      return reply.status(200).send({
        success: true,
        message: 'Envelope marked as viewed',
      });
    } catch (error) {
      if (error instanceof Error && (error.message === 'Invalid magic link' || error.message === 'Magic link has expired')) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: error.message,
        });
      }

      request.log.error(error, 'Error viewing envelope');
      throw error;
    }
  });

  /**
   * POST /sign/:token/sign
   * Capture signature from signer
   */
  fastify.post('/sign/:token/sign', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const data = request.body as any;

      // Validate required fields
      if (!data.signatureDataUrl) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'signatureDataUrl is required',
        });
      }

      const signer = await EnvelopeService.getSignerByMagicToken(token);
      const envelope = await EnvelopeService.getEnvelopeById(signer.envelopeId);

      const signature = await EnvelopeService.captureSignature(
        signer.id,
        envelope.id,
        data.signatureDataUrl,
        data.initialsDataUrl,
        data.pageNumber,
        data.coordinates
      );

      return reply.status(200).send({
        success: true,
        data: signature,
        message: 'Signature captured successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Signer cannot sign at this time (workflow constraints)') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: error.message,
        });
      }

      if (error instanceof Error && (error.message === 'Invalid magic link' || error.message === 'Magic link has expired')) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: error.message,
        });
      }

      request.log.error(error, 'Error capturing signature');
      throw error;
    }
  });

  /**
   * POST /sign/:token/decline
   * Decline signature from signer
   */
  fastify.post('/sign/:token/decline', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const data = request.body as any;

      const signer = await EnvelopeService.getSignerByMagicToken(token);
      const envelope = await EnvelopeService.getEnvelopeById(signer.envelopeId);

      await EnvelopeService.declineSignature(signer.id, envelope.id, data.reason);

      return reply.status(200).send({
        success: true,
        message: 'Envelope declined successfully',
      });
    } catch (error) {
      if (error instanceof Error && (error.message === 'Invalid magic link' || error.message === 'Magic link has expired')) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: error.message,
        });
      }

      request.log.error(error, 'Error declining envelope');
      throw error;
    }
  });

  /**
   * POST /admin/envelopes/:id/signers/:signerId/verify
   * Verify signature integrity
   */
  fastify.post('/admin/envelopes/:id/signers/:signerId/verify', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const { signerId } = request.params as { id: string; signerId: string };

      const signature = await EnvelopeService.verifySignatureIntegrity(signerId);

      if (!signature) {
        return reply.status(200).send({
          success: false,
          verified: false,
          message: 'Signature verification failed - tamper detected',
        });
      }

      return reply.status(200).send({
        success: true,
        verified: true,
        message: 'Signature verified successfully',
      });
    } catch (error) {
      request.log.error(error, 'Error verifying signature');
      throw error;
    }
  });

  /**
   * GET /admin/envelopes/:id/download
   * Download all documents from completed envelope as ZIP
   */
  fastify.get('/admin/envelopes/:id/download', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const envelope = await EnvelopeService.getEnvelopeById(id);

      if (!envelope.documents || envelope.documents.length === 0) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'No documents available for download',
        });
      }

      // Return document list for download
      // The client will handle downloading each document
      return reply.status(200).send({
        success: true,
        data: {
          envelopeId: envelope.id,
          envelopeName: envelope.name,
          status: envelope.status,
          documents: envelope.documents.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            fileName: doc.fileName,
            filePath: doc.filePath,
            fileSize: doc.fileSize,
          })),
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Envelope not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Envelope not found',
        });
      }

      request.log.error(error, 'Error downloading envelope documents');
      throw error;
    }
  });

  /**
   * GET /sign/:token/download
   * Download signed document (public endpoint for signers)
   */
  fastify.get('/sign/:token/download', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const signer = await EnvelopeService.getSignerByMagicToken(token);
      const envelope = await EnvelopeService.getEnvelopeById(signer.envelopeId);

      if (envelope.status !== 'COMPLETED') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Cannot download documents until envelope is completed',
        });
      }

      // Return document list for download
      return reply.status(200).send({
        success: true,
        data: {
          envelopeId: envelope.id,
          envelopeName: envelope.name,
          status: envelope.status,
          signerName: signer.name,
          signerEmail: signer.email,
          documents: envelope.documents.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            fileName: doc.fileName,
            filePath: doc.filePath,
            fileSize: doc.fileSize,
          })),
        },
      });
    } catch (error) {
      if (error instanceof Error && (error.message === 'Invalid magic link' || error.message === 'Magic link has expired')) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: error.message,
        });
      }

      request.log.error(error, 'Error downloading signed documents');
      throw error;
    }
  });
}
