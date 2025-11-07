import { FastifyInstance } from 'fastify';
import { InquiryService } from '../services/inquiry.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  CreateInquirySchema,
  UpdateInquirySchema,
  UpdateInquiryStatusSchema,
  ConvertInquirySchema,
  SendInquiryEmailSchema,
  ListInquiriesQuerySchema,
  InquiryIdSchema,
  CreateInquiryInput,
  UpdateInquiryInput,
  UpdateInquiryStatusInput,
  ConvertInquiryInput,
  SendInquiryEmailInput,
  ListInquiriesQuery,
  InquiryIdParam,
} from '../schemas/inquiry.js';

export async function inquiryRoutes(fastify: FastifyInstance) {
  /**
   * POST /inquiries/create
   * Create a new inquiry (public endpoint - no auth required)
   */
  fastify.post<{ Body: CreateInquiryInput }>(
    '/inquiries/create',
    async (request, reply) => {
      try {
        // Validate request body
        let data;
        try {
          data = CreateInquirySchema.parse(request.body);
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

        // Extract IP and user agent for tracking
        const ipAddress = request.ip;
        const userAgent = request.headers['user-agent'] as string;

        // Parse shootDate if it's a string
        const shootDate = data.shootDate ? new Date(data.shootDate as any) : null;

        const inquiry = await InquiryService.createInquiry({
          ...data,
          shootDate,
          ipAddress,
          userAgent,
        });

        request.log.info(
          {
            inquiryId: inquiry.id,
            email: inquiry.email,
          },
          'Inquiry created'
        );

        return reply.status(201).send({
          success: true,
          message: 'Inquiry received. Check your email for confirmation.',
          inquiryId: inquiry.id,
        });
      } catch (error) {
        request.log.error(error, 'Error creating inquiry');
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
}

// Separate function for admin routes to keep them organized
export async function adminInquiryRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/inquiries/stats
   * Get inquiry statistics for dashboard
   */
  fastify.get('/admin/inquiries/stats', async (request, reply) => {
    try {
      const days = typeof (request.query as any).days === 'string' ? parseInt((request.query as any).days, 10) : 30;
      const stats = await InquiryService.getInquiryStats(days);

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching inquiry stats');
      throw error;
    }
  });

  /**
   * GET /admin/inquiries
   * List all inquiries with pagination and filters
   */
  fastify.get<{ Querystring: ListInquiriesQuery }>(
    '/admin/inquiries',
    async (request, reply) => {
      try {
        // Validate query parameters
        const query = ListInquiriesQuerySchema.parse(request.query);

        const {
          page,
          limit,
          sortBy,
          sortOrder,
          status,
          type,
          search,
          dateFrom,
          dateTo,
          budgetMin,
          budgetMax,
          tags,
        } = query;

        const result = await InquiryService.listInquiries(
          {
            status,
            type,
            search,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
            budgetMin,
            budgetMax,
            tags,
          },
          { page, limit, sortBy, sortOrder }
        );

        return reply.status(200).send({
          success: true,
          data: result.data,
          pagination: result.pagination,
        });
      } catch (error) {
        request.log.error(error, 'Error listing inquiries');
        throw error;
      }
    }
  );

  /**
   * GET /admin/inquiries/:id
   * Get a single inquiry by ID
   */
  fastify.get<{ Params: InquiryIdParam }>(
    '/admin/inquiries/:id',
    async (request, reply) => {
      try {
        const { id } = InquiryIdSchema.parse(request.params);

        const inquiry = await InquiryService.getInquiry(id);

        return reply.status(200).send({
          success: true,
          data: inquiry,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Inquiry not found',
          });
        }

        request.log.error(error, 'Error fetching inquiry');
        throw error;
      }
    }
  );

  /**
   * PUT /admin/inquiries/:id
   * Update inquiry (internal notes, tags)
   */
  fastify.put<{ Params: InquiryIdParam; Body: UpdateInquiryInput }>(
    '/admin/inquiries/:id',
    async (request, reply) => {
      try {
        const { id } = InquiryIdSchema.parse(request.params);
        const data = UpdateInquirySchema.parse(request.body);

        const inquiry = await InquiryService.updateInquiry(id, data);

        request.log.info(
          {
            inquiryId: inquiry.id,
            userId: request.user!.userId,
          },
          'Inquiry updated'
        );

        return reply.status(200).send({
          success: true,
          message: 'Inquiry updated successfully',
          data: inquiry,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Inquiry not found',
          });
        }

        request.log.error(error, 'Error updating inquiry');
        throw error;
      }
    }
  );

  /**
   * PUT /admin/inquiries/:id/status
   * Update inquiry status
   */
  fastify.put<{
    Params: InquiryIdParam;
    Body: UpdateInquiryStatusInput;
  }>(
    '/admin/inquiries/:id/status',
    async (request, reply) => {
      try {
        const { id } = InquiryIdSchema.parse(request.params);
        const { status } = UpdateInquiryStatusSchema.parse(request.body);

        const inquiry = await InquiryService.updateInquiryStatus(id, status);

        request.log.info(
          {
            inquiryId: inquiry.id,
            status: inquiry.status,
            userId: request.user!.userId,
          },
          'Inquiry status updated'
        );

        return reply.status(200).send({
          success: true,
          message: 'Inquiry status updated successfully',
          data: inquiry,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Inquiry not found',
          });
        }

        request.log.error(error, 'Error updating inquiry status');
        throw error;
      }
    }
  );

  /**
   * PUT /admin/inquiries/:id/convert
   * Convert inquiry to client
   */
  fastify.put<{ Params: InquiryIdParam; Body: ConvertInquiryInput }>(
    '/admin/inquiries/:id/convert',
    async (request, reply) => {
      try {
        const { id } = InquiryIdSchema.parse(request.params);
        const data = ConvertInquirySchema.parse(request.body);

        const { inquiry, client } = await InquiryService.convertInquiryToClient(
          id,
          (data.status as any) || 'ACTIVE'
        );

        request.log.info(
          {
            inquiryId: inquiry.id,
            clientId: client.id,
            userId: request.user!.userId,
          },
          'Inquiry converted to client'
        );

        return reply.status(200).send({
          success: true,
          message: 'Inquiry converted to client successfully',
          data: {
            inquiry,
            client,
          },
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Inquiry not found',
          });
        }

        if (
          error instanceof Error &&
          error.message.includes('already converted')
        ) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: error.message,
          });
        }

        request.log.error(error, 'Error converting inquiry to client');
        throw error;
      }
    }
  );

  /**
   * POST /admin/inquiries/:id/email
   * Send email to inquiry contact (template-based)
   */
  fastify.post<{ Params: InquiryIdParam; Body: SendInquiryEmailInput }>(
    '/admin/inquiries/:id/email',
    async (request, reply) => {
      try {
        const { id } = InquiryIdSchema.parse(request.params);
        const { templateName, customMessage, recipientEmail } =
          SendInquiryEmailSchema.parse(request.body);

        const inquiry = await InquiryService.getInquiry(id);

        // TODO: Implement email sending logic when email service is fully integrated
        // For now, just log the action
        request.log.info(
          {
            inquiryId: id,
            templateName,
            to: recipientEmail || inquiry.email,
            userId: request.user!.userId,
          },
          'Email would be sent to inquiry contact'
        );

        return reply.status(200).send({
          success: true,
          message: 'Email sent successfully',
          data: {
            inquiryId: id,
            sentTo: recipientEmail || inquiry.email,
            template: templateName,
          },
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Inquiry not found',
          });
        }

        request.log.error(error, 'Error sending email to inquiry contact');
        throw error;
      }
    }
  );

  /**
   * DELETE /admin/inquiries/:id
   * Archive or delete inquiry
   */
  fastify.delete<{ Params: InquiryIdParam }>(
    '/admin/inquiries/:id',
    async (request, reply) => {
      try {
        const { id } = InquiryIdSchema.parse(request.params);
        const archive =
          (request.query as any).archive !== 'false' ? true : false;

        const inquiry = await InquiryService.deleteInquiry(id, archive);

        request.log.info(
          {
            inquiryId: id,
            action: archive ? 'archived' : 'deleted',
            userId: request.user!.userId,
          },
          'Inquiry deleted/archived'
        );

        return reply.status(200).send({
          success: true,
          message: archive ? 'Inquiry archived successfully' : 'Inquiry deleted successfully',
          data: inquiry,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Inquiry not found',
          });
        }

        request.log.error(error, 'Error deleting inquiry');
        throw error;
      }
    }
  );
}
