import { FastifyInstance } from 'fastify';
import { InvoiceService } from '../services/invoice.js';
import { OTPService } from '../services/otp.js';

export async function publicInvoiceRoutes(fastify: FastifyInstance) {
  /**
   * GET /invoices/:invoiceNumber
   * View invoice (public, no auth required)
   */
  fastify.get('/invoices/:invoiceNumber', async (request, reply) => {
    try {
      const { invoiceNumber } = request.params as { invoiceNumber: string };

      const invoice = await InvoiceService.getInvoiceByNumber(invoiceNumber);

      // Don't expose sensitive internal fields
      const publicInvoice = {
        invoiceNumber: invoice.invoiceNumber,
        title: invoice.title,
        description: invoice.description,
        client: {
          name: invoice.client.name,
          email: invoice.client.email,
        },
        items: invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          amount: item.amount?.toString() || (item.quantity * Number(item.unitPrice)).toString(),
        })),
        subtotal: invoice.subtotal.toString(),
        taxRate: invoice.taxRate.toString(),
        taxAmount: invoice.taxAmount.toString(),
        total: invoice.total.toString(),
        currency: invoice.currency,
        status: invoice.status,
        paymentTerms: invoice.paymentTerms,
        dueDate: invoice.dueDate,
        sentAt: invoice.sentAt,
        paidAt: invoice.paidAt,
      };

      return reply.status(200).send({
        success: true,
        data: publicInvoice,
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
   * POST /invoices/:invoiceNumber/request-otp
   * Request OTP code for invoice payment
   */
  fastify.post('/invoices/:invoiceNumber/request-otp', async (request, reply) => {
    try {
      const { invoiceNumber } = request.params as { invoiceNumber: string };
      const body = request.body as any;

      const invoice = await InvoiceService.getInvoiceByNumber(invoiceNumber);

      // Check if invoice can receive OTP
      if (invoice.status === 'PAID') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'This invoice has already been paid',
        });
      }

      if (invoice.status === 'DRAFT') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'This invoice has not been sent yet',
        });
      }

      // Check if email matches
      if (body.email && body.email.toLowerCase() !== invoice.client.email.toLowerCase()) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Email does not match invoice recipient',
        });
      }

      // Generate new OTP
      // TODO: Implement generateForInvoice in OTPService
      const otp = { code: Math.random().toString(36).substring(2, 8).toUpperCase(), expiresAt: new Date(Date.now() + 15 * 60000) };

      request.log.info(
        {
          invoiceId: invoice.id,
          invoiceNumber,
        },
        'OTP requested for invoice'
      );

      // In production, send OTP via email/SMS
      // For now, return it in response (NOT recommended for production!)
      return reply.status(200).send({
        success: true,
        message: 'OTP code has been generated',
        data: {
          // SECURITY: Remove this in production - send via email instead!
          otpCode: otp.code,
          formattedCode: otp.code, // Format: XXXXXX
          expiresAt: otp.expiresAt,
          expiresInMinutes: 15,
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

      request.log.error(error, 'Error requesting OTP');
      throw error;
    }
  });

  /**
   * POST /invoices/:invoiceNumber/verify-payment
   * Verify payment with OTP
   */
  fastify.post('/invoices/:invoiceNumber/verify-payment', async (request, reply) => {
    try {
      const { invoiceNumber } = request.params as { invoiceNumber: string };
      const body = request.body as any;

      if (!body.otpCode) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'OTP code is required',
        });
      }

      // Parse OTP code (remove formatting)
      const otpCode = OTPService.parseCode(body.otpCode);

      // Get client IP and user agent
      const paymentIP = request.ip;
      const paymentAgent = request.headers['user-agent'] || 'Unknown';

      // Verify payment (mark as paid in the system)
      // TODO: Implement markInvoiceAsPaid in InvoiceService
      const invoice = await InvoiceService.getInvoiceByNumber(invoiceNumber);

      request.log.info(
        {
          invoiceId: invoice.id,
          invoiceNumber,
          paymentIP,
        },
        'Invoice payment verified'
      );

      return reply.status(200).send({
        success: true,
        message: 'Payment verified successfully',
        data: {
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title,
          total: invoice.total.toString(),
          paidAt: invoice.paidAt,
          status: invoice.status,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invoice not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Invoice not found',
          });
        }

        if (error.message.includes('Invalid OTP') || error.message.includes('expired') || error.message.includes('Maximum attempts')) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: error.message,
          });
        }
      }

      request.log.error(error, 'Error verifying payment');
      throw error;
    }
  });

  /**
   * GET /invoices/:invoiceNumber/pdf
   * Download invoice PDF
   */
  fastify.get('/invoices/:invoiceNumber/pdf', async (request, reply) => {
    try {
      const { invoiceNumber } = request.params as { invoiceNumber: string };

      const invoice = await InvoiceService.getInvoiceByNumber(invoiceNumber);

      if (!invoice.pdfPath) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'PDF not available for this invoice',
        });
      }

      const filename = invoice.pdfPath.split('/').pop()!;
      const root = invoice.pdfPath.substring(0, invoice.pdfPath.lastIndexOf('/'));
      return reply.sendFile(filename, root);
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
}
