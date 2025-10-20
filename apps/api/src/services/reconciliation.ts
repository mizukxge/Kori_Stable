import { PrismaClient, MatchType, ReconciliationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface MatchCandidate {
  payment: any;
  confidence: number;
  reasons: string[];
}

export class ReconciliationService {
  /**
   * Calculate similarity between two strings (0-1)
   * Uses Levenshtein distance
   */
  static calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    // Simple substring matching
    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }

    // Levenshtein distance
    const editDistance = this.levenshteinDistance(s1, s2);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Find matching payments for a bank transaction
   */
  static async findMatches(
    bankTransactionId: string
  ): Promise<MatchCandidate[]> {
    const bankTx = await prisma.bankTransaction.findUnique({
      where: { id: bankTransactionId },
    });

    if (!bankTx) {
      throw new Error('Bank transaction not found');
    }

    // Get unreconciled payments within date range (±7 days)
    const startDate = new Date(bankTx.transactionDate);
    startDate.setDate(startDate.getDate() - 7);

    const endDate = new Date(bankTx.transactionDate);
    endDate.setDate(endDate.getDate() + 7);

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        reconciliation: null, // Not already reconciled
      },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
      },
    });

    const candidates: MatchCandidate[] = [];

    for (const payment of payments) {
      let confidence = 0;
      const reasons: string[] = [];

      // 1. Exact amount match (40 points)
      const bankAmount = parseFloat(bankTx.amount.toString());
      const paymentAmount = parseFloat(payment.amount.toString());

      if (Math.abs(bankAmount - paymentAmount) < 0.01) {
        confidence += 40;
        reasons.push('Exact amount match');
      } else if (Math.abs(bankAmount - paymentAmount) < 1) {
        confidence += 20;
        reasons.push('Close amount match');
      }

      // 2. Date proximity (30 points)
      const daysDiff = Math.abs(
        (bankTx.transactionDate.getTime() - payment.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1) {
        confidence += 30;
        reasons.push('Same day or next day');
      } else if (daysDiff <= 3) {
        confidence += 20;
        reasons.push('Within 3 days');
      } else if (daysDiff <= 7) {
        confidence += 10;
        reasons.push('Within 7 days');
      }

      // 3. Reference number match (20 points)
      if (bankTx.reference && payment.paymentNumber) {
        const refSimilarity = this.calculateStringSimilarity(
          bankTx.reference,
          payment.paymentNumber
        );
        if (refSimilarity > 0.8) {
          confidence += 20;
          reasons.push('Reference number match');
        }
      }

      // 4. Invoice number in description (10 points)
      if (payment.invoice) {
        const descLower = bankTx.description.toLowerCase();
        const invoiceNum = payment.invoice.invoiceNumber.toLowerCase();

        if (descLower.includes(invoiceNum)) {
          confidence += 10;
          reasons.push('Invoice number in description');
        }
      }

      // 5. Client name in description (10 points)
      if (payment.invoice?.client) {
        const descLower = bankTx.description.toLowerCase();
        const clientName = payment.invoice.client.name.toLowerCase();

        const nameSimilarity = this.calculateStringSimilarity(
          descLower,
          clientName
        );

        if (nameSimilarity > 0.7 || descLower.includes(clientName)) {
          confidence += 10;
          reasons.push('Client name match');
        }
      }

      // Only include candidates with reasonable confidence
      if (confidence >= 40) {
        candidates.push({
          payment,
          confidence,
          reasons,
        });
      }
    }

    // Sort by confidence (highest first)
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates;
  }

  /**
   * Auto-match bank transactions
   */
  static async autoMatch(
    importBatch?: string,
    minConfidence: number = 80
  ): Promise<{
    matched: number;
    suggestions: number;
    unmatched: number;
  }> {
    // Get unreconciled bank transactions
    const where: any = { reconciled: false };
    if (importBatch) {
      where.importBatch = importBatch;
    }

    const transactions = await prisma.bankTransaction.findMany({
      where,
    });

    let matched = 0;
    let suggestions = 0;
    let unmatched = 0;

    for (const tx of transactions) {
      const candidates = await this.findMatches(tx.id);

      if (candidates.length === 0) {
        unmatched++;
        continue;
      }

      const bestMatch = candidates[0];

      if (bestMatch.confidence >= minConfidence) {
        // Auto-match with high confidence
        await this.createReconciliation({
          bankTransactionId: tx.id,
          paymentId: bestMatch.payment.id,
          matchType: 'AUTO_EXACT',
          confidence: bestMatch.confidence,
          status: 'CONFIRMED',
        });
        matched++;
      } else if (bestMatch.confidence >= 60) {
        // Create suggestion
        await this.createReconciliation({
          bankTransactionId: tx.id,
          paymentId: bestMatch.payment.id,
          matchType: 'SUGGESTED',
          confidence: bestMatch.confidence,
          status: 'PENDING',
        });
        suggestions++;
      } else {
        unmatched++;
      }
    }

    return { matched, suggestions, unmatched };
  }

  /**
   * Create a reconciliation
   */
  static async createReconciliation(data: {
    bankTransactionId: string;
    paymentId?: string;
    matchType: MatchType;
    confidence: number;
    status: ReconciliationStatus;
    matchedBy?: string;
    notes?: string;
  }) {
    const reconciliation = await prisma.reconciliation.create({
      data: {
        bankTransactionId: data.bankTransactionId,
        paymentId: data.paymentId,
        matchType: data.matchType,
        confidence: data.confidence,
        status: data.status,
        matchedBy: data.matchedBy,
        notes: data.notes,
      },
      include: {
        bankTransaction: true,
        payment: {
          include: {
            invoice: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });

    // Mark bank transaction as reconciled if confirmed
    if (data.status === 'CONFIRMED') {
      await prisma.bankTransaction.update({
        where: { id: data.bankTransactionId },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
        },
      });
    }

    return reconciliation;
  }

  /**
   * Manual match
   */
  static async manualMatch(
    bankTransactionId: string,
    paymentId: string,
    userId: string,
    notes?: string
  ) {
    // Check if bank transaction already has reconciliation
    const existing = await prisma.reconciliation.findFirst({
      where: { bankTransactionId },
    });

    if (existing && existing.status === 'CONFIRMED') {
      throw new Error('Bank transaction is already reconciled');
    }

    // Delete existing pending reconciliation
    if (existing) {
      await prisma.reconciliation.delete({
        where: { id: existing.id },
      });
    }

    // Create manual reconciliation
    const reconciliation = await this.createReconciliation({
      bankTransactionId,
      paymentId,
      matchType: 'MANUAL',
      confidence: 100,
      status: 'CONFIRMED',
      matchedBy: userId,
      notes,
    });

    return reconciliation;
  }

  /**
   * Confirm suggested match
   */
  static async confirmMatch(reconciliationId: string, userId: string) {
    const reconciliation = await prisma.reconciliation.findUnique({
      where: { id: reconciliationId },
    });

    if (!reconciliation) {
      throw new Error('Reconciliation not found');
    }

    if (reconciliation.status === 'CONFIRMED') {
      throw new Error('Reconciliation already confirmed');
    }

    // Update reconciliation
    const updated = await prisma.reconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: 'CONFIRMED',
        matchedBy: userId,
      },
    });

    // Mark bank transaction as reconciled
    await prisma.bankTransaction.update({
      where: { id: reconciliation.bankTransactionId },
      data: {
        reconciled: true,
        reconciledAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Reject suggested match
   */
  static async rejectMatch(reconciliationId: string, userId: string) {
    const reconciliation = await prisma.reconciliation.findUnique({
      where: { id: reconciliationId },
    });

    if (!reconciliation) {
      throw new Error('Reconciliation not found');
    }

    // Update reconciliation
    const updated = await prisma.reconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: 'REJECTED',
        matchedBy: userId,
      },
    });

    return updated;
  }

  /**
   * Unmatch reconciliation
   */
  static async unmatch(reconciliationId: string, userId: string) {
    const reconciliation = await prisma.reconciliation.findUnique({
      where: { id: reconciliationId },
    });

    if (!reconciliation) {
      throw new Error('Reconciliation not found');
    }

    // Mark bank transaction as not reconciled
    await prisma.bankTransaction.update({
      where: { id: reconciliation.bankTransactionId },
      data: {
        reconciled: false,
        reconciledAt: null,
      },
    });

    // Delete reconciliation
    await prisma.reconciliation.delete({
      where: { id: reconciliationId },
    });

    return reconciliation;
  }

  /**
   * Get reconciliations
   */
  static async getReconciliations(filters: {
    status?: ReconciliationStatus;
    importBatch?: string;
  } = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.importBatch) {
      where.bankTransaction = {
        importBatch: filters.importBatch,
      };
    }

    const reconciliations = await prisma.reconciliation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        bankTransaction: true,
        payment: {
          include: {
            invoice: {
              include: {
                client: {
                  select: { name: true },
                },
              },
            },
          },
        },
        matchedByUser: {
          select: { name: true, email: true },
        },
      },
    });

    return reconciliations.map((r) => ({
      ...r,
      bankTransaction: {
        ...r.bankTransaction,
        amount: r.bankTransaction.amount.toString(),
      },
      payment: r.payment
        ? {
            ...r.payment,
            amount: r.payment.amount.toString(),
          }
        : null,
    }));
  }

  /**
   * Get reconciliation statistics
   */
  static async getReconciliationStats() {
    const [total, reconciled, pending, unmatched] = await Promise.all([
      prisma.bankTransaction.count(),
      prisma.bankTransaction.count({
        where: { reconciled: true },
      }),
      prisma.reconciliation.count({
        where: { status: 'PENDING' },
      }),
      prisma.bankTransaction.count({
        where: { reconciled: false },
      }),
    ]);

    return {
      total,
      reconciled,
      pending,
      unmatched,
      reconciledPercentage:
        total > 0 ? ((reconciled / total) * 100).toFixed(1) : '0',
    };
  }
}