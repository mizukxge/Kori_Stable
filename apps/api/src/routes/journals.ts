import { FastifyInstance } from 'fastify';
import { JournalService } from '../services/journal.js';
import { requireAdmin } from '../middleware/auth.js';

export async function journalsRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/journals/stats
   * Get journal statistics
   */
  fastify.get('/admin/journals/stats', async (request, reply) => {
    try {
      const stats = await JournalService.getJournalStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching journal stats');
      throw error;
    }
  });

  /**
   * GET /admin/journals
   * List all journal entries
   */
  fastify.get('/admin/journals', async (request, reply) => {
    try {
      const query = request.query as any;

      const journals = await JournalService.listJournalEntries({
        periodId: query.periodId,
        status: query.status,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });

      return reply.status(200).send({
        success: true,
        data: journals,
      });
    } catch (error) {
      request.log.error(error, 'Error listing journals');
      throw error;
    }
  });

  /**
   * GET /admin/journals/:id
   * Get a single journal entry by ID
   */
  fastify.get('/admin/journals/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const journal = await JournalService.getJournalById(id);

      return reply.status(200).send({
        success: true,
        data: journal,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Journal entry not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Journal entry not found',
        });
      }

      request.log.error(error, 'Error fetching journal');
      throw error;
    }
  });

  /**
   * POST /admin/journals
   * Create a new journal entry
   */
  fastify.post('/admin/journals', async (request, reply) => {
    try {
      const data = request.body as any;

      // Validate required fields
      if (!data.periodId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'periodId is required',
        });
      }

      if (!data.entryDate) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'entryDate is required',
        });
      }

      if (!data.description) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'description is required',
        });
      }

      if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'lines array is required and must not be empty',
        });
      }

      const journal = await JournalService.createJournalEntry(
        {
          periodId: data.periodId,
          entryDate: new Date(data.entryDate),
          description: data.description,
          reference: data.reference,
          lines: data.lines,
        },
        request.user!.userId
      );

      request.log.info(
        {
          journalId: journal.id,
          journalNumber: journal.journalNumber,
          userId: request.user!.userId,
        },
        'Journal entry created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Journal entry created successfully',
        data: {
          id: journal.id,
          journalNumber: journal.journalNumber,
          description: journal.description,
          status: journal.status,
          createdAt: journal.createdAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('not balanced') ||
          error.message.includes('Cannot modify journal'))
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error creating journal');
      throw error;
    }
  });

  /**
   * PUT /admin/journals/:id
   * Update a journal entry (only drafts)
   */
  fastify.put('/admin/journals/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const journal = await JournalService.updateJournalEntry(
        id,
        {
          entryDate: data.entryDate ? new Date(data.entryDate) : undefined,
          description: data.description,
          reference: data.reference,
          lines: data.lines,
        },
        request.user!.userId
      );

      request.log.info(
        {
          journalId: id,
          userId: request.user!.userId,
        },
        'Journal entry updated'
      );

      return reply.status(200).send({
        success: true,
        message: 'Journal entry updated successfully',
        data: journal,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Journal entry not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Journal entry not found',
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes('Can only update draft') ||
          error.message.includes('not balanced') ||
          error.message.includes('Cannot modify journal'))
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error updating journal');
      throw error;
    }
  });

  /**
   * POST /admin/journals/:id/post
   * Post a journal entry (make it permanent)
   */
  fastify.post('/admin/journals/:id/post', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const journal = await JournalService.postJournalEntry(id, request.user!.userId);

      request.log.info(
        {
          journalId: id,
          userId: request.user!.userId,
        },
        'Journal entry posted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Journal entry posted successfully',
        data: journal,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Journal entry not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Journal entry not found',
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes('Can only post draft') ||
          error.message.includes('not balanced') ||
          error.message.includes('Cannot modify journal'))
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error posting journal');
      throw error;
    }
  });

  /**
   * POST /admin/journals/:id/approve
   * Approve a posted journal entry
   */
  fastify.post('/admin/journals/:id/approve', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const journal = await JournalService.approveJournalEntry(
        id,
        request.user!.userId
      );

      request.log.info(
        {
          journalId: id,
          userId: request.user!.userId,
        },
        'Journal entry approved'
      );

      return reply.status(200).send({
        success: true,
        message: 'Journal entry approved successfully',
        data: journal,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Journal entry not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Journal entry not found',
        });
      }

      if (
        error instanceof Error &&
        error.message.includes('Can only approve posted')
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error approving journal');
      throw error;
    }
  });

  /**
   * POST /admin/journals/:id/void
   * Void a journal entry
   */
  fastify.post('/admin/journals/:id/void', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (!body.reason) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'reason is required for voiding a journal entry',
        });
      }

      const journal = await JournalService.voidJournalEntry(
        id,
        request.user!.userId,
        body.reason
      );

      request.log.info(
        {
          journalId: id,
          reason: body.reason,
          userId: request.user!.userId,
        },
        'Journal entry voided'
      );

      return reply.status(200).send({
        success: true,
        message: 'Journal entry voided successfully',
        data: journal,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Journal entry not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Journal entry not found',
        });
      }

      if (
        error instanceof Error &&
        error.message.includes('Cannot modify journal')
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error voiding journal');
      throw error;
    }
  });

  /**
   * DELETE /admin/journals/:id
   * Delete a journal entry (only drafts)
   */
  fastify.delete('/admin/journals/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const journal = await JournalService.deleteJournalEntry(
        id,
        request.user!.userId
      );

      request.log.info(
        {
          journalId: id,
          userId: request.user!.userId,
        },
        'Journal entry deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Journal entry deleted successfully',
        data: {
          id: journal.id,
          journalNumber: journal.journalNumber,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Journal entry not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Journal entry not found',
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes('Can only delete draft') ||
          error.message.includes('Cannot modify journal'))
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error deleting journal');
      throw error;
    }
  });
}