import { PrismaClient, RecordCategory, VerificationStatus } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

const ARCHIVE_DIR = path.join(process.cwd(), 'records-archive');

export interface ArchiveRecordData {
  filename: string;
  filePath: string;
  description?: string;
  category: RecordCategory;
  tags?: string[];
  retentionPolicyId?: string;
  clientId?: string;
  legalHold?: boolean;
  legalHoldReason?: string;
}

export class RecordService {
  /**
   * Initialize archive storage
   */
  static async initializeStorage(): Promise<void> {
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  }

  /**
   * Calculate SHA256 hash of a file
   */
  static async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  /**
   * Generate record number (e.g., REC-2025-001)
   */
  static async generateRecordNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}`;

    const count = await prisma.record.count({
      where: {
        recordNumber: {
          startsWith: prefix,
        },
      },
    });

    const number = (count + 1).toString().padStart(3, '0');
    return `${prefix}-${number}`;
  }

  /**
   * Calculate retention date based on policy
   */
  static calculateRetentionDate(
    policy: { retentionYears: number; retentionMonths: number; retentionDays: number },
    startDate: Date = new Date()
  ): Date {
    const retainUntil = new Date(startDate);
    retainUntil.setFullYear(retainUntil.getFullYear() + policy.retentionYears);
    retainUntil.setMonth(retainUntil.getMonth() + policy.retentionMonths);
    retainUntil.setDate(retainUntil.getDate() + policy.retentionDays);
    return retainUntil;
  }

  /**
   * Archive a file to WORM storage
   */
  static async archiveRecord(data: ArchiveRecordData, userId: string) {
    await this.initializeStorage();

    // Verify file exists
    try {
      await fs.access(data.filePath);
    } catch (error) {
      throw new Error(`File not found: ${data.filePath}`);
    }

    // Get file stats
    const stats = await fs.stat(data.filePath);

    // Calculate hash
    const hash = await this.calculateFileHash(data.filePath);

    // Check for duplicate hash
    const duplicate = await prisma.record.findUnique({
      where: { hash },
    });

    if (duplicate) {
      throw new Error(
        `File already archived: ${duplicate.recordNumber} (duplicate hash)`
      );
    }

    // Generate record number
    const recordNumber = await this.generateRecordNumber();

    // Create archive filename (hash-based to ensure uniqueness)
    const ext = path.extname(data.filename);
    const archiveFilename = `${hash}${ext}`;
    const archivePath = path.join(ARCHIVE_DIR, archiveFilename);

    // Copy file to archive (immutable storage)
    await fs.copyFile(data.filePath, archivePath);

    // Make file read-only
    await fs.chmod(archivePath, 0o444);

    // Get retention policy if specified
    let retainUntil: Date | undefined;
    if (data.retentionPolicyId) {
      const policy = await prisma.retentionPolicy.findUnique({
        where: { id: data.retentionPolicyId },
      });

      if (policy) {
        retainUntil = this.calculateRetentionDate(policy);
      }
    }

    // Create record
    const record = await prisma.record.create({
      data: {
        recordNumber,
        filename: data.filename,
        originalPath: data.filePath,
        archivePath,
        mimeType: this.getMimeType(data.filename),
        size: BigInt(stats.size),
        hash,
        hashAlgorithm: 'SHA256',
        description: data.description,
        category: data.category,
        tags: data.tags || [],
        retentionPolicyId: data.retentionPolicyId,
        retainUntil,
        legalHold: data.legalHold || false,
        legalHoldReason: data.legalHoldReason,
        legalHoldBy: data.legalHold ? userId : undefined,
        legalHoldAt: data.legalHold ? new Date() : undefined,
        clientId: data.clientId,
        archivedBy: userId,
        verificationStatus: 'PENDING',
      },
      include: {
        retentionPolicy: true,
      },
    });

    // Create initial verification record
    await prisma.recordHash.create({
      data: {
        recordId: record.id,
        computedHash: hash,
        expectedHash: hash,
        matched: true,
        fileExists: true,
        fileSize: BigInt(stats.size),
        verifiedBy: userId,
      },
    });

    // Update verification status
    await prisma.record.update({
      where: { id: record.id },
      data: {
        lastVerifiedAt: new Date(),
        verificationStatus: 'VERIFIED',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'ARCHIVE',
        entityType: 'Record',
        entityId: record.id,
        userId,
        metadata: {
          recordNumber,
          filename: data.filename,
          hash,
          size: stats.size,
        },
      },
    });

    return record;
  }

  /**
   * Verify hash integrity of a record
   */
  static async verifyRecord(recordId: string, userId?: string) {
    const record = await prisma.record.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new Error('Record not found');
    }

    let fileExists = false;
    let fileSize: bigint | undefined;
    let computedHash = '';
    let matched = false;
    let error: string | undefined;

    try {
      // Check if file exists
      await fs.access(record.archivePath);
      fileExists = true;

      // Get file size
      const stats = await fs.stat(record.archivePath);
      fileSize = BigInt(stats.size);

      // Calculate current hash
      computedHash = await this.calculateFileHash(record.archivePath);

      // Compare hashes
      matched = computedHash === record.hash;

      // Check file size
      if (fileSize !== record.size) {
        error = `File size mismatch: expected ${record.size}, got ${fileSize}`;
        matched = false;
      }
    } catch (err) {
      fileExists = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Create verification record
    const verification = await prisma.recordHash.create({
      data: {
        recordId: record.id,
        computedHash: computedHash || 'N/A',
        expectedHash: record.hash,
        matched,
        fileExists,
        fileSize,
        verifiedBy: userId,
        error,
      },
    });

    // Update record verification status
    const verificationStatus: VerificationStatus = !fileExists
      ? 'ERROR'
      : matched
      ? 'VERIFIED'
      : 'FAILED';

    await prisma.record.update({
      where: { id: recordId },
      data: {
        lastVerifiedAt: new Date(),
        verificationStatus,
      },
    });

    // Create audit log if verification failed
    if (!matched || !fileExists) {
      await prisma.auditLog.create({
        data: {
          action: 'VERIFY_FAILED',
          entityType: 'Record',
          entityId: record.id,
          userId: userId || 'system',
          metadata: {
            recordNumber: record.recordNumber,
            matched,
            fileExists,
            error,
          },
        },
      });
    }

    return {
      record,
      verification,
      status: verificationStatus,
    };
  }

  /**
   * Verify all records
   */
  static async verifyAllRecords(userId?: string) {
    const records = await prisma.record.findMany({
      where: {
        disposedAt: null, // Only verify non-disposed records
      },
    });

    const results = {
      total: records.length,
      verified: 0,
      failed: 0,
      errors: 0,
    };

    for (const record of records) {
      try {
        const result = await this.verifyRecord(record.id, userId);
        if (result.status === 'VERIFIED') {
          results.verified++;
        } else if (result.status === 'FAILED') {
          results.failed++;
        } else {
          results.errors++;
        }
      } catch (error) {
        results.errors++;
      }
    }

    return results;
  }

  /**
   * List records
   */
  static async listRecords(filters: {
    category?: RecordCategory;
    verificationStatus?: VerificationStatus;
    legalHold?: boolean;
    clientId?: string;
  } = {}) {
    const where: any = {
      disposedAt: null, // Exclude disposed records
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.verificationStatus) {
      where.verificationStatus = filters.verificationStatus;
    }

    if (filters.legalHold !== undefined) {
      where.legalHold = filters.legalHold;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    const records = await prisma.record.findMany({
      where,
      orderBy: { archivedAt: 'desc' },
      include: {
        retentionPolicy: true,
        client: {
          select: { name: true },
        },
        archivedByUser: {
          select: { name: true },
        },
        _count: {
          select: { verifications: true },
        },
      },
    });

    return records;
  }

  /**
   * Get record by ID
   */
  static async getRecordById(id: string) {
    const record = await prisma.record.findUnique({
      where: { id },
      include: {
        retentionPolicy: true,
        client: true,
        archivedByUser: {
          select: { name: true, email: true },
        },
        legalHoldByUser: {
          select: { name: true },
        },
        verifications: {
          orderBy: { verifiedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!record) {
      throw new Error('Record not found');
    }

    return record;
  }

  /**
   * Place legal hold on record
   */
  static async placeLegalHold(
    recordId: string,
    userId: string,
    reason: string
  ) {
    const record = await this.getRecordById(recordId);

    if (record.legalHold) {
      throw new Error('Record already has legal hold');
    }

    const updated = await prisma.record.update({
      where: { id: recordId },
      data: {
        legalHold: true,
        legalHoldReason: reason,
        legalHoldBy: userId,
        legalHoldAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'LEGAL_HOLD',
        entityType: 'Record',
        entityId: recordId,
        userId,
        metadata: {
          recordNumber: record.recordNumber,
          reason,
        },
      },
    });

    return updated;
  }

  /**
   * Release legal hold
   */
  static async releaseLegalHold(recordId: string, userId: string) {
    const record = await this.getRecordById(recordId);

    if (!record.legalHold) {
      throw new Error('Record does not have legal hold');
    }

    const updated = await prisma.record.update({
      where: { id: recordId },
      data: {
        legalHold: false,
        legalHoldReason: null,
        legalHoldBy: null,
        legalHoldAt: null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'LEGAL_HOLD_RELEASE',
        entityType: 'Record',
        entityId: recordId,
        userId,
        metadata: {
          recordNumber: record.recordNumber,
        },
      },
    });

    return updated;
  }

  /**
   * Dispose expired records (no legal hold)
   */
  static async disposeExpiredRecords(userId: string) {
    const now = new Date();

    // Find expired records without legal hold
    const expired = await prisma.record.findMany({
      where: {
        retainUntil: {
          lt: now,
        },
        legalHold: false,
        disposedAt: null,
      },
    });

    const disposed = [];

    for (const record of expired) {
      // Delete file
      try {
        await fs.unlink(record.archivePath);
      } catch (error) {
        console.error(`Failed to delete file: ${record.archivePath}`, error);
      }

      // Mark as disposed
      await prisma.record.update({
        where: { id: record.id },
        data: {
          disposedAt: new Date(),
          disposedBy: userId,
          disposalReason: 'Retention period expired',
        },
      });

      disposed.push(record);
    }

    return disposed;
  }

  /**
   * Get records statistics
   */
  static async getRecordStats() {
    const [total, byCategory, byStatus, withLegalHold, expired] = await Promise.all([
      prisma.record.count({
        where: { disposedAt: null },
      }),
      prisma.record.groupBy({
        by: ['category'],
        where: { disposedAt: null },
        _count: true,
      }),
      prisma.record.groupBy({
        by: ['verificationStatus'],
        where: { disposedAt: null },
        _count: true,
      }),
      prisma.record.count({
        where: {
          legalHold: true,
          disposedAt: null,
        },
      }),
      prisma.record.count({
        where: {
          retainUntil: {
            lt: new Date(),
          },
          legalHold: false,
          disposedAt: null,
        },
      }),
    ]);

    return {
      total,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.verificationStatus] = item._count;
        return acc;
      }, {} as Record<string, number>),
      withLegalHold,
      expired,
    };
  }

  /**
   * Get MIME type from filename
   */
  private static getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}