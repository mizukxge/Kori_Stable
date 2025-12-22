import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AppointmentService } from '../services/appointments.js';
import { AvailabilityService } from '../services/appointmentsAvailability.js';
import { getMeetingProvider } from '../providers/MeetingProvider.js';

const prisma = new PrismaClient();

// Validation schemas
const bookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  notes: z.string().optional(),
  recordingConsentGiven: z.boolean().default(false),
});

/**
 * Public appointment booking routes
 * No authentication required, but rate-limited
 */
export async function publicAppointmentsRoutes(fastify: FastifyInstance) {
  /**
   * GET /book/:token
   * Validate invite token and return available dates and times
   */
  fastify.get('/book/:token', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      // Validate token exists and is not expired
      const appointment = await prisma.appointment.findUnique({
        where: { inviteToken: token },
        include: { client: true },
      });

      if (!appointment) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invalid appointment link',
        });
      }

      // Check if token has expired
      if (appointment.inviteTokenExpiresAt && appointment.inviteTokenExpiresAt < new Date()) {
        return reply.status(410).send({
          statusCode: 410,
          error: 'Gone',
          message: 'Appointment invitation has expired. Please contact the studio to schedule.',
        });
      }

      // Check if token has already been used
      if (appointment.inviteTokenUsedAt) {
        return reply.status(410).send({
          statusCode: 410,
          error: 'Gone',
          message: 'This invitation has already been used. Your appointment is scheduled.',
          data: {
            appointmentId: appointment.id,
            scheduledAt: appointment.scheduledAt,
            teamsLink: appointment.teamsLink,
          },
        });
      }

      // Get available dates
      const availableDates = AvailabilityService.getAvailableDates();

      // Get available times for first available date
      const firstAvailableDate = availableDates[0];
      const availableTimes = await AvailabilityService.getAvailableTimesForDate(
        firstAvailableDate
      );

      return reply.status(200).send({
        success: true,
        data: {
          appointmentId: appointment.id,
          type: appointment.type,
          clientName: appointment.client.name,
          status: appointment.status,
          expiresAt: appointment.inviteTokenExpiresAt,
          availableDates: availableDates.map((d) => d.toISOString().split('T')[0]),
          availableTimes: availableTimes
            .filter((t) => t.available)
            .map((t) => ({
              startTime: t.startTime,
              startDate: t.startDate.toISOString(),
              endDate: t.endDate.toISOString(),
            })),
        },
      });
    } catch (error) {
      request.log.error(error, 'Error fetching booking info');
      throw error;
    }
  });

  /**
   * POST /book/:token
   * Book an appointment from invite token
   */
  fastify.post('/book/:token', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const payload = bookingSchema.parse(request.body);

      // Get query parameter for scheduled date/time
      const query = request.query as any;
      if (!query.startTime) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'startTime query parameter is required (ISO 8601 format)',
        });
      }

      const proposedStartTime = new Date(query.startTime);

      // Validate token and appointment
      const appointment = await prisma.appointment.findUnique({
        where: { inviteToken: token },
        include: { client: true },
      });

      if (!appointment) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invalid appointment link',
        });
      }

      // Check if token has expired
      if (appointment.inviteTokenExpiresAt && appointment.inviteTokenExpiresAt < new Date()) {
        return reply.status(410).send({
          statusCode: 410,
          error: 'Gone',
          message: 'Appointment invitation has expired',
        });
      }

      // Check if token has already been used
      if (appointment.inviteTokenUsedAt) {
        return reply.status(410).send({
          statusCode: 410,
          error: 'Gone',
          message: 'This invitation has already been used',
        });
      }

      // Validate proposed time
      const timeValidation = await AvailabilityService.validateProposedTime(proposedStartTime);
      if (!timeValidation.valid) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: timeValidation.reason || 'Invalid appointment time',
        });
      }

      // Create Teams meeting
      const meetingProvider = getMeetingProvider();
      const endTime = new Date(proposedStartTime);
      endTime.setUTCMinutes(endTime.getUTCMinutes() + 60);

      let teamsLink: string | null = null;
      try {
        const meeting = await meetingProvider.createMeeting({
          subject: `Mizu Studio - ${appointment.type} Call with ${payload.name}`,
          startTime: proposedStartTime,
          duration: 60,
          attendees: [
            { name: 'Mizu Studio', email: 'studio@shotbymizu.co.uk' },
            { name: payload.name, email: payload.email },
          ],
          description: `Appointment Type: ${appointment.type}\n\nClient Notes: ${payload.notes || 'None'}`,
        });
        teamsLink = meeting.joinUrl;
      } catch (error) {
        request.log.error(error, 'Failed to create Teams meeting');
        // Continue booking even if Teams meeting fails (log warning)
      }

      // Book the appointment
      const bookedAppointment = await AppointmentService.bookAppointmentFromInvite(
        token,
        proposedStartTime,
        {
          name: payload.name,
          email: payload.email,
          notes: payload.notes,
          recordingConsentGiven: payload.recordingConsentGiven,
        }
      );

      // Update with Teams link if created
      if (teamsLink) {
        await prisma.appointment.update({
          where: { id: bookedAppointment.id },
          data: { teamsLink },
        });
      }

      // TODO: Send confirmation email to client and admin

      return reply.status(201).send({
        success: true,
        data: {
          id: bookedAppointment.id,
          status: 'Booked',
          scheduledAt: proposedStartTime.toISOString(),
          teamsLink,
          message: 'Your appointment has been confirmed! Check your email for details and the Teams meeting link.',
        },
      });
    } catch (error) {
      request.log.error(error, 'Error booking appointment');

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
   * GET /book/:token/available-times
   * Get available times for a specific date
   */
  fastify.get('/book/:token/available-times', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };
      const query = request.query as any;

      if (!query.date) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'date query parameter is required (YYYY-MM-DD format)',
        });
      }

      // Parse date
      const [year, month, day] = query.date.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));

      // Validate token
      const appointment = await prisma.appointment.findUnique({
        where: { inviteToken: token },
      });

      if (!appointment) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invalid appointment link',
        });
      }

      if (appointment.inviteTokenExpiresAt && appointment.inviteTokenExpiresAt < new Date()) {
        return reply.status(410).send({
          statusCode: 410,
          error: 'Gone',
          message: 'Appointment invitation has expired',
        });
      }

      if (appointment.inviteTokenUsedAt) {
        return reply.status(410).send({
          statusCode: 410,
          error: 'Gone',
          message: 'This invitation has already been used',
        });
      }

      // Get available times
      const allTimes = await AvailabilityService.getAvailableTimesForDate(dateObj);
      const availableTimes = allTimes
        .filter((t) => t.available)
        .map((t) => ({
          startTime: t.startTime,
          startDate: t.startDate.toISOString(),
          endDate: t.endDate.toISOString(),
        }));

      return reply.status(200).send({
        success: true,
        data: {
          date: query.date,
          availableTimes,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error fetching available times');
      throw error;
    }
  });
}
