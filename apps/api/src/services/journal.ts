import { PrismaClient, JournalStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const ATTACHMENTS_DIR = path.join(process.cwd(), 'journal-attachments');

export interface JournalLineData {
  account: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface CreateJournalData {
  periodId: string;
  entryDate: Date;
  description: string;
  reference?: string;
  lines: JournalLineData[];
}

export interface UpdateJournalData {
  entryDate?: Date;
  description?: string;
  reference?: string;
  lines?: JournalLineData[];
}

export class JournalService {
  /**
   * Initialize attachments directory
   */
  static async initializeStorage(): Promise<void> {
    await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
  }

  /**
   * Generate journal number (e.g., JE-2025-001)
   */
  static async generateJournalNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}`;

    const count = await prisma.journalEntry.count({
      where: {
        journalNumber: {
          startsWith: prefix,
        },
      },
    });

    const number = (count + 1).toString().padStart(3, '0');
    return `${prefix}-${number}`;
  }

  /**
   * Validate journal entry is balanced
   */
  static validateBalance(lines: JournalLineData[]): {
    balanced: boolean;
    totalDebit: number;
    totalCredit: number;
    difference: number;
  } {
    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
    const difference = totalDebit - totalCredit;

    return {
      balanced: Math.abs(difference) < 0.01,
      totalDebit,
      totalCredit,
      difference,
    };
  }

  /**
   * Validate period is open
   */
  static async validatePeriodOpen(periodId: string): Promise<void> {
    const period = await prisma.accountingPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new Error('Period not found');
    }

    if (period.status !== 'OPEN') {
      throw new Error(
        `Cannot modify journal entries in ${period.status.toLowerCase()} period`
      );
    }
  }

  /**
   * Create journal entry
   */
  static async createJournalEntry(data: CreateJournalData, userId: string) {
    await this.initializeStorage();

    // Validate period is open
    await this.validatePeriodOpen(data.periodId);

    // Validate balance
    const balance = this.validateBalance(data.lines);
    if (!balance.balanced) {
      throw new Error(
        `Journal entry is not balanced. Debits: ${balance.totalDebit}, Credits: ${balance.totalCredit}, Difference: ${balance.difference}`
      );
    }

    // Generate journal number
    const journalNumber = await this.generateJournalNumber();

    // Create journal entry with lines
    const journal = await prisma.journalEntry.create({
      data: {
        journalNumber,
        periodId: data.periodId,
        entryDate: data.entryDate,
        description: data.description,
        reference: data.reference,
        createdBy: userId,
        lines: {
          create: data.lines.map((line, index) => ({
            position: index,
            account: line.account,
            description: line.description,
            debit: new Decimal(line.debit.toFixed(2)),
            credit: new Decimal(line.credit.toFixed(2)),
          })),
        },
      },
      include: {
        lines: {
          orderBy: { position: 'asc' },
        },
        period: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'JournalEntry',
        entityId: journal.id,
        userId,
        metadata: {
          journalNumber,
          description: data.description,
          totalDebit: balance.totalDebit,
          totalCredit: balance.totalCredit,
        },
      },
    });

    return journal;
  }

  /**
   * List journal entries
   */
  static async listJournalEntries(filters: {
    periodId?: string;
    status?: JournalStatus;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const where: any = {};

    if (filters.periodId) {
      where.periodId = filters.periodId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.entryDate = {};
      if (filters.startDate) {
        where.entryDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.entryDate.lte = filters.endDate;
      }
    }

    const journals = await prisma.journalEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      include: {
        period: {
          select: { name: true, status: true },
        },
        createdByUser: {
          select: { name: true, email: true },
        },
        _count: {
          select: { lines: true, attachments: true },
        },
      },
    });

    return journals;
  }

  /**
   * Get journal entry by ID
   */
  static async getJournalById(id: string) {
    const journal = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        period: true,
        lines: {
          orderBy: { position: 'asc' },
        },
        attachments: true,
        createdByUser: {
          select: { name: true, email: true },
        },
        postedByUser: {
          select: { name: true, email: true },
        },
        approvedByUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!journal) {
      throw new Error('Journal entry not found');
    }

    return {
      ...journal,
      lines: journal.lines.map((line) => ({
        ...line,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
      })),
    };
  }

  /**
   * Update journal entry
   */
  static async updateJournalEntry(
    id: string,
    data: UpdateJournalData,
    userId: string
  ) {
    const existing = await this.getJournalById(id);

    // Check status
    if (existing.status !== 'DRAFT') {
      throw new Error('Can only update draft journal entries');
    }

    // Validate period is open
    await this.validatePeriodOpen(existing.periodId);

    // Validate balance if lines are updated
    if (data.lines) {
      const balance = this.validateBalance(data.lines);
      if (!balance.balanced) {
        throw new Error(
          `Journal entry is not balanced. Debits: ${balance.totalDebit}, Credits: ${balance.totalCredit}`
        );
      }
    }

    // Update journal
    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        entryDate: data.entryDate,
        description: data.description,
        reference: data.reference,
      },
      include: {
        lines: {
          orderBy: { position: 'asc' },
        },
      },
    });

    // Update lines if provided
    if (data.lines) {
      // Delete existing lines
      await prisma.journalLine.deleteMany({
        where: { journalEntryId: id },
      });

      // Create new lines
      await prisma.journalLine.createMany({
        data: data.lines.map((line, index) => ({
          journalEntryId: id,
          position: index,
          account: line.account,
          description: line.description,
          debit: new Decimal(line.debit.toFixed(2)),
          credit: new Decimal(line.credit.toFixed(2)),
        })),
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'JournalEntry',
        entityId: id,
        userId,
      },
    });

    return updated;
  }

  /**
   * Post journal entry
   */
  static async postJournalEntry(id: string, userId: string) {
    const journal = await this.getJournalById(id);

    if (journal.status !== 'DRAFT') {
      throw new Error('Can only post draft journal entries');
    }

    // Validate period is open
    await this.validatePeriodOpen(journal.periodId);

    // Validate balance
    const totalDebit = journal.lines.reduce(
      (sum, line) => sum + parseFloat(line.debit),
      0
    );
    const totalCredit = journal.lines.reduce(
      (sum, line) => sum + parseFloat(line.credit),
      0
    );

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Journal entry is not balanced');
    }

    const posted = await prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'POSTED',
        postedAt: new Date(),
        postedBy: userId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'POST',
        entityType: 'JournalEntry',
        entityId: id,
        userId,
        metadata: {
          journalNumber: journal.journalNumber,
        },
      },
    });

    return posted;
  }

  /**
   * Approve journal entry
   */
  static async approveJournalEntry(id: string, userId: string) {
    const journal = await this.getJournalById(id);

    if (journal.status !== 'POSTED') {
      throw new Error('Can only approve posted journal entries');
    }

    const approved = await prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'APPROVE',
        entityType: 'JournalEntry',
        entityId: id,
        userId,
      },
    });

    return approved;
  }

  /**
   * Void journal entry
   */
  static async voidJournalEntry(id: string, userId: string, reason: string) {
    const journal = await this.getJournalById(id);

    // Validate period is open
    await this.validatePeriodOpen(journal.periodId);

    const voided = await prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'VOIDED',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'VOID',
        entityType: 'JournalEntry',
        entityId: id,
        userId,
        metadata: {
          journalNumber: journal.journalNumber,
          reason,
        },
      },
    });

    return voided;
  }

  /**
   * Delete journal entry (only drafts)
   */
  static async deleteJournalEntry(id: string, userId: string) {
    const journal = await this.getJournalById(id);

    if (journal.status !== 'DRAFT') {
      throw new Error('Can only delete draft journal entries');
    }

    // Validate period is open
    await this.validatePeriodOpen(journal.periodId);

    // Delete attachments
    for (const attachment of journal.attachments) {
      try {
        await fs.unlink(attachment.path);
      } catch (error) {
        console.error('Failed to delete attachment:', error);
      }
    }

    await prisma.journalEntry.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'JournalEntry',
        entityId: id,
        userId,
        metadata: {
          journalNumber: journal.journalNumber,
        },
      },
    });

    return journal;
  }

  /**
   * Get journal statistics
   */
  static async getJournalStats() {
    const [total, byStatus] = await Promise.all([
      prisma.journalEntry.count(),
      prisma.journalEntry.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const stats: any = {
      total,
      byStatus: {},
    };

    byStatus.forEach((status) => {
      stats.byStatus[status.status] = status._count;
    });

    return stats;
  }
}