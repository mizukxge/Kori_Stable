import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient, AppointmentType, AppointmentStatus, AppointmentOutcome } from '@prisma/client';
import { AppointmentService } from '../services/appointments.js';
import { requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const createInvitationSchema = z.object({
  clientId: z.string().min(1),
  type: z.enum(['Introduction', 'CreativeDirection', 'ContractInvoicing']),
  proposalId: z.string().optional(),
  contractId: z.string().optional(),
  invoiceId: z.string().optional(),
  expiresInDays: z.number().optional().default(3),
});

const rescheduleSchema = z.object({
  newScheduledAt: z.string().datetime(),
});

const completeSchema = z.object({
  outcome: z.enum(['Positive', 'Neutral', 'Negative']),
  callSummary: z.string().optional(),
});

const noShowSchema = z.object({
  reason: z.string().optional(),
});

const cancelSchema = z.object({
  reason: z.string().optional(),
});

const blockedTimeSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string(),
});

const updateSettingsSchema = z.object({
  workdayStart: z.number().optional(),
  workdayEnd: z.number().optional(),
  bufferMinutes: z.number().optional(),
  bookingWindowDays: z.number().optional(),
  activeTypes: z.array(z.string()).optional(),
  timezone: z.string().optional(),
});

export async function appointmentsRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * POST /admin/appointments/invite
   * Create a new appointment invitation with tokenised link
   */
  fastify.post('/admin/appointments/invite', async (request, reply) => {
    try {
      const payload = createInvitationSchema.parse(request.body);
      const result = await AppointmentService.createInvitation(payload);

      return reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error) {
      request.log.error(error, 'Error creating appointment invitation');
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          details: error.issues,
        });
      }
      throw error;
    }
  });

  /**
   * GET /admin/appointments
   * List appointments with filters
   */
  fastify.get('/admin/appointments', async (request, reply) => {
    try {
      const query = request.query as any;

      const result = await AppointmentService.listAppointments({
        clientId: query.clientId,
        status: query.status as AppointmentStatus | undefined,
        type: query.type as AppointmentType | undefined,
        dateRangeStart: query.dateRangeStart ? new Date(query.dateRangeStart) : undefined,
        dateRangeEnd: query.dateRangeEnd ? new Date(query.dateRangeEnd) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
        offset: query.offset ? parseInt(query.offset, 10) : 0,
      });

      return reply.status(200).send({
        success: true,
        data: result.appointments,
        pagination: {
          total: result.total,
          limit: query.limit ? parseInt(query.limit, 10) : 20,
          offset: query.offset ? parseInt(query.offset, 10) : 0,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error listing appointments');
      throw error;
    }
  });

  /**
   * GET /admin/appointments/stats
   * Get appointment statistics with optional filters
   */
  fastify.get('/admin/appointments/stats', async (request, reply) => {
    try {
      const query = request.query as any;

      const filters: any = {};
      if (query.startDate) filters.startDate = new Date(query.startDate);
      if (query.endDate) filters.endDate = new Date(query.endDate);
      if (query.type) filters.type = query.type;
      if (query.status) filters.status = query.status;

      const stats = await AppointmentService.getAppointmentStats(filters);

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching appointment stats');
      throw error;
    }
  });

  /**
   * GET /admin/appointments/:id
   * Get a single appointment by ID
   */
  fastify.get('/admin/appointments/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const appointment = await AppointmentService.getAppointmentById(id);

      if (!appointment) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Appointment not found',
        });
      }

      return reply.status(200).send({
        success: true,
        data: appointment,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching appointment');
      throw error;
    }
  });

  /**
   * POST /admin/appointments/:id/reschedule
   * Reschedule an appointment
   */
  fastify.post('/admin/appointments/:id/reschedule', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const payload = rescheduleSchema.parse(request.body);

      const appointment = await AppointmentService.rescheduleAppointment(id, new Date(payload.newScheduledAt));

      return reply.status(200).send({
        success: true,
        data: appointment,
        message: 'Appointment rescheduled successfully',
      });
    } catch (error) {
      request.log.error(error, 'Error rescheduling appointment');
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          details: error.issues,
        });
      }
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
   * POST /admin/appointments/:id/complete
   * Mark appointment as completed
   */
  fastify.post('/admin/appointments/:id/complete', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const payload = completeSchema.parse(request.body);

      const appointment = await AppointmentService.completeAppointment(id, {
        outcome: payload.outcome as AppointmentOutcome,
        callSummary: payload.callSummary,
      });

      return reply.status(200).send({
        success: true,
        data: appointment,
        message: 'Appointment marked as completed',
      });
    } catch (error) {
      request.log.error(error, 'Error completing appointment');
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          details: error.issues,
        });
      }
      throw error;
    }
  });

  /**
   * POST /admin/appointments/:id/no-show
   * Mark appointment as no-show
   */
  fastify.post('/admin/appointments/:id/no-show', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const payload = noShowSchema.parse(request.body);

      const appointment = await AppointmentService.markNoShow(id, payload);

      return reply.status(200).send({
        success: true,
        data: appointment,
        message: 'Appointment marked as no-show',
      });
    } catch (error) {
      request.log.error(error, 'Error marking appointment as no-show');
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          details: error.issues,
        });
      }
      throw error;
    }
  });

  /**
   * POST /admin/appointments/:id/cancel
   * Cancel an appointment
   */
  fastify.post('/admin/appointments/:id/cancel', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const payload = cancelSchema.parse(request.body);

      const appointment = await AppointmentService.cancelAppointment(id, payload.reason);

      return reply.status(200).send({
        success: true,
        data: appointment,
        message: 'Appointment cancelled successfully',
      });
    } catch (error) {
      request.log.error(error, 'Error cancelling appointment');
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          details: error.issues,
        });
      }
      throw error;
    }
  });

  /**
   * POST /admin/appointments/blocked-times
   * Create a blocked time entry
   */
  fastify.post('/admin/appointments/blocked-times', async (request, reply) => {
    try {
      const payload = blockedTimeSchema.parse(request.body);

      await AppointmentService.createBlockedTime({
        startAt: new Date(payload.startAt),
        endAt: new Date(payload.endAt),
        reason: payload.reason,
      });

      return reply.status(201).send({
        success: true,
        message: 'Blocked time created successfully',
      });
    } catch (error) {
      request.log.error(error, 'Error creating blocked time');
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          details: error.issues,
        });
      }
      throw error;
    }
  });

  /**
   * GET /admin/appointments/blocked-times
   * Get blocked times for a date range
   */
  fastify.get('/admin/appointments/blocked-times', async (request, reply) => {
    try {
      const query = request.query as any;

      if (!query.startAt || !query.endAt) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'startAt and endAt query parameters are required',
        });
      }

      const blockedTimes = await AppointmentService.getBlockedTimes(
        new Date(query.startAt),
        new Date(query.endAt)
      );

      return reply.status(200).send({
        success: true,
        data: blockedTimes,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching blocked times');
      throw error;
    }
  });

  /**
   * DELETE /admin/appointments/blocked-times/:id
   * Delete a blocked time entry
   */
  fastify.delete('/admin/appointments/blocked-times/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      await AppointmentService.deleteBlockedTime(id);

      return reply.status(200).send({
        success: true,
        message: 'Blocked time deleted successfully',
      });
    } catch (error) {
      request.log.error(error, 'Error deleting blocked time');
      throw error;
    }
  });

  /**
   * GET /admin/appointments/settings
   * Get appointment settings
   */
  fastify.get('/admin/appointments/settings', async (request, reply) => {
    try {
      const settings = await AppointmentService.getSettings();

      return reply.status(200).send({
        success: true,
        data: settings,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching appointment settings');
      throw error;
    }
  });

  /**
   * PATCH /admin/appointments/settings
   * Update appointment settings
   */
  fastify.patch('/admin/appointments/settings', async (request, reply) => {
    try {
      const payload = updateSettingsSchema.parse(request.body);

      const settings = await AppointmentService.updateSettings(payload);

      return reply.status(200).send({
        success: true,
        data: settings,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      request.log.error(error, 'Error updating appointment settings');
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          details: error.issues,
        });
      }
      throw error;
    }
  });

  /**
   * GET /admin/appointments/export
   * Export appointments as CSV
   */
  fastify.get('/admin/appointments/export', async (request, reply) => {
    try {
      const query = request.query as any;

      const filters: any = {};
      if (query.startDate) filters.startDate = new Date(query.startDate);
      if (query.endDate) filters.endDate = new Date(query.endDate);
      if (query.type) filters.type = query.type;
      if (query.status) filters.status = query.status;

      // Get all appointments matching filters
      const appointments = await prisma.appointment.findMany({
        where: {
          ...(filters.type && { type: filters.type }),
          ...(filters.status && { status: filters.status }),
          ...(filters.startDate || filters.endDate) && {
            scheduledAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          },
        },
        include: { client: true },
        orderBy: { scheduledAt: 'asc' },
      });

      // Convert to CSV format
      const headers = [
        'Date & Time',
        'Client Name',
        'Client Email',
        'Appointment Type',
        'Status',
        'Outcome',
        'Duration (minutes)',
        'Notes',
        'Created At',
        'Completed At',
      ];

      const rows = appointments.map((apt) => [
        apt.scheduledAt ? new Date(apt.scheduledAt).toISOString() : '',
        apt.client?.name || '',
        apt.client?.email || '',
        apt.type,
        apt.status,
        apt.outcome || '',
        apt.duration,
        `"${(apt.adminNotes || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
        new Date(apt.createdAt).toISOString(),
        new Date(apt.updatedAt).toISOString(),
      ]);

      // Create CSV content
      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      // Set response headers
      const filename = `appointments-export-${new Date().toISOString().split('T')[0]}.csv`;
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);

      return reply.send(csv);
    } catch (error) {
      request.log.error(error, 'Error exporting appointments');
      throw error;
    }
  });
}
