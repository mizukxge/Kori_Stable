import { FastifyInstance } from 'fastify';
import { RecordService } from '../services/record.js';
import { requireAdmin } from '../middleware/auth.js';

export async function recordsRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/records/stats
   * Get record statistics
   */
  fastify.get('/admin/records/stats', async (request, reply) => {
    try {
      const stats = await RecordService.getRecordStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching record stats');
      throw error;
    }
  });

  /**
   * GET /admin/records
   * List all records
   */
  fastify.get('/admin/records', async (request, reply) => {
    try {
      const query = request.query as any;

      const records = await RecordService.listRecords({
        category: query.category,
        verificationStatus: query.verificationStatus,
        legalHold: query.legalHold === 'true' ? true : query.legalHold === 'false' ? false : undefined,
        clientId: query.clientId,
      });

      return reply.status(200).send({
        success: true,
        data: records,
      });
    } catch (error) {
      request.log.error(error, 'Error listing records');
      throw error;
    }
  });

  /**
   * GET /admin/records/:id
   * Get a single record by ID
   */
  fastify.get('/admin/records/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const record = await RecordService.getRecordById(id);

      return reply.status(200).send({
        success: true,
        data: record,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Record not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Record not found',
        });
      }

      request.log.error(error, 'Error fetching record');
      throw error;
    }
  });

  /**
   * POST /admin/records/archive
   * Archive a file to WORM storage
   */
  fastify.post('/admin/records/archive', async (request, reply) => {
    try {
      const data = request.body as any;

      // Validate required fields
      if (!data.filename) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'filename is required',
        });
      }

      if (!data.filePath) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'filePath is required',
        });
      }

      if (!data.category) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'category is required',
        });
      }

      const record = await RecordService.archiveRecord(
        {
          filename: data.filename,
          filePath: data.filePath,
          description: data.description,
          category: data.category,
          tags: data.tags,
          retentionPolicyId: data.retentionPolicyId,
          clientId: data.clientId,
          legalHold: data.legalHold,
          legalHoldReason: data.legalHoldReason,
        },
        request.user!.userId
      );

      request.log.info(
        {
          recordId: record.id,
          recordNumber: record.recordNumber,
          userId: request.user!.userId,
        },
        'Record archived'
      );

      return reply.status(201).send({
        success: true,
        message: 'Record archived successfully',
        data: record,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('File not found') ||
          error.message.includes('already archived'))
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error archiving record');
      throw error;
    }
  });

  /**
   * POST /admin/records/:id/verify
   * Verify hash integrity of a record
   */
  fastify.post('/admin/records/:id/verify', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const result = await RecordService.verifyRecord(id, request.user!.userId);

      request.log.info(
        {
          recordId: id,
          status: result.status,
          matched: result.verification.matched,
          userId: request.user!.userId,
        },
        'Record verified'
      );

      return reply.status(200).send({
        success: true,
        message: 'Record verified',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Record not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Record not found',
        });
      }

      request.log.error(error, 'Error verifying record');
      throw error;
    }
  });

  /**
   * POST /admin/records/verify-all
   * Verify all records
   */
  fastify.post('/admin/records/verify-all', async (request, reply) => {
    try {
      const results = await RecordService.verifyAllRecords(request.user!.userId);

      request.log.info(
        {
          total: results.total,
          verified: results.verified,
          failed: results.failed,
          errors: results.errors,
          userId: request.user!.userId,
        },
        'All records verified'
      );

      return reply.status(200).send({
        success: true,
        message: 'All records verified',
        data: results,
      });
    } catch (error) {
      request.log.error(error, 'Error verifying all records');
      throw error;
    }
  });

  /**
   * POST /admin/records/:id/legal-hold
   * Place legal hold on a record
   */
  fastify.post('/admin/records/:id/legal-hold', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (!body.reason) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'reason is required for legal hold',
        });
      }

      const record = await RecordService.placeLegalHold(
        id,
        request.user!.userId,
        body.reason
      );

      request.log.info(
        {
          recordId: id,
          reason: body.reason,
          userId: request.user!.userId,
        },
        'Legal hold placed'
      );

      return reply.status(200).send({
        success: true,
        message: 'Legal hold placed successfully',
        data: record,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Record not found' ||
          error.message.includes('already has legal hold'))
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error placing legal hold');
      throw error;
    }
  });

  /**
   * DELETE /admin/records/:id/legal-hold
   * Release legal hold on a record
   */
  fastify.delete('/admin/records/:id/legal-hold', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const record = await RecordService.releaseLegalHold(id, request.user!.userId);

      request.log.info(
        {
          recordId: id,
          userId: request.user!.userId,
        },
        'Legal hold released'
      );

      return reply.status(200).send({
        success: true,
        message: 'Legal hold released successfully',
        data: record,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Record not found' ||
          error.message.includes('does not have legal hold'))
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error releasing legal hold');
      throw error;
    }
  });

  /**
   * POST /admin/records/dispose-expired
   * Dispose expired records
   */
  fastify.post('/admin/records/dispose-expired', async (request, reply) => {
    try {
      const disposed = await RecordService.disposeExpiredRecords(
        request.user!.userId
      );

      request.log.info(
        {
          count: disposed.length,
          userId: request.user!.userId,
        },
        'Expired records disposed'
      );

      return reply.status(200).send({
        success: true,
        message: `Disposed ${disposed.length} expired records`,
        data: {
          count: disposed.length,
          records: disposed,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error disposing expired records');
      throw error;
    }
  });
}