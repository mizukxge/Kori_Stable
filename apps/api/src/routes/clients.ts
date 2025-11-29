import { FastifyInstance } from 'fastify';
import { ClientService } from '../services/clients.js';
import { clientSignupOtpService } from '../services/clientSignupOtp.js';
import { clientEmailService } from '../services/clientEmailService.js';
import { requireAdmin } from '../middleware/auth.js';
import { notifyNewClient } from '../services/notify.js';
import {
  CreateClientSchema,
  UpdateClientSchema,
  UpdateStatusSchema,
  ListClientsQuerySchema,
  ClientIdSchema,
  CreateClientInput,
  UpdateClientInput,
  UpdateStatusInput,
  ListClientsQuery,
  ClientIdParam,
  EmailOtpRequestSchema,
  EmailOtpRequestInput,
  PublicClientSignupSchema,
  PublicClientSignupInput,
} from '../schemas/client.js';

/**
 * Public client signup routes (no auth required)
 */
export async function clientRoutes(fastify: FastifyInstance) {
  /**
   * POST /clients/request-otp
   * Initial email-only OTP request (Step 0 of signup)
   * Creates a temporary PENDING client to store email and send OTP
   */
  fastify.post<{ Body: EmailOtpRequestInput }>(
    '/clients/request-otp',
    async (request, reply) => {
      try {
        // Validate request body
        let data;
        try {
          data = EmailOtpRequestSchema.parse(request.body);
        } catch (validationError: any) {
          const errorMessages = validationError.issues
            ? validationError.issues
                .map((issue: any) => `${issue.path.join('.')}: ${issue.message}`)
                .join('; ')
            : validationError.message;

          return reply.status(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: errorMessages,
          });
        }

        // Create client with PENDING status (minimal info for OTP)
        const client = await ClientService.createClient(
          {
            name: 'Pending', // Temporary name
            email: data.email.trim(),
            phone: '+44 0000 000000', // Temporary phone
            status: 'PENDING',
            source: 'website',
          },
          'public' // System user for public signups
        );

        // Generate and send OTP for email verification
        const { code: otpCode, expiresAt } = await clientSignupOtpService.generateAndSendOtp(client.id);

        // Send OTP email
        try {
          await clientEmailService.sendSignupOtp({
            clientEmail: client.email,
            clientName: client.name,
            otpCode,
            expiresAt,
          });
        } catch (emailError) {
          request.log.error(emailError, 'Failed to send signup OTP email');
          // Don't fail the request if email fails in development
          if (process.env.NODE_ENV === 'production') {
            throw emailError;
          }
        }

        request.log.info(
          {
            clientId: client.id,
            email: client.email,
            source: 'public_signup',
          },
          'OTP requested for email verification'
        );

        return reply.status(201).send({
          success: true,
          message: 'OTP sent to your email. Please check your inbox.',
          clientId: client.id,
          email: client.email,
        });
      } catch (error) {
        request.log.error(error, 'Error requesting OTP');
        if (
          error instanceof Error &&
          error.message === 'A client with this email already exists'
        ) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: 'A client account with this email already exists. Please use a different email or contact us.',
          });
        }

        if (error instanceof Error && error.message.includes('validation')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  /**
   * POST /clients/create
   * Public client signup completion endpoint (no auth required)
   * Updates existing PENDING client with full details after OTP verification
   */
  fastify.post<{ Body: PublicClientSignupInput }>(
    '/clients/create',
    async (request, reply) => {
      try {
        // Validate request body
        let data;
        try {
          data = PublicClientSignupSchema.parse(request.body);
        } catch (validationError: any) {
          const errorMessages = validationError.issues
            ? validationError.issues
                .map((issue: any) => `${issue.path.join('.')}: ${issue.message}`)
                .join('; ')
            : validationError.message;

          return reply.status(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: errorMessages,
          });
        }

        // Find existing client by email (created during OTP request)
        let existingClient;
        try {
          existingClient = await ClientService.getClientByEmail(data.email);
        } catch {
          existingClient = null;
        }

        let client;
        if (existingClient && existingClient.status === 'PENDING') {
          // Update existing PENDING client with full details
          client = await ClientService.updateClient(
            existingClient.id,
            {
              name: data.name,
              phone: data.phone,
              company: data.company,
              address: data.address,
              city: data.city,
              state: data.state,
              zipCode: data.zipCode,
              country: data.country,
              source: data.source || 'website',
              preferredContactMethod: data.preferredContactMethod,
              // Don't update status here - keep as PENDING until admin approval
            },
            'public' // System user for public signups
          );
        } else {
          // Fallback: Create new client if no PENDING one exists
          client = await ClientService.createClient(
            {
              ...data,
              status: 'PENDING',
              source: data.source || 'website',
            },
            'public' // System user for public signups
          );
        }

        request.log.info(
          {
            clientId: client.id,
            email: client.email,
            source: 'public_signup',
          },
          'Public client signup completed'
        );

        // Send notification to all admins about new client signup
        try {
          await notifyNewClient(
            client.id,
            client.name,
            client.email
          );
        } catch (notifyError) {
          request.log.warn('Failed to send new client notification:', notifyError);
          // Don't fail the request if notification fails
        }

        return reply.status(201).send({
          success: true,
          message: 'Thank you! Your signup is complete. We will review your information and contact you shortly.',
          clientId: client.id,
          status: client.status,
        });
      } catch (error) {
        request.log.error(error, 'Error completing client signup');
        if (
          error instanceof Error &&
          error.message === 'A client with this email already exists'
        ) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: 'A client account with this email already exists. Please use a different email or contact us.',
          });
        }

        if (error instanceof Error && error.message.includes('validation')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  /**
   * POST /clients/:id/verify-otp
   * Verify OTP code for client signup
   */
  fastify.post<{ Params: { id: string }; Body: { otpCode: string } }>(
    '/clients/:id/verify-otp',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { otpCode } = request.body;

        if (!otpCode || typeof otpCode !== 'string' || otpCode.length !== 6) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'OTP code must be a 6-digit string',
          });
        }

        // Verify OTP
        await clientSignupOtpService.verifyOtp(id, otpCode);

        // Create session after successful verification
        const { sessionId, expiresAt } = await clientSignupOtpService.createSession(id);

        request.log.info(
          { clientId: id, source: 'public_signup' },
          'Client OTP verified successfully'
        );

        return reply.status(200).send({
          success: true,
          message: 'Email verified successfully!',
          sessionId,
          expiresAt,
        });
      } catch (error) {
        request.log.error(error, 'Error verifying OTP');

        if (error instanceof Error) {
          if (error.message.includes('Too many failed attempts')) {
            return reply.status(429).send({
              statusCode: 429,
              error: 'Too Many Attempts',
              message: error.message,
            });
          }

          if (error.message.includes('Invalid OTP') || error.message.includes('expired')) {
            return reply.status(400).send({
              statusCode: 400,
              error: 'Invalid OTP',
              message: error.message,
            });
          }

          if (error.message === 'Client not found') {
            return reply.status(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'Client not found',
            });
          }
        }

        throw error;
      }
    }
  );

  /**
   * POST /clients/:id/resend-otp
   * Resend OTP code to client email
   */
  fastify.post<{ Params: { id: string } }>(
    '/clients/:id/resend-otp',
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Get client
        const client = await ClientService.getClient(id);

        // Generate new OTP
        const { code: otpCode, expiresAt } = await clientSignupOtpService.generateAndSendOtp(id);

        // Send OTP email
        try {
          await clientEmailService.sendSignupOtp({
            clientEmail: client.email,
            clientName: client.name,
            otpCode,
            expiresAt,
          });
        } catch (emailError) {
          request.log.error(emailError, 'Failed to resend OTP email');
          if (process.env.NODE_ENV === 'production') {
            throw emailError;
          }
        }

        request.log.info(
          { clientId: id },
          'OTP resent successfully'
        );

        return reply.status(200).send({
          success: true,
          message: 'Verification code resent to your email',
        });
      } catch (error) {
        request.log.error(error, 'Error resending OTP');

        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        throw error;
      }
    }
  );
}

/**
 * Admin client management routes (auth required)
 */
export async function adminClientRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/clients/stats
   * Get client statistics
   */
  fastify.get('/admin/clients/stats', async (request, reply) => {
    try {
      const stats = await ClientService.getClientStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching client stats');
      throw error;
    }
  });

  /**
   * GET /admin/clients
   * List all clients with pagination and filters
   */
  fastify.get<{ Querystring: ListClientsQuery }>(
    '/admin/clients',
    async (request, reply) => {
      try {
        // Validate query parameters
        const query = ListClientsQuerySchema.parse(request.query);

        const { page, limit, sortBy, sortOrder, status, search, tags } = query;

        const result = await ClientService.listClients(
          { status, search, tags },
          { page, limit, sortBy, sortOrder }
        );

        return reply.status(200).send({
          success: true,
          data: result.data,
          pagination: result.pagination,
        });
      } catch (error) {
        request.log.error(error, 'Error listing clients');
        throw error;
      }
    }
  );

  /**
   * GET /admin/clients/:id
   * Get a single client by ID
   */
  fastify.get<{ Params: ClientIdParam }>(
    '/admin/clients/:id',
    async (request, reply) => {
      try {
        const { id } = ClientIdSchema.parse(request.params);

        const client = await ClientService.getClient(id);

        return reply.status(200).send({
          success: true,
          data: client,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        request.log.error(error, 'Error fetching client');
        throw error;
      }
    }
  );

  /**
   * POST /admin/clients
   * Create a new client
   */
  fastify.post<{ Body: CreateClientInput }>(
    '/admin/clients',
    async (request, reply) => {
      try {
        // Validate request body
        const data = CreateClientSchema.parse(request.body);

        const client = await ClientService.createClient(
          data,
          request.user!.userId
        );

        request.log.info(
          {
            clientId: client.id,
            userId: request.user!.userId,
          },
          'Client created'
        );

        return reply.status(201).send({
          success: true,
          message: 'Client created successfully',
          data: client,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'A client with this email already exists'
        ) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: error.message,
          });
        }

        request.log.error(error, 'Error creating client');
        throw error;
      }
    }
  );

  /**
   * PUT /admin/clients/:id
   * Update a client
   */
  fastify.put<{ Params: ClientIdParam; Body: UpdateClientInput }>(
    '/admin/clients/:id',
    async (request, reply) => {
      try {
        const { id } = ClientIdSchema.parse(request.params);
        const data = UpdateClientSchema.parse(request.body);

        const client = await ClientService.updateClient(
          id,
          data,
          request.user!.userId
        );

        request.log.info(
          {
            clientId: id,
            userId: request.user!.userId,
          },
          'Client updated'
        );

        return reply.status(200).send({
          success: true,
          message: 'Client updated successfully',
          data: client,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        if (
          error instanceof Error &&
          error.message === 'A client with this email already exists'
        ) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: error.message,
          });
        }

        request.log.error(error, 'Error updating client');
        throw error;
      }
    }
  );

  /**
   * PATCH /admin/clients/:id/status
   * Update client status
   */
  fastify.patch<{ Params: ClientIdParam; Body: UpdateStatusInput }>(
    '/admin/clients/:id/status',
    async (request, reply) => {
      try {
        const { id } = ClientIdSchema.parse(request.params);
        const { status } = UpdateStatusSchema.parse(request.body);

        const client = await ClientService.updateClientStatus(
          id,
          status,
          request.user!.userId
        );

        request.log.info(
          {
            clientId: id,
            status,
            userId: request.user!.userId,
          },
          'Client status updated'
        );

        return reply.status(200).send({
          success: true,
          message: 'Client status updated successfully',
          data: client,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        request.log.error(error, 'Error updating client status');
        throw error;
      }
    }
  );

  /**
   * DELETE /admin/clients/:id
   * Delete (archive) a client
   */
  fastify.delete<{ Params: ClientIdParam }>(
    '/admin/clients/:id',
    async (request, reply) => {
      try {
        const { id } = ClientIdSchema.parse(request.params);

        const client = await ClientService.deleteClient(id, request.user!.userId);

        request.log.info(
          {
            clientId: id,
            userId: request.user!.userId,
          },
          'Client archived'
        );

        return reply.status(200).send({
          success: true,
          message: 'Client archived successfully',
          data: client,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        request.log.error(error, 'Error deleting client');
        throw error;
      }
    }
  );

  /**
   * DELETE /admin/clients/:id/permanent
   * Permanently delete a client (hard delete - only for archived clients)
   */
  fastify.delete<{ Params: ClientIdParam }>(
    '/admin/clients/:id/permanent',
    async (request, reply) => {
      try {
        const { id } = ClientIdSchema.parse(request.params);

        const client = await ClientService.permanentlyDeleteClient(id, request.user!.userId);

        request.log.info(
          {
            clientId: id,
            userId: request.user!.userId,
          },
          'Client permanently deleted'
        );

        return reply.status(200).send({
          success: true,
          message: 'Client permanently deleted successfully',
          data: client,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        if (error instanceof Error && error.message.includes('only archived')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        request.log.error(error, 'Error permanently deleting client');
        throw error;
      }
    }
  );
}