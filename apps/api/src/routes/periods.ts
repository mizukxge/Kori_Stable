import { FastifyInstance } from 'fastify';
import { PeriodService } from '../services/period.js';
import { requireAdmin } from '../middleware/auth.js';

export async function periodsRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/periods/stats
   * Get period statistics
   */
  fastify.get('/admin/periods/stats', async (request, reply) => {
    try {
      const stats = await PeriodService.getPeriodStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching period stats');
      throw error;
    }
  });

  /**
   * GET /admin/periods/current
   * Get current open period
   */
  fastify.get('/admin/periods/current', async (request, reply) => {
    try {
      const query = request.query as any;
      const periodType = query.periodType || 'MONTHLY';

      const period = await PeriodService.getCurrentPeriod(periodType);

      if (!period) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'No current open period found',
        });
      }

      return reply.status(200).send({
        success: true,
        data: period,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching current period');
      throw error;
    }
  });

  /**
   * GET /admin/periods
   * List all periods
   */
  fastify.get('/admin/periods', async (request, reply) => {
    try {
      const query = request.query as any;

      const periods = await PeriodService.listPeriods({
        status: query.status,
        periodType: query.periodType,
        year: query.year ? parseInt(query.year) : undefined,
      });

      return reply.status(200).send({
        success: true,
        data: periods,
      });
    } catch (error) {
      request.log.error(error, 'Error listing periods');
      throw error;
    }
  });

  /**
   * GET /admin/periods/:id
   * Get a single period by ID
   */
  fastify.get('/admin/periods/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const period = await PeriodService.getPeriodById(id);

      return reply.status(200).send({
        success: true,
        data: period,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Period not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Period not found',
        });
      }

      request.log.error(error, 'Error fetching period');
      throw error;
    }
  });

  /**
   * POST /admin/periods
   * Create a new accounting period
   */
  fastify.post('/admin/periods', async (request, reply) => {
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

      if (!data.periodType) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'periodType is required',
        });
      }

      if (!data.startDate || !data.endDate) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'startDate and endDate are required',
        });
      }

      const period = await PeriodService.createPeriod({
        name: data.name,
        periodType: data.periodType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });

      request.log.info(
        {
          periodId: period.id,
          periodName: period.name,
          userId: request.user!.userId,
        },
        'Period created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Period created successfully',
        data: period,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('overlaps')) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error creating period');
      throw error;
    }
  });

  /**
   * POST /admin/periods/generate
   * Generate periods for a year
   */
  fastify.post('/admin/periods/generate', async (request, reply) => {
    try {
      const data = request.body as any;

      if (!data.year) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'year is required',
        });
      }

      if (!data.periodType) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'periodType is required',
        });
      }

      const periods = await PeriodService.generatePeriodsForYear(
        parseInt(data.year),
        data.periodType
      );

      request.log.info(
        {
          year: data.year,
          periodType: data.periodType,
          count: periods.length,
          userId: request.user!.userId,
        },
        'Periods generated'
      );

      return reply.status(201).send({
        success: true,
        message: `Generated ${periods.length} periods`,
        data: periods,
      });
    } catch (error) {
      request.log.error(error, 'Error generating periods');
      throw error;
    }
  });

  /**
   * POST /admin/periods/:id/validate-close
   * Validate if period can be closed
   */
  fastify.post('/admin/periods/:id/validate-close', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const validation = await PeriodService.validatePeriodClose(id);

      return reply.status(200).send({
        success: true,
        data: validation,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Period not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Period not found',
        });
      }

      request.log.error(error, 'Error validating period close');
      throw error;
    }
  });

  /**
   * POST /admin/periods/:id/close
   * Close an accounting period
   */
  fastify.post('/admin/periods/:id/close', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const period = await PeriodService.closePeriod(
        id,
        request.user!.userId,
        body.force || false
      );

      request.log.info(
        {
          periodId: id,
          periodName: period.name,
          userId: request.user!.userId,
        },
        'Period closed'
      );

      return reply.status(200).send({
        success: true,
        message: 'Period closed successfully',
        data: period,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Period not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Period not found',
        });
      }

      if (
        error instanceof Error &&
        (error.message.includes('already closed') ||
          error.message.includes('cannot be closed'))
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error closing period');
      throw error;
    }
  });

  /**
   * POST /admin/periods/:id/lock
   * Lock an accounting period (permanent close)
   */
  fastify.post('/admin/periods/:id/lock', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const period = await PeriodService.lockPeriod(id, request.user!.userId);

      request.log.info(
        {
          periodId: id,
          periodName: period.name,
          userId: request.user!.userId,
        },
        'Period locked'
      );

      return reply.status(200).send({
        success: true,
        message: 'Period locked successfully',
        data: period,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Period not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Period not found',
        });
      }

      if (
        error instanceof Error &&
        error.message.includes('must be closed before')
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error locking period');
      throw error;
    }
  });

  /**
   * POST /admin/periods/:id/unlock
   * Unlock an accounting period (reopen)
   */
  fastify.post('/admin/periods/:id/unlock', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (!body.reason) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'reason is required for unlocking a period',
        });
      }

      const period = await PeriodService.unlockPeriod(
        id,
        request.user!.userId,
        body.reason
      );

      request.log.info(
        {
          periodId: id,
          periodName: period.name,
          reason: body.reason,
          userId: request.user!.userId,
        },
        'Period unlocked'
      );

      return reply.status(200).send({
        success: true,
        message: 'Period unlocked successfully',
        data: period,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Period not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Period not found',
        });
      }

      if (error instanceof Error && error.message.includes('already open')) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error unlocking period');
      throw error;
    }
  });

  /**
   * DELETE /admin/periods/:id
   * Delete an accounting period
   */
  fastify.delete('/admin/periods/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const period = await PeriodService.deletePeriod(id, request.user!.userId);

      request.log.info(
        {
          periodId: id,
          periodName: period.name,
          userId: request.user!.userId,
        },
        'Period deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Period deleted successfully',
        data: {
          id: period.id,
          name: period.name,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Period not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Period not found',
        });
      }

      if (
        error instanceof Error &&
        error.message.includes('Cannot delete period with')
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error deleting period');
      throw error;
    }
  });
}