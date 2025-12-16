import { PrismaClient, ProposalStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import PDFDocument from 'pdfkit';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { OTPService } from './otp.js';

const prisma = new PrismaClient();

const PROPOSALS_DIR = path.join(process.cwd(), 'proposals');

export interface ProposalLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateProposalData {
  title: string;
  description?: string;
  clientId: string;
  items: ProposalLineItem[];
  taxRate?: number;
  terms?: string;
  expiresAt?: Date;
  validUntil?: string;
  notes?: string;
}

export interface UpdateProposalData {
  title?: string;
  description?: string;
  items?: ProposalLineItem[];
  taxRate?: number;
  terms?: string;
  expiresAt?: Date;
  validUntil?: string;
  notes?: string;
}

export interface AcceptProposalData {
  signatureIP: string;
  signatureAgent: string;
}

export class ProposalService {
  /**
   * Initialize proposals directory
   */
  static async initializeStorage(): Promise<void> {
    await fs.mkdir(PROPOSALS_DIR, { recursive: true });
  }

  /**
   * Generate proposal number (e.g., PROP-2025-001)
   */
  static async generateProposalNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PROP-${year}`;

    // Get count of proposals for this year
    const count = await prisma.proposal.count({
      where: {
        proposalNumber: {
          startsWith: prefix,
        },
      },
    });

    const number = (count + 1).toString().padStart(3, '0');
    return `${prefix}-${number}`;
  }

  /**
   * Calculate proposal totals
   */
  static calculateTotals(items: ProposalLineItem[], taxRate: number = 0) {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      subtotal: new Decimal(subtotal.toFixed(2)),
      taxRate: new Decimal(taxRate.toFixed(2)),
      taxAmount: new Decimal(taxAmount.toFixed(2)),
      total: new Decimal(total.toFixed(2)),
    };
  }

  /**
   * Create a new proposal
   */
  static async createProposal(data: CreateProposalData, userId: string) {
    await this.initializeStorage();

    const proposalNumber = await this.generateProposalNumber();
    const totals = this.calculateTotals(data.items, data.taxRate || 0);

    // Create proposal with items
    const proposal = await prisma.proposal.create({
      data: {
        proposalNumber,
        title: data.title,
        description: data.description,
        clientId: data.clientId,
        subtotal: totals.subtotal,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        terms: data.terms,
        expiresAt: data.expiresAt,
        validUntil: data.validUntil,
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
        entityType: 'Proposal',
        entityId: proposal.id,
        userId,
        clientId: data.clientId,
        metadata: {
          proposalNumber,
          title: data.title,
          total: totals.total.toString(),
        },
      },
    });

    return proposal;
  }

  /**
   * List proposals
   */
  static async listProposals(filters: {
    clientId?: string;
    status?: ProposalStatus;
  } = {}) {
    const where: any = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const proposals = await prisma.proposal.findMany({
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
          select: { items: true },
        },
      },
    });

    return proposals;
  }

  /**
   * Get proposal by ID
   */
  static async getProposalById(id: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          orderBy: { position: 'asc' },
        },
        createdByUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    return proposal;
  }

  /**
   * Get proposal by proposal number (public access)
   */
  static async getProposalByNumber(proposalNumber: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { proposalNumber },
      include: {
        client: {
          select: { name: true, email: true, phone: true },
        },
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Mark as viewed if first time
    if (!proposal.viewedAt && proposal.status === 'SENT') {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          viewedAt: new Date(),
          status: 'VIEWED',
        },
      });
    }

    return proposal;
  }

  /**
   * Update proposal
   */
  static async updateProposal(id: string, data: UpdateProposalData, userId: string) {
    const existing = await this.getProposalById(id);

    // Calculate new totals if items changed
    let totals;
    if (data.items) {
      totals = this.calculateTotals(data.items, data.taxRate || existing.taxRate.toNumber());
    }

    // Update proposal
    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        ...(totals && {
          subtotal: totals.subtotal,
          taxRate: totals.taxRate,
          taxAmount: totals.taxAmount,
          total: totals.total,
        }),
        terms: data.terms,
        expiresAt: data.expiresAt,
        validUntil: data.validUntil,
        notes: data.notes,
      },
      include: {
        items: true,
        client: true,
      },
    });

    // Update items if provided
    if (data.items) {
      // Delete existing items
      await prisma.proposalItem.deleteMany({
        where: { proposalId: id },
      });

      // Create new items
      await prisma.proposalItem.createMany({
        data: data.items.map((item, index) => ({
          proposalId: id,
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
        entityType: 'Proposal',
        entityId: id,
        userId,
        clientId: proposal.clientId,
      },
    });

    return proposal;
  }

  /**
   * Send proposal (change status to SENT and generate OTP)
   */
  static async sendProposal(id: string, userId: string) {
    const proposal = await this.getProposalById(id);

    if (proposal.status !== 'DRAFT') {
      throw new Error('Only draft proposals can be sent');
    }

    // Generate OTP for acceptance
    const otp = await OTPService.generateForProposal(id);

    // Update proposal status
    const updated = await prisma.proposal.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        client: true,
        items: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'SEND',
        entityType: 'Proposal',
        entityId: id,
        userId,
        clientId: proposal.clientId,
        metadata: {
          otpGenerated: true,
          sentTo: proposal.client.email,
        },
      },
    });

    return { proposal: updated, otp };
  }

  /**
   * Accept proposal with OTP validation
   */
  static async acceptProposal(
    proposalNumber: string,
    otpCode: string,
    signatureData: AcceptProposalData
  ) {
    const proposal = await this.getProposalByNumber(proposalNumber);

    // Validate OTP
    const validation = await OTPService.validateForProposal(proposal.id, otpCode);

    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid OTP');
    }

    // Accept proposal
    const accepted = await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        signatureIP: signatureData.signatureIP,
        signatureAgent: signatureData.signatureAgent,
      },
      include: {
        client: true,
        items: true,
      },
    });

    // Generate PDF
    await this.generatePDF(accepted.id);

    // Create audit log (no userId for public acceptance)
    await prisma.auditLog.create({
      data: {
        action: 'ACCEPT',
        entityType: 'Proposal',
        entityId: proposal.id,
        clientId: proposal.clientId,
        metadata: {
          proposalNumber: proposal.proposalNumber,
          signatureIP: signatureData.signatureIP,
        },
      },
    });

    return accepted;
  }

  /**
   * Decline proposal
   */
  static async declineProposal(proposalNumber: string, reason?: string) {
    const proposal = await this.getProposalByNumber(proposalNumber);

    const declined = await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        notes: reason ? `${proposal.notes || ''}\n\nDecline reason: ${reason}` : proposal.notes,
      },
    });

    // Invalidate OTP
    await OTPService.invalidateForProposal(proposal.id);

    return declined;
  }

  /**
   * Generate PDF for proposal
   */
  static async generatePDF(proposalId: string): Promise<string> {
    const proposal = await this.getProposalById(proposalId);

    const filename = `${proposal.proposalNumber}.pdf`;
    const filepath = path.join(PROPOSALS_DIR, filename);

    // Create PDF document
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = doc.pipe(createWriteStream(filepath));

    // Header
    doc.fontSize(20).text('PROPOSAL', { align: 'center' });
    doc.fontSize(12).text(proposal.proposalNumber, { align: 'center' });
    doc.moveDown();

    // Proposal details
    doc.fontSize(16).text(proposal.title);
    if (proposal.description) {
      doc.fontSize(10).text(proposal.description);
    }
    doc.moveDown();

    // Client info
    doc.fontSize(12).text('Prepared for:');
    doc.fontSize(10).text(proposal.client.name);
    if (proposal.client.email) {
      doc.text(proposal.client.email);
    }
    doc.moveDown();

    // Line items table
    doc.fontSize(12).text('Items:');
    doc.moveDown(0.5);

    proposal.items.forEach((item) => {
      doc.fontSize(10)
        .text(`${item.description}`, 50, doc.y, { continued: true, width: 300 })
        .text(`${item.quantity} Ãƒâ€” $${item.unitPrice.toString()}`, { align: 'right' });
      doc.text(`$${item.amount.toString()}`, { align: 'right' });
      doc.moveDown(0.3);
    });

    doc.moveDown();

    // Totals
    doc.fontSize(10)
      .text(`Subtotal:`, 350, doc.y, { continued: true })
      .text(`$${proposal.subtotal.toString()}`, { align: 'right' });

    if (proposal.taxRate.toNumber() > 0) {
      doc.text(`Tax (${proposal.taxRate}%):`, 350, doc.y, { continued: true })
        .text(`$${proposal.taxAmount.toString()}`, { align: 'right' });
    }

    doc.fontSize(12)
      .text(`Total:`, 350, doc.y, { continued: true })
      .text(`$${proposal.total.toString()}`, { align: 'right' });

    doc.moveDown(2);

    // Terms
    if (proposal.terms) {
      doc.fontSize(10).text('Terms & Conditions:', { underline: true });
      doc.fontSize(9).text(proposal.terms);
      doc.moveDown();
    }

    // Signature section
    if (proposal.acceptedAt) {
      doc.fontSize(10).text(`Accepted on: ${proposal.acceptedAt.toLocaleDateString()}`);
      doc.text(`Signature IP: ${proposal.signatureIP}`);
    }

    // Footer
    doc.fontSize(8)
      .text(`Generated: ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
        align: 'center',
      });

    doc.end();

    // Wait for PDF to finish writing
    await new Promise<void>((resolve) => stream.on('finish', () => resolve()));

    // Update proposal with PDF path
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        pdfPath: filepath,
      },
    });

    return filepath;
  }

  /**
   * Delete proposal
   */
  static async deleteProposal(id: string, userId: string) {
    const proposal = await this.getProposalById(id);

    // Delete PDF if exists
    if (proposal.pdfPath) {
      try {
        await fs.unlink(proposal.pdfPath);
      } catch (error) {
        console.error('Failed to delete PDF:', error);
      }
    }

    await prisma.proposal.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Proposal',
        entityId: id,
        userId,
        clientId: proposal.clientId,
        metadata: {
          proposalNumber: proposal.proposalNumber,
          title: proposal.title,
        },
      },
    });

    return proposal;
  }

  /**
   * Get proposal statistics
   */
  static async getProposalStats() {
    const [total, byStatus, totalValue, acceptanceRate] = await Promise.all([
      prisma.proposal.count(),
      prisma.proposal.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.proposal.aggregate({
        _sum: { total: true },
        where: { status: 'ACCEPTED' },
      }),
      prisma.proposal.aggregate({
        _count: {
          _all: true,
        },
        where: {
          status: {
            in: ['ACCEPTED', 'DECLINED'],
          },
        },
      }),
    ]);

    const stats: any = {
      total,
      byStatus: {},
      totalAcceptedValue: totalValue._sum.total?.toString() || '0',
    };

    byStatus.forEach((status) => {
      stats.byStatus[status.status] = status._count;
    });

    // Calculate acceptance rate
    const acceptedCount = stats.byStatus['ACCEPTED'] || 0;
    const processedCount = acceptanceRate._count._all;
    stats.acceptanceRate = processedCount > 0 
      ? ((acceptedCount / processedCount) * 100).toFixed(1)
      : '0';

    return stats;
  }
}