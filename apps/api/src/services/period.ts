import { PrismaClient, PeriodType, PeriodStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePeriodData {
  name: string;
  periodType: PeriodType;
  startDate: Date;
  endDate: Date;
}

export class PeriodService {
  /**
   * Create a new accounting period
   */
  static async createPeriod(data: CreatePeriodData) {
    // Check for overlapping periods
    const overlapping = await prisma.accountingPeriod.findFirst({
      where: {
        OR: [
          {
            startDate: {
              lte: data.endDate,
            },
            endDate: {
              gte: data.startDate,
            },
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error(
        `Period overlaps with existing period: ${overlapping.name}`
      );
    }

    const period = await prisma.accountingPeriod.create({
      data: {
        name: data.name,
        periodType: data.periodType,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'OPEN',
      },
    });

    return period;
  }

  /**
   * Generate periods for a year
   */
  static async generatePeriodsForYear(year: number, periodType: PeriodType) {
    const periods = [];

    if (periodType === 'MONTHLY') {
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        const name = `${year}-${(month + 1).toString().padStart(2, '0')}`;

        try {
          const period = await this.createPeriod({
            name,
            periodType: 'MONTHLY',
            startDate,
            endDate,
          });
          periods.push(period);
        } catch (error) {
          console.error(`Failed to create period ${name}:`, error);
        }
      }
    } else if (periodType === 'QUARTERLY') {
      for (let quarter = 0; quarter < 4; quarter++) {
        const startMonth = quarter * 3;
        const startDate = new Date(year, startMonth, 1);
        const endDate = new Date(year, startMonth + 3, 0);
        const name = `${year}-Q${quarter + 1}`;

        try {
          const period = await this.createPeriod({
            name,
            periodType: 'QUARTERLY',
            startDate,
            endDate,
          });
          periods.push(period);
        } catch (error) {
          console.error(`Failed to create period ${name}:`, error);
        }
      }
    } else if (periodType === 'YEARLY') {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      const name = `${year}`;

      const period = await this.createPeriod({
        name,
        periodType: 'YEARLY',
        startDate,
        endDate,
      });
      periods.push(period);
    }

    return periods;
  }

  /**
   * Get period by ID
   */
  static async getPeriodById(id: string) {
    const period = await prisma.accountingPeriod.findUnique({
      where: { id },
      include: {
        closedByUser: {
          select: { name: true, email: true },
        },
        lockedByUser: {
          select: { name: true, email: true },
        },
        unlockedByUser: {
          select: { name: true, email: true },
        },
        _count: {
          select: { journalEntries: true },
        },
      },
    });

    if (!period) {
      throw new Error('Period not found');
    }

    return period;
  }

  /**
   * List periods
   */
  static async listPeriods(filters: {
    status?: PeriodStatus;
    periodType?: PeriodType;
    year?: number;
  } = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.periodType) {
      where.periodType = filters.periodType;
    }

    if (filters.year) {
      where.startDate = {
        gte: new Date(filters.year, 0, 1),
        lt: new Date(filters.year + 1, 0, 1),
      };
    }

    const periods = await prisma.accountingPeriod.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        closedByUser: {
          select: { name: true },
        },
        _count: {
          select: { journalEntries: true },
        },
      },
    });

    return periods;
  }

  /**
   * Validate period can be closed
   */
  static async validatePeriodClose(periodId: string): Promise<{
    canClose: boolean;
    issues: string[];
  }> {
    const period = await this.getPeriodById(periodId);
    const issues: string[] = [];

    // Check if already closed
    if (period.status === 'CLOSED' || period.status === 'LOCKED') {
      issues.push('Period is already closed or locked');
      return { canClose: false, issues };
    }

    // Check all journal entries are posted
    const draftJournals = await prisma.journalEntry.count({
      where: {
        periodId,
        status: 'DRAFT',
      },
    });

    if (draftJournals > 0) {
      issues.push(`${draftJournals} journal entries are still in draft status`);
    }

    // Check all journal entries are balanced
    const journals = await prisma.journalEntry.findMany({
      where: { periodId },
      include: { lines: true },
    });

    for (const journal of journals) {
      const totalDebit = journal.lines.reduce(
        (sum, line) => sum + parseFloat(line.debit.toString()),
        0
      );
      const totalCredit = journal.lines.reduce(
        (sum, line) => sum + parseFloat(line.credit.toString()),
        0
      );

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        issues.push(
          `Journal ${journal.journalNumber} is not balanced (DR: ${totalDebit}, CR: ${totalCredit})`
        );
      }
    }

    // Check for unreconciled bank transactions in period
    const unreconciledTx = await prisma.bankTransaction.count({
      where: {
        transactionDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
        reconciled: false,
      },
    });

    if (unreconciledTx > 0) {
      issues.push(
        `${unreconciledTx} bank transactions are unreconciled in this period`
      );
    }

    return {
      canClose: issues.length === 0,
      issues,
    };
  }

  /**
   * Close period
   */
  static async closePeriod(periodId: string, userId: string, force: boolean = false) {
    const period = await this.getPeriodById(periodId);

    if (period.status === 'CLOSED' || period.status === 'LOCKED') {
      throw new Error('Period is already closed or locked');
    }

    // Validate period can be closed
    if (!force) {
      const validation = await this.validatePeriodClose(periodId);
      if (!validation.canClose) {
        throw new Error(
          `Period cannot be closed: ${validation.issues.join(', ')}`
        );
      }
    }

    // Close the period
    const closed = await prisma.accountingPeriod.update({
      where: { id: periodId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: userId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CLOSE',
        entityType: 'AccountingPeriod',
        entityId: periodId,
        userId,
        metadata: {
          periodName: period.name,
          forced: force,
        },
      },
    });

    return closed;
  }

  /**
   * Lock period (permanent close)
   */
  static async lockPeriod(periodId: string, userId: string) {
    const period = await this.getPeriodById(periodId);

    if (period.status !== 'CLOSED') {
      throw new Error('Period must be closed before it can be locked');
    }

    const locked = await prisma.accountingPeriod.update({
      where: { id: periodId },
      data: {
        status: 'LOCKED',
        lockedAt: new Date(),
        lockedBy: userId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'LOCK',
        entityType: 'AccountingPeriod',
        entityId: periodId,
        userId,
        metadata: {
          periodName: period.name,
        },
      },
    });

    return locked;
  }

  /**
   * Unlock period (reopen)
   */
  static async unlockPeriod(
    periodId: string,
    userId: string,
    reason: string
  ) {
    const period = await this.getPeriodById(periodId);

    if (period.status === 'OPEN') {
      throw new Error('Period is already open');
    }

    const unlocked = await prisma.accountingPeriod.update({
      where: { id: periodId },
      data: {
        status: 'OPEN',
        unlockedAt: new Date(),
        unlockedBy: userId,
        unlockReason: reason,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UNLOCK',
        entityType: 'AccountingPeriod',
        entityId: periodId,
        userId,
        metadata: {
          periodName: period.name,
          reason,
        },
      },
    });

    return unlocked;
  }

  /**
   * Delete period (only if no journal entries)
   */
  static async deletePeriod(periodId: string, userId: string) {
    const period = await this.getPeriodById(periodId);

    // Check for journal entries
    const journalCount = await prisma.journalEntry.count({
      where: { periodId },
    });

    if (journalCount > 0) {
      throw new Error(
        `Cannot delete period with ${journalCount} journal entries`
      );
    }

    await prisma.accountingPeriod.delete({
      where: { id: periodId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'AccountingPeriod',
        entityId: periodId,
        userId,
        metadata: {
          periodName: period.name,
        },
      },
    });

    return period;
  }

  /**
   * Get current open period
   */
  static async getCurrentPeriod(periodType: PeriodType = 'MONTHLY') {
    const now = new Date();

    const period = await prisma.accountingPeriod.findFirst({
      where: {
        periodType,
        status: 'OPEN',
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
    });

    return period;
  }

  /**
   * Get period statistics
   */
  static async getPeriodStats() {
    const [total, open, closed, locked] = await Promise.all([
      prisma.accountingPeriod.count(),
      prisma.accountingPeriod.count({
        where: { status: 'OPEN' },
      }),
      prisma.accountingPeriod.count({
        where: { status: 'CLOSED' },
      }),
      prisma.accountingPeriod.count({
        where: { status: 'LOCKED' },
      }),
    ]);

    return {
      total,
      open,
      closed,
      locked,
    };
  }
}