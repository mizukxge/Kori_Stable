import { FastifyInstance } from 'fastify';
import { PaymentService } from '../services/payment.js';
import { requireAdmin } from '../middleware/auth.js';

export async function paymentsRoutes(fastify: FastifyInstance) {
  /**
   * POST /webhooks/stripe
   * Stripe webhook receiver (no auth required)
   */
  fastify.post(
    '/webhooks/stripe',
    {
      config: {
        // Raw body needed for signature verification
        rawBody: true,
      },
    },
    async (request, reply) => {
      try {
        const signature = request.headers['stripe-signature'];

        if (!signature || typeof signature !== 'string') {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Missing stripe-signature header',
          });
        }

        // Get raw body
        const rawBody = (request as any).rawBody || request.body;

        // Verify and parse webhook
        const event = PaymentService.verifyStripeWebhook(
          typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
          signature
        );

        request.log.info(
          {
            eventType: event.type,
            eventId: event.data.object.id,
          },
          'Stripe webhook received'
        );

        // Handle the event
        await PaymentService.handleStripeWebhook(event);

        return reply.status(200).send({
          success: true,
          message: 'Webhook processed',
        });
      } catch (error) {
        request.log.error(error, 'Error processing Stripe webhook');

        if (error instanceof Error && error.message.includes('signature verification')) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid webhook signature',
          });
        }

        // Return 200 to Stripe even on processing errors to avoid retries
        return reply.status(200).send({
          success: false,
          message: 'Webhook received but processing failed',
        });
      }
    }
  );

  // All routes below require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/payments/stats
   * Get payment statistics
   */
  fastify.get('/admin/payments/stats', async (request, reply) => {
    try {
      const stats = await PaymentService.getPaymentStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching payment stats');
      throw error;
    }
  });

  /**
   * GET /admin/payments
   * List all payments
   */
  fastify.get('/admin/payments', async (request, reply) => {
    try {
      const query = request.query as any;

      const payments = await PaymentService.listPayments({
        invoiceId: query.invoiceId,
        status: query.status,
      });

      return reply.status(200).send({
        success: true,
        data: payments,
      });
    } catch (error) {
      request.log.error(error, 'Error listing payments');
      throw error;
    }
  });

  /**
   * GET /admin/payments/:id
   * Get a single payment by ID
   */
  fastify.get('/admin/payments/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const payment = await PaymentService.getPaymentById(id);

      return reply.status(200).send({
        success: true,
        data: payment,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Payment not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Payment not found',
        });
      }

      request.log.error(error, 'Error fetching payment');
      throw error;
    }
  });

  /**
   * POST /admin/payments
   * Create a manual payment (bank transfer, check, cash, etc.)
   */
  fastify.post('/admin/payments', async (request, reply) => {
    try {
      const data = request.body as any;

      // Validate required fields
      if (!data.invoiceId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'invoiceId is required',
        });
      }

      if (!data.amount || data.amount <= 0) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'amount must be greater than 0',
        });
      }

      if (!data.method) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'method is required',
        });
      }

      const payment = await PaymentService.createPayment(data);

      request.log.info(
        {
          paymentId: payment.id,
          paymentNumber: payment.paymentNumber,
          invoiceId: payment.invoiceId,
        },
        'Payment created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Payment created successfully',
        data: {
          id: payment.id,
          paymentNumber: payment.paymentNumber,
          amount: payment.amount.toString(),
          method: payment.method,
          status: payment.status,
          createdAt: payment.createdAt,
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

      request.log.error(error, 'Error creating payment');
      throw error;
    }
  });

  /**
   * POST /admin/invoices/:invoiceId/create-payment-intent
   * Create Stripe payment intent for invoice
   */
  fastify.post('/admin/invoices/:invoiceId/create-payment-intent', async (request, reply) => {
    try {
      const { invoiceId } = request.params as { invoiceId: string };

      const paymentIntent = await PaymentService.createStripePaymentIntent(invoiceId);

      request.log.info(
        {
          invoiceId,
          paymentIntentId: paymentIntent.id,
        },
        'Stripe payment intent created'
      );

      return reply.status(201).send({
        success: true,
        message: 'Payment intent created',
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
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

      if (error instanceof Error && error.message === 'Stripe is not configured') {
        return reply.status(503).send({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'Stripe payment processing is not configured',
        });
      }

      request.log.error(error, 'Error creating payment intent');
      throw error;
    }
  });
}