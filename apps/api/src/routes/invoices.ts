import { FastifyInstance } from 'fastify';
import { InvoiceService } from '../services/invoice.js';
import { requireAdmin } from '../middleware/auth.js';
import { notifyPaymentReceived } from '../services/notify.js';

export async function invoicesRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/invoices/stats
   * Get invoice statistics
   */
  fastify.get('/admin/invoices/stats', async (request, reply) => {
    try {
      const stats = await InvoiceService.getInvoiceStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching invoice stats');
      throw error;
    }
  });

  /**
   * GET /admin/invoices
   * List all invoices
   */
  fastify.get('/admin/invoices', async (request, reply) => {
    try {
      const query = request.query as any;

      const invoices = await InvoiceService.listInvoices({
        clientId: query.clientId,
        status: query.status,
      });

      return reply.status(200).send({
        success: true,
        data: invoices,
      });
    } catch (error) {
      request.log.error(error, 'Error listing invoices');
      throw error;
    }
  });

  /**
   * GET /admin/invoices/:id
   * Get a single invoice by ID
   */
  fastify.get('/admin/invoices/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const invoice = await InvoiceService.getInvoiceById(id);

      return reply.status(200).send({
        success: true,
        data: invoice,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invoice not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      request.log.error(error, 'Error fetching invoice');
      throw error;
    }
  });

  /**
   * POST /admin/invoices
   * Create a new invoice
   */
  fastify.post('/admin/invoices', async (request, reply) => {
    try {
      const data = request.body as any;

      // Validate required fields
      if (!data.title) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'title is required',
        });
      }

      if (!data.clientId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'clientId is required',
        });
      }

      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'items array is required and must not be empty',
        });
      }

      const invoice = await InvoiceService.createInvoice(
        data,
        request.user!.userId
      );

      request.log.info(
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          userId: request.user!.userId,
        },
        'Invoice created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Invoice created successfully',
        data: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title,
          total: invoice.total.toString(),
          status: invoice.status,
          createdAt: invoice.createdAt,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error creating invoice');
      throw error;
    }
  });

  /**
   * PUT /admin/invoices/:id
   * Update an invoice (only if DRAFT)
   */
  fastify.put('/admin/invoices/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const invoice = await InvoiceService.updateInvoice(
        id,
        data,
        request.user!.userId
      );

      request.log.info(
        {
          invoiceId: id,
          userId: request.user!.userId,
        },
        'Invoice updated'
      );

      return reply.status(200).send({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invoice not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      request.log.error(error, 'Error updating invoice');
      throw error;
    }
  });

  /**
   * POST /admin/invoices/:id/send
   * Send invoice to client
   */
  fastify.post('/admin/invoices/:id/send', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const invoice = await InvoiceService.sendInvoice(id, request.user!.userId);

      request.log.info(
        {
          invoiceId: id,
          invoiceNumber: invoice.invoiceNumber,
          userId: request.user!.userId,
        },
        'Invoice sent'
      );

      return reply.status(200).send({
        success: true,
        message: 'Invoice sent successfully',
        data: {
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          sentAt: invoice.sentAt,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invoice not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      if (error instanceof Error && error.message === 'Only draft invoices can be sent') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error sending invoice');
      throw error;
    }
  });

  /**
   * POST /admin/invoices/:id/mark-paid
   * Mark invoice as paid
   */
  fastify.post('/admin/invoices/:id/mark-paid', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const invoice = await InvoiceService.markPaid(id, request.user!.userId);

      request.log.info(
        {
          invoiceId: id,
          userId: request.user!.userId,
        },
        'Invoice marked as paid'
      );

      // Send notification about payment received
      try {
        await notifyPaymentReceived(
          id,
          invoice.invoiceNumber,
          invoice.total.toString()
        );
      } catch (notifyError) {
        request.log.warn('Failed to send payment received notification:', notifyError);
        // Don't fail the request if notification fails
      }

      return reply.status(200).send({
        success: true,
        message: 'Invoice marked as paid',
        data: {
          status: invoice.status,
          paidAt: invoice.paidAt,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invoice not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      request.log.error(error, 'Error marking invoice as paid');
      throw error;
    }
  });

  /**
   * POST /admin/invoices/:id/generate-pdf
   * Generate PDF for invoice
   */
  fastify.post('/admin/invoices/:id/generate-pdf', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const pdfPath = await InvoiceService.generatePDF(id);

      request.log.info(
        {
          invoiceId: id,
          userId: request.user!.userId,
        },
        'Invoice PDF generated'
      );

      return reply.status(200).send({
        success: true,
        message: 'PDF generated successfully',
        data: {
          pdfPath,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invoice not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      request.log.error(error, 'Error generating PDF');
      throw error;
    }
  });

  /**
   * GET /admin/invoices/:id/pdf
   * Download invoice PDF
   */
  fastify.get('/admin/invoices/:id/pdf', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const invoice = await InvoiceService.getInvoiceById(id);

      if (!invoice.pdfPath) {
        // Generate PDF if not exists
        await InvoiceService.generatePDF(id);
        const updated = await InvoiceService.getInvoiceById(id);

        if (!updated.pdfPath) {
          throw new Error('Failed to generate PDF');
        }

        return reply.download(updated.pdfPath);
      }

      return reply.download(invoice.pdfPath);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invoice not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      request.log.error(error, 'Error downloading PDF');
      throw error;
    }
  });

  /**
   * DELETE /admin/invoices/:id
   * Delete an invoice
   */
  fastify.delete('/admin/invoices/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const invoice = await InvoiceService.deleteInvoice(id, request.user!.userId);

      request.log.info(
        {
          invoiceId: id,
          userId: request.user!.userId,
        },
        'Invoice deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Invoice deleted successfully',
        data: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invoice not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      request.log.error(error, 'Error deleting invoice');
      throw error;
    }
  });
}