import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface BankTransactionRow {
  date: string;
  description: string;
  amount: string;
  reference?: string;
  bankAccount?: string;
  accountNumber?: string;
}

export interface ParsedTransaction {
  transactionDate: Date;
  description: string;
  amount: number;
  currency: string;
  reference?: string;
  bankAccount?: string;
  accountNumber?: string;
  rawData: any;
}

export interface BankFormat {
  name: string;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  referenceColumn?: string;
  dateFormat?: string;
}

// Common bank CSV formats
export const BANK_FORMATS: Record<string, BankFormat> = {
  GENERIC: {
    name: 'Generic',
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    referenceColumn: 'Reference',
  },
  CHASE: {
    name: 'Chase Bank',
    dateColumn: 'Posting Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    referenceColumn: 'Check or Slip #',
  },
  BOFA: {
    name: 'Bank of America',
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    referenceColumn: 'Reference Number',
  },
  WELLS_FARGO: {
    name: 'Wells Fargo',
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
  },
};

export class BankImportService {
  /**
   * Parse CSV file content
   */
  static parseCSV(csvContent: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`CSV parse error: ${error.message}`));
        },
      });
    });
  }

  /**
   * Detect bank format from CSV headers
   */
  static detectFormat(headers: string[]): BankFormat {
    const headerLower = headers.map((h) => h.toLowerCase().trim());

    // Try to match against known formats
    for (const [key, format] of Object.entries(BANK_FORMATS)) {
      const dateMatch = headerLower.some((h) =>
        h.includes(format.dateColumn.toLowerCase())
      );
      const descMatch = headerLower.some((h) =>
        h.includes(format.descriptionColumn.toLowerCase())
      );
      const amountMatch = headerLower.some((h) =>
        h.includes(format.amountColumn.toLowerCase())
      );

      if (dateMatch && descMatch && amountMatch) {
        return format;
      }
    }

    // Default to generic format
    return BANK_FORMATS.GENERIC;
  }

  /**
   * Parse date string to Date object
   */
  static parseDate(dateString: string): Date {
    // Try common date formats
    const formats = [
      // MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // YYYY-MM-DD
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    ];

    // Try ISO format first
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try regex formats
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        // Assume MM/DD/YYYY for now
        const [, part1, part2, part3] = match;
        const date = new Date(`${part1}/${part2}/${part3}`);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    throw new Error(`Unable to parse date: ${dateString}`);
  }

  /**
   * Parse amount string to number
   */
  static parseAmount(amountString: string): number {
    // Remove currency symbols, commas, and whitespace
    const cleaned = amountString
      .replace(/[$£€,\s]/g, '')
      .replace(/[()]/g, '-') // Handle negative amounts in parentheses
      .trim();

    const amount = parseFloat(cleaned);

    if (isNaN(amount)) {
      throw new Error(`Unable to parse amount: ${amountString}`);
    }

    return amount;
  }

  /**
   * Parse CSV rows into transactions
   */
  static parseTransactions(
    rows: any[],
    format?: BankFormat
  ): ParsedTransaction[] {
    if (rows.length === 0) {
      throw new Error('No data rows found in CSV');
    }

    // Detect format if not provided
    const headers = Object.keys(rows[0]);
    const bankFormat = format || this.detectFormat(headers);

    const transactions: ParsedTransaction[] = [];

    for (const row of rows) {
      try {
        // Find columns (case-insensitive)
        const getColumn = (columnName: string): string | undefined => {
          const key = Object.keys(row).find(
            (k) => k.toLowerCase().trim() === columnName.toLowerCase().trim()
          );
          return key ? row[key] : undefined;
        };

        const dateStr = getColumn(bankFormat.dateColumn);
        const description = getColumn(bankFormat.descriptionColumn);
        const amountStr = getColumn(bankFormat.amountColumn);
        const reference = bankFormat.referenceColumn
          ? getColumn(bankFormat.referenceColumn)
          : undefined;

        if (!dateStr || !description || !amountStr) {
          console.warn('Skipping row with missing required fields:', row);
          continue;
        }

        const transactionDate = this.parseDate(dateStr);
        const amount = this.parseAmount(amountStr);

        transactions.push({
          transactionDate,
          description: description.trim(),
          amount,
          currency: 'GBP',
          reference: reference?.trim(),
          rawData: row,
        });
      } catch (error) {
        console.error('Error parsing row:', error, row);
        // Continue processing other rows
      }
    }

    return transactions;
  }

  /**
   * Import transactions from CSV
   */
  static async importCSV(
    csvContent: string,
    format?: BankFormat
  ): Promise<{
    importBatch: string;
    imported: number;
    duplicates: number;
    errors: number;
  }> {
    // Parse CSV
    const rows = await this.parseCSV(csvContent);

    if (rows.length === 0) {
      throw new Error('No transactions found in CSV');
    }

    // Parse transactions
    const transactions = this.parseTransactions(rows, format);

    if (transactions.length === 0) {
      throw new Error('No valid transactions could be parsed from CSV');
    }

    // Generate import batch ID
    const importBatch = uuidv4();

    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    // Import each transaction
    for (const transaction of transactions) {
      try {
        // Check for duplicates (same date, amount, description)
        const existing = await prisma.bankTransaction.findFirst({
          where: {
            transactionDate: transaction.transactionDate,
            amount: new Decimal(transaction.amount.toFixed(2)),
            description: transaction.description,
          },
        });

        if (existing) {
          duplicates++;
          continue;
        }

        // Create bank transaction
        await prisma.bankTransaction.create({
          data: {
            transactionDate: transaction.transactionDate,
            description: transaction.description,
            amount: new Decimal(transaction.amount.toFixed(2)),
            currency: transaction.currency,
            reference: transaction.reference,
            bankAccount: transaction.bankAccount,
            accountNumber: transaction.accountNumber,
            importBatch,
            rawData: transaction.rawData,
          },
        });

        imported++;
      } catch (error) {
        console.error('Error importing transaction:', error);
        errors++;
      }
    }

    return {
      importBatch,
      imported,
      duplicates,
      errors,
    };
  }

  /**
   * Get import batches
   */
  static async getImportBatches() {
    const batches = await prisma.bankTransaction.groupBy({
      by: ['importBatch'],
      _count: {
        id: true,
      },
      _min: {
        createdAt: true,
      },
      _sum: {
        amount: true,
      },
    });

    return batches.map((batch) => ({
      importBatch: batch.importBatch,
      transactionCount: batch._count.id,
      importedAt: batch._min.createdAt,
      totalAmount: batch._sum.amount?.toString() || '0',
    }));
  }

  /**
   * Get transactions by import batch
   */
  static async getTransactionsByBatch(importBatch: string) {
    const transactions = await prisma.bankTransaction.findMany({
      where: { importBatch },
      orderBy: { transactionDate: 'desc' },
      include: {
        reconciliation: {
          include: {
            payment: {
              include: {
                invoice: {
                  select: {
                    invoiceNumber: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return transactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
    }));
  }

  /**
   * Delete import batch
   */
  static async deleteImportBatch(importBatch: string) {
    // Delete all transactions in batch
    const result = await prisma.bankTransaction.deleteMany({
      where: { importBatch },
    });

    return result.count;
  }

  /**
   * Get unreconciled transactions
   */
  static async getUnreconciledTransactions() {
    const transactions = await prisma.bankTransaction.findMany({
      where: { reconciled: false },
      orderBy: { transactionDate: 'desc' },
    });

    return transactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
    }));
  }

  /**
   * Preview CSV without importing
   */
  static async previewCSV(
    csvContent: string,
    format?: BankFormat
  ): Promise<{
    format: BankFormat;
    sampleRows: any[];
    parsedTransactions: ParsedTransaction[];
    totalRows: number;
  }> {
    const rows = await this.parseCSV(csvContent);

    if (rows.length === 0) {
      throw new Error('No data found in CSV');
    }

    // Detect format
    const headers = Object.keys(rows[0]);
    const detectedFormat = format || this.detectFormat(headers);

    // Parse first 10 transactions as preview
    const sampleRows = rows.slice(0, 10);
    const parsedTransactions = this.parseTransactions(sampleRows, detectedFormat);

    return {
      format: detectedFormat,
      sampleRows,
      parsedTransactions,
      totalRows: rows.length,
    };
  }
}