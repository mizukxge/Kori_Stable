import { FastifyInstance } from 'fastify';
import { BankImportService } from '../services/bankImport.js';
import { ReconciliationService } from '../services/reconciliation.js';
import { requireAdmin } from '../middleware/auth.js';

export async function reconciliationRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/reconciliation/stats
   * Get reconciliation statistics
   */
  fastify.get('/admin/reconciliation/stats', async (request, reply) => {
    try {
      const stats = await ReconciliationService.getReconciliationStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching reconciliation stats');
      throw error;
    }
  });

  /**
   * POST /admin/reconciliation/preview-csv
   * Preview CSV before importing
   */
  fastify.post('/admin/reconciliation/preview-csv', async (request, reply) => {
    try {
      const body = request.body as any;

      if (!body.csvContent) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'csvContent is required',
        });
      }

      const preview = await BankImportService.previewCSV(body.csvContent);

      return reply.status(200).send({
        success: true,
        data: preview,
      });
    } catch (error) {
      request.log.error(error, 'Error previewing CSV');

      if (error instanceof Error) {
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
   * POST /admin/reconciliation/import-csv
   * Import bank transactions from CSV
   */
  fastify.post('/admin/reconciliation/import-csv', async (request, reply) => {
    try {
      const body = request.body as any;

      if (!body.csvContent) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'csvContent is required',
        });
      }

      const result = await BankImportService.importCSV(body.csvContent);

      request.log.info(
        {
          importBatch: result.importBatch,
          imported: result.imported,
          duplicates: result.duplicates,
          userId: request.user!.userId,
        },
        'CSV imported'
      );

      return reply.status(201).send({
        success: true,
        message: 'CSV imported successfully',
        data: result,
      });
    } catch (error) {
      request.log.error(error, 'Error importing CSV');

      if (error instanceof Error) {
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
   * GET /admin/reconciliation/import-batches
   * List import batches
   */
  fastify.get('/admin/reconciliation/import-batches', async (request, reply) => {
    try {
      const batches = await BankImportService.getImportBatches();

      return reply.status(200).send({
        success: true,
        data: batches,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching import batches');
      throw error;
    }
  });

  /**
   * GET /admin/reconciliation/import-batches/:batchId
   * Get transactions in an import batch
   */
  fastify.get('/admin/reconciliation/import-batches/:batchId', async (request, reply) => {
    try {
      const { batchId } = request.params as { batchId: string };

      const transactions = await BankImportService.getTransactionsByBatch(batchId);

      return reply.status(200).send({
        success: true,
        data: transactions,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching batch transactions');
      throw error;
    }
  });

  /**
   * DELETE /admin/reconciliation/import-batches/:batchId
   * Delete an import batch
   */
  fastify.delete('/admin/reconciliation/import-batches/:batchId', async (request, reply) => {
    try {
      const { batchId } = request.params as { batchId: string };

      const count = await BankImportService.deleteImportBatch(batchId);

      request.log.info(
        {
          importBatch: batchId,
          count,
          userId: request.user!.userId,
        },
        'Import batch deleted'
      );

      return reply.status(200).send({
        success: true,
        message: `Deleted ${count} transaction(s)`,
        data: { count },
      });
    } catch (error) {
      request.log.error(error, 'Error deleting import batch');
      throw error;
    }
  });

  /**
   * GET /admin/reconciliation/unreconciled
   * Get unreconciled bank transactions
   */
  fastify.get('/admin/reconciliation/unreconciled', async (request, reply) => {
    try {
      const transactions = await BankImportService.getUnreconciledTransactions();

      return reply.status(200).send({
        success: true,
        data: transactions,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching unreconciled transactions');
      throw error;
    }
  });

  /**
   * POST /admin/reconciliation/auto-match
   * Auto-match bank transactions
   */
  fastify.post('/admin/reconciliation/auto-match', async (request, reply) => {
    try {
      const body = request.body as any;

      const result = await ReconciliationService.autoMatch(
        body.importBatch,
        body.minConfidence || 80
      );

      request.log.info(
        {
          matched: result.matched,
          suggestions: result.suggestions,
          userId: request.user!.userId,
        },
        'Auto-match completed'
      );

      return reply.status(200).send({
        success: true,
        message: 'Auto-match completed',
        data: result,
      });
    } catch (error) {
      request.log.error(error, 'Error auto-matching');
      throw error;
    }
  });

  /**
   * GET /admin/reconciliation/matches/:bankTransactionId
   * Find match candidates for a bank transaction
   */
  fastify.get('/admin/reconciliation/matches/:bankTransactionId', async (request, reply) => {
    try {
      const { bankTransactionId } = request.params as { bankTransactionId: string };

      const candidates = await ReconciliationService.findMatches(bankTransactionId);

      // Format candidates for response
      const formatted = candidates.map((c) => ({
        payment: {
          ...c.payment,
          amount: c.payment.amount.toString(),
        },
        confidence: c.confidence,
        reasons: c.reasons,
      }));

      return reply.status(200).send({
        success: true,
        data: formatted,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Bank transaction not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Bank transaction not found',
        });
      }

      request.log.error(error, 'Error finding matches');
      throw error;
    }
  });

  /**
   * POST /admin/reconciliation/manual-match
   * Manually match bank transaction to payment
   */
  fastify.post('/admin/reconciliation/manual-match', async (request, reply) => {
    try {
      const body = request.body as any;

      if (!body.bankTransactionId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'bankTransactionId is required',
        });
      }

      if (!body.paymentId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'paymentId is required',
        });
      }

      const reconciliation = await ReconciliationService.manualMatch(
        body.bankTransactionId,
        body.paymentId,
        request.user!.userId,
        body.notes
      );

      request.log.info(
        {
          reconciliationId: reconciliation.id,
          bankTransactionId: body.bankTransactionId,
          paymentId: body.paymentId,
          userId: request.user!.userId,
        },
        'Manual match created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Match created successfully',
        data: reconciliation,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already reconciled')) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error creating manual match');
      throw error;
    }
  });

  /**
   * POST /admin/reconciliation/:id/confirm
   * Confirm a suggested match
   */
  fastify.post('/admin/reconciliation/:id/confirm', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const reconciliation = await ReconciliationService.confirmMatch(
        id,
        request.user!.userId
      );

      request.log.info(
        {
          reconciliationId: id,
          userId: request.user!.userId,
        },
        'Match confirmed'
      );

      return reply.status(200).send({
        success: true,
        message: 'Match confirmed',
        data: reconciliation,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Reconciliation not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Reconciliation not found',
        });
      }

      if (error instanceof Error && error.message.includes('already confirmed')) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error confirming match');
      throw error;
    }
  });

  /**
   * POST /admin/reconciliation/:id/reject
   * Reject a suggested match
   */
  fastify.post('/admin/reconciliation/:id/reject', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const reconciliation = await ReconciliationService.rejectMatch(
        id,
        request.user!.userId
      );

      request.log.info(
        {
          reconciliationId: id,
          userId: request.user!.userId,
        },
        'Match rejected'
      );

      return reply.status(200).send({
        success: true,
        message: 'Match rejected',
        data: reconciliation,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Reconciliation not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Reconciliation not found',
        });
      }

      request.log.error(error, 'Error rejecting match');
      throw error;
    }
  });

  /**
   * DELETE /admin/reconciliation/:id
   * Unmatch a reconciliation
   */
  fastify.delete('/admin/reconciliation/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const reconciliation = await ReconciliationService.unmatch(
        id,
        request.user!.userId
      );

      request.log.info(
        {
          reconciliationId: id,
          userId: request.user!.userId,
        },
        'Match unmatched'
      );

      return reply.status(200).send({
        success: true,
        message: 'Match removed',
        data: reconciliation,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Reconciliation not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Reconciliation not found',
        });
      }

      request.log.error(error, 'Error unmatching');
      throw error;
    }
  });

  /**
   * GET /admin/reconciliation
   * List all reconciliations
   */
  fastify.get('/admin/reconciliation', async (request, reply) => {
    try {
      const query = request.query as any;

      const reconciliations = await ReconciliationService.getReconciliations({
        status: query.status,
        importBatch: query.importBatch,
      });

      return reply.status(200).send({
        success: true,
        data: reconciliations,
      });
    } catch (error) {
      request.log.error(error, 'Error listing reconciliations');
      throw error;
    }
  });
}