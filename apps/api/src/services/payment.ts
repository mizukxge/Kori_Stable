import { PrismaClient, PaymentMethod, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe (only if keys are provided)
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' }) : null;

export interface CreatePaymentData {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export class PaymentService {
  /**
   * Generate payment number (e.g., PAY-2025-001)
   */
  static async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}`;

    const count = await prisma.payment.count({
      where: {
        paymentNumber: {
          startsWith: prefix,
        },
      },
    });

    const number = (count + 1).toString().padStart(3, '0');
    return `${prefix}-${number}`;
  }

  /**
   * Create a manual payment
   */
  static async createPayment(data: CreatePaymentData) {
    const paymentNumber = await this.generatePaymentNumber();

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId: data.invoiceId,
        amount: new Decimal(data.amount.toFixed(2)),
        currency: invoice.currency,
        method: data.method,
        status: 'COMPLETED',
        paidAt: new Date(),
        notes: data.notes,
      },
    });

    // Update invoice amounts
    await this.updateInvoiceAmounts(data.invoiceId);

    return payment;
  }

  /**
   * Update invoice amounts based on payments
   */
  static async updateInvoiceAmounts(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate total paid
    const totalPaid = invoice.payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount.toString());
    }, 0);

    const total = parseFloat(invoice.total.toString());
    const amountDue = total - totalPaid;

    // Determine status
    let status = invoice.status;
    if (amountDue <= 0) {
      status = 'PAID';
    } else if (totalPaid > 0) {
      status = 'PARTIAL';
    }

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: new Decimal(totalPaid.toFixed(2)),
        amountDue: new Decimal(Math.max(0, amountDue).toFixed(2)),
        status,
        paidAt: status === 'PAID' ? new Date() : null,
      },
    });
  }

  /**
   * Create Stripe payment intent
   */
  static async createStripePaymentIntent(
    invoiceId: string,
    metadata?: Record<string, string>
  ) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(invoice.amountDue.toString()) * 100), // Convert to cents
      currency: invoice.currency.toLowerCase(),
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        ...metadata,
      },
      description: `Payment for ${invoice.invoiceNumber}`,
    });

    return paymentIntent;
  }

  /**
   * Handle Stripe webhook event
   */
  static async handleStripeWebhook(event: StripeWebhookEvent) {
    console.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment intent
   */
  private static async handlePaymentIntentSucceeded(paymentIntent: any) {
    const { invoiceId } = paymentIntent.metadata;

    if (!invoiceId) {
      console.error('No invoiceId in payment intent metadata');
      return;
    }

    // Check if payment already exists
    const existing = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (existing) {
      console.log('Payment already recorded');
      return;
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      console.error('Invoice not found');
      return;
    }

    // Create payment record
    const paymentNumber = await this.generatePaymentNumber();

    await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        amount: new Decimal((paymentIntent.amount / 100).toFixed(2)), // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        method: 'STRIPE',
        status: 'COMPLETED',
        stripePaymentId: paymentIntent.id,
        stripeIntentId: paymentIntent.id,
        paidAt: new Date(),
        notes: 'Stripe payment',
      },
    });

    // Update invoice amounts
    await this.updateInvoiceAmounts(invoiceId);

    console.log(`Payment recorded for invoice ${invoiceId}`);
  }

  /**
   * Handle failed payment intent
   */
  private static async handlePaymentIntentFailed(paymentIntent: any) {
    const { invoiceId } = paymentIntent.metadata;

    if (!invoiceId) {
      return;
    }

    const paymentNumber = await this.generatePaymentNumber();

    await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        amount: new Decimal((paymentIntent.amount / 100).toFixed(2)),
        currency: paymentIntent.currency.toUpperCase(),
        method: 'STRIPE',
        status: 'FAILED',
        stripePaymentId: paymentIntent.id,
        stripeIntentId: paymentIntent.id,
        notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
      },
    });

    console.log(`Payment failed for invoice ${invoiceId}`);
  }

  /**
   * Handle charge refunded
   */
  private static async handleChargeRefunded(charge: any) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: charge.payment_intent },
    });

    if (!payment) {
      console.error('Payment not found for refund');
      return;
    }

    const refundAmount = charge.amount_refunded / 100;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: new Decimal(refundAmount.toFixed(2)),
      },
    });

    // Update invoice amounts
    await this.updateInvoiceAmounts(payment.invoiceId);

    console.log(`Refund processed for payment ${payment.id}`);
  }

  /**
   * Verify Stripe webhook signature
   */
  static verifyStripeWebhook(payload: string, signature: string): StripeWebhookEvent {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      ) as unknown as StripeWebhookEvent;

      return event;
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error}`);
    }
  }

  /**
   * List payments
   */
  static async listPayments(filters: {
    invoiceId?: string;
    status?: PaymentStatus;
  } = {}) {
    const where: any = {};

    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            title: true,
            client: {
              select: { name: true },
            },
          },
        },
      },
    });

    return payments.map((payment) => ({
      ...payment,
      amount: payment.amount.toString(),
      refundAmount: payment.refundAmount?.toString(),
    }));
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      ...payment,
      amount: payment.amount.toString(),
      refundAmount: payment.refundAmount?.toString(),
    };
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats() {
    const [total, byStatus, totalAmount, byMethod] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.payment.groupBy({
        by: ['method'],
        _count: true,
        _sum: {
          amount: true,
        },
        where: { status: 'COMPLETED' },
      }),
    ]);

    const stats: any = {
      total,
      byStatus: {},
      totalAmount: totalAmount._sum.amount?.toString() || '0',
      byMethod: {},
    };

    byStatus.forEach((status) => {
      stats.byStatus[status.status] = status._count;
    });

    byMethod.forEach((method) => {
      stats.byMethod[method.method] = {
        count: method._count,
        amount: method._sum.amount?.toString() || '0',
      };
    });

    return stats;
  }
}