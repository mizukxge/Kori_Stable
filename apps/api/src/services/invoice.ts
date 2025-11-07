import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const INVOICES_DIR = path.join(process.cwd(), 'invoices');

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceData {
  title: string;
  description?: string;
  clientId: string;
  items: InvoiceLineItem[];
  taxRate?: number;
  paymentTerms?: string;
  dueDate?: Date;
  notes?: string;
  currency?: string;
  status?: InvoiceStatus;
  paymentType?: 'CASH' | 'CARD';
}

export interface UpdateInvoiceData {
  title?: string;
  description?: string;
  items?: InvoiceLineItem[];
  taxRate?: number;
  paymentTerms?: string;
  dueDate?: Date;
  notes?: string;
  status?: InvoiceStatus;
}

export class InvoiceService {
  /**
   * Initialize invoices directory
   */
  static async initializeStorage(): Promise<void> {
    await fs.mkdir(INVOICES_DIR, { recursive: true });
  }

  /**
   * Generate invoice number (e.g., INV-2025-001)
   */
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}`;

    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
    });

    const number = (count + 1).toString().padStart(3, '0');
    return `${prefix}-${number}`;
  }

  /**
   * Calculate invoice totals
   */
  static calculateTotals(items: InvoiceLineItem[], taxRate: number = 0) {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    const amountDue = total; // Initially, full amount is due

    return {
      subtotal: new Decimal(subtotal.toFixed(2)),
      taxRate: new Decimal(taxRate.toFixed(2)),
      taxAmount: new Decimal(taxAmount.toFixed(2)),
      total: new Decimal(total.toFixed(2)),
      amountDue: new Decimal(amountDue.toFixed(2)),
    };
  }

  /**
   * Calculate due date based on payment terms
   */
  static calculateDueDate(paymentTerms?: string): Date | undefined {
    if (!paymentTerms) return undefined;

    const today = new Date();

    // Parse common payment terms
    if (paymentTerms.toLowerCase() === 'due on receipt') {
      return today;
    }

    const netMatch = paymentTerms.match(/net\s*(\d+)/i);
    if (netMatch) {
      const days = parseInt(netMatch[1], 10);
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + days);
      return dueDate;
    }

    return undefined;
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(data: CreateInvoiceData, userId: string) {
    await this.initializeStorage();

    const invoiceNumber = await this.generateInvoiceNumber();
    const totals = this.calculateTotals(data.items, data.taxRate || 0);

    // Calculate due date if not provided
    const dueDate = data.dueDate || this.calculateDueDate(data.paymentTerms);

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        title: data.title,
        description: data.description,
        clientId: data.clientId,
        status: data.status || 'DRAFT',
        paymentType: data.paymentType,
        subtotal: totals.subtotal,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        amountDue: totals.amountDue,
        currency: data.currency || 'GBP',
        paymentTerms: data.paymentTerms,
        dueDate,
        notes: data.notes,
        createdBy: userId,
        items: {
          create: data.items.map((item, index) => ({
            position: index,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice.toFixed(2)),
            amount: new Decimal((item.quantity * item.unitPrice).toFixed(2)),
          })),
        },
      },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
        client: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Invoice',
        entityId: invoice.id,
        userId,
        clientId: data.clientId,
        metadata: {
          invoiceNumber,
          title: data.title,
          total: totals.total.toString(),
        },
      },
    });

    return invoice;
  }

  /**
   * List invoices
   */
  static async listInvoices(filters: {
    clientId?: string;
    status?: InvoiceStatus;
  } = {}) {
    const where: any = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { name: true, email: true },
        },
        createdByUser: {
          select: { name: true, email: true },
        },
        _count: {
          select: { items: true, payments: true },
        },
      },
    });

    // Convert BigInt to string for JSON serialization
    return invoices.map((invoice) => ({
      ...invoice,
      subtotal: invoice.subtotal.toString(),
      taxAmount: invoice.taxAmount.toString(),
      total: invoice.total.toString(),
      amountPaid: invoice.amountPaid.toString(),
      amountDue: invoice.amountDue.toString(),
    }));
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          orderBy: { position: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        createdByUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return {
      ...invoice,
      subtotal: invoice.subtotal.toString(),
      taxAmount: invoice.taxAmount.toString(),
      total: invoice.total.toString(),
      amountPaid: invoice.amountPaid.toString(),
      amountDue: invoice.amountDue.toString(),
      items: invoice.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toString(),
        amount: item.amount.toString(),
      })),
      payments: invoice.payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toString(),
        refundAmount: payment.refundAmount?.toString(),
      })),
    };
  }

  /**
   * Get invoice by number
   */
  static async getInvoiceByNumber(invoiceNumber: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        client: true,
        items: {
          orderBy: { position: 'asc' },
        },
        payments: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice;
  }

  /**
   * Update invoice
   */
  static async updateInvoice(id: string, data: UpdateInvoiceData, userId: string) {
    const existing = await this.getInvoiceById(id);

    // Calculate new totals if items changed
    let totals;
    if (data.items) {
      totals = this.calculateTotals(
        data.items,
        data.taxRate || parseFloat(existing.taxRate.toString())
      );
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        ...(totals && {
          subtotal: totals.subtotal,
          taxRate: totals.taxRate,
          taxAmount: totals.taxAmount,
          total: totals.total,
          amountDue: totals.amountDue,
        }),
        paymentTerms: data.paymentTerms,
        dueDate: data.dueDate,
        notes: data.notes,
        status: data.status,
      },
    });

    // Update items if provided
    if (data.items) {
      // Delete existing items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Create new items
      await prisma.invoiceItem.createMany({
        data: data.items.map((item, index) => ({
          invoiceId: id,
          position: index,
          description: item.description,
          quantity: item.quantity,
          unitPrice: new Decimal(item.unitPrice.toFixed(2)),
          amount: new Decimal((item.quantity * item.unitPrice).toFixed(2)),
        })),
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Invoice',
        entityId: id,
        userId,
        clientId: invoice.clientId,
      },
    });

    return invoice;
  }

  /**
   * Send invoice (change status to SENT)
   */
  static async sendInvoice(id: string, userId: string) {
    const invoice = await this.getInvoiceById(id);

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be sent');
    }

    // Generate PDF if not exists
    if (!invoice.pdfPath) {
      await this.generatePDF(id);
    }

    const sent = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'SEND',
        entityType: 'Invoice',
        entityId: id,
        userId,
        clientId: invoice.clientId,
      },
    });

    return sent;
  }

  /**
   * Mark invoice as paid
   */
  static async markPaid(id: string, userId: string) {
    const invoice = await this.getInvoiceById(id);

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        amountDue: new Decimal('0'),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'MARK_PAID',
        entityType: 'Invoice',
        entityId: id,
        userId,
        clientId: invoice.clientId,
      },
    });

    return updated;
  }

  /**
   * Generate PDF for invoice
   */
  static async generatePDF(invoiceId: string): Promise<string> {
    const invoice = await this.getInvoiceById(invoiceId);

    const filename = `${invoice.invoiceNumber}.pdf`;
    const filepath = path.join(INVOICES_DIR, filename);

    // Create PDF document
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = doc.pipe(createWriteStream(filepath));

    // Header
    doc.fontSize(24).text('INVOICE', { align: 'center' });
    doc.fontSize(12).text(invoice.invoiceNumber, { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(14).text(invoice.title);
    if (invoice.description) {
      doc.fontSize(10).text(invoice.description);
    }
    doc.moveDown();

    // Bill to
    doc.fontSize(12).text('Bill To:');
    doc.fontSize(10).text(invoice.client.name);
    if (invoice.client.email) {
      doc.text(invoice.client.email);
    }
    doc.moveDown();

    // Due date
    if (invoice.dueDate) {
      doc.fontSize(10).text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
    }
    if (invoice.paymentTerms) {
      doc.text(`Payment Terms: ${invoice.paymentTerms}`);
    }
    doc.moveDown();

    // Line items
    doc.fontSize(12).text('Items:');
    doc.moveDown(0.5);

    invoice.items.forEach((item) => {
      doc
        .fontSize(10)
        .text(`${item.description}`, 50, doc.y, { continued: true, width: 300 })
        .text(`${item.quantity} × $${item.unitPrice}`, { align: 'right' });
      doc.text(`$${item.amount}`, { align: 'right' });
      doc.moveDown(0.3);
    });

    doc.moveDown();

    // Totals
    doc
      .fontSize(10)
      .text(`Subtotal:`, 350, doc.y, { continued: true })
      .text(`$${invoice.subtotal}`, { align: 'right' });

    if (parseFloat(invoice.taxRate) > 0) {
      doc
        .text(`Tax (${invoice.taxRate}%):`, 350, doc.y, { continued: true })
        .text(`$${invoice.taxAmount}`, { align: 'right' });
    }

    doc
      .fontSize(12)
      .text(`Total:`, 350, doc.y, { continued: true })
      .text(`$${invoice.total}`, { align: 'right' });

    if (parseFloat(invoice.amountDue) < parseFloat(invoice.total)) {
      doc
        .text(`Amount Paid:`, 350, doc.y, { continued: true })
        .text(`$${invoice.amountPaid}`, { align: 'right' });
      doc
        .fontSize(14)
        .text(`Amount Due:`, 350, doc.y, { continued: true })
        .text(`$${invoice.amountDue}`, { align: 'right' });
    }

    doc.moveDown(2);

    // Notes
    if (invoice.notes) {
      doc.fontSize(10).text('Notes:', { underline: true });
      doc.fontSize(9).text(invoice.notes);
    }

    // Footer
    doc
      .fontSize(8)
      .text(`Generated: ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
        align: 'center',
      });

    doc.end();

    // Wait for PDF to finish writing
    await new Promise((resolve) => stream.on('finish', resolve));

    // Update invoice with PDF path
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pdfPath: filepath,
      },
    });

    return filepath;
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(id: string, userId: string) {
    const invoice = await this.getInvoiceById(id);

    // Delete PDF if exists
    if (invoice.pdfPath) {
      try {
        await fs.unlink(invoice.pdfPath);
      } catch (error) {
        console.error('Failed to delete PDF:', error);
      }
    }

    await prisma.invoice.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Invoice',
        entityId: id,
        userId,
        clientId: invoice.clientId,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title,
        },
      },
    });

    return invoice;
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStats() {
    const [total, byStatus, totalRevenue, unpaidAmount] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: 'PAID' },
      }),
      prisma.invoice.aggregate({
        _sum: { amountDue: true },
        where: {
          status: {
            in: ['SENT', 'PARTIAL', 'OVERDUE'],
          },
        },
      }),
    ]);

    const stats: any = {
      total,
      byStatus: {},
      totalRevenue: totalRevenue._sum.total?.toString() || '0',
      unpaidAmount: unpaidAmount._sum.amountDue?.toString() || '0',
    };

    byStatus.forEach((status) => {
      stats.byStatus[status.status] = status._count;
    });

    return stats;
  }
}