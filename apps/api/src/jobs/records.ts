#!/usr/bin/env node
/**
 * Records Verification Job
 * 
 * Verifies hash integrity of all archived records.
 * Can be run manually or via cron.
 * 
 * Usage:
 *   pnpm tsx apps/api/src/jobs/records.ts --verify
 *   pnpm tsx apps/api/src/jobs/records.ts --dispose
 *   pnpm tsx apps/api/src/jobs/records.ts --stats
 */

import { RecordService } from '../services/record.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JobResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Verify all records
 */
async function verifyRecords(): Promise<JobResult> {
  console.log('🔍 Starting record verification...\n');

  try {
    const results = await RecordService.verifyAllRecords('system');

    console.log('✅ Verification completed:\n');
    console.log(`   Total records: ${results.total}`);
    console.log(`   ✓ Verified: ${results.verified}`);
    console.log(`   ✗ Failed: ${results.failed}`);
    console.log(`   ⚠ Errors: ${results.errors}`);

    if (results.failed > 0) {
      console.log('\n⚠️  WARNING: Some records failed verification (potential tampering)');
      
      // Get failed records
      const failedRecords = await prisma.record.findMany({
        where: {
          verificationStatus: 'FAILED',
        },
        select: {
          recordNumber: true,
          filename: true,
          lastVerifiedAt: true,
        },
      });

      console.log('\nFailed records:');
      failedRecords.forEach((record) => {
        console.log(`   - ${record.recordNumber}: ${record.filename}`);
      });
    }

    if (results.errors > 0) {
      console.log('\n⚠️  WARNING: Some records encountered errors during verification');
      
      // Get error records
      const errorRecords = await prisma.record.findMany({
        where: {
          verificationStatus: 'ERROR',
        },
        select: {
          recordNumber: true,
          filename: true,
          lastVerifiedAt: true,
        },
      });

      console.log('\nError records:');
      errorRecords.forEach((record) => {
        console.log(`   - ${record.recordNumber}: ${record.filename}`);
      });
    }

    return {
      success: results.failed === 0 && results.errors === 0,
      message: 'Verification completed',
      data: results,
    };
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Dispose expired records
 */
async function disposeExpiredRecords(): Promise<JobResult> {
  console.log('🗑️  Starting disposal of expired records...\n');

  try {
    const disposed = await RecordService.disposeExpiredRecords('system');

    console.log(`✅ Disposed ${disposed.length} expired records\n`);

    if (disposed.length > 0) {
      console.log('Disposed records:');
      disposed.forEach((record) => {
        console.log(`   - ${record.recordNumber}: ${record.filename}`);
      });
    }

    return {
      success: true,
      message: `Disposed ${disposed.length} records`,
      data: { count: disposed.length, records: disposed },
    };
  } catch (error) {
    console.error('❌ Disposal failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Show record statistics
 */
async function showStats(): Promise<JobResult> {
  console.log('📊 Record Archive Statistics\n');

  try {
    const stats = await RecordService.getRecordStats();

    console.log(`Total Active Records: ${stats.total}\n`);

    console.log('By Category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    console.log('\nBy Verification Status:');
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log(`\nRecords with Legal Hold: ${stats.withLegalHold}`);
    console.log(`Expired (Ready for Disposal): ${stats.expired}`);

    // Get verification history
    const recentVerifications = await prisma.recordHash.findMany({
      orderBy: { verifiedAt: 'desc' },
      take: 10,
      include: {
        record: {
          select: {
            recordNumber: true,
            filename: true,
          },
        },
      },
    });

    if (recentVerifications.length > 0) {
      console.log('\nRecent Verifications:');
      recentVerifications.forEach((verification) => {
        const status = verification.matched ? '✓' : '✗';
        console.log(
          `   ${status} ${verification.record.recordNumber} - ${new Date(
            verification.verifiedAt
          ).toLocaleString()}`
        );
      });
    }

    return {
      success: true,
      message: 'Statistics retrieved',
      data: stats,
    };
  } catch (error) {
    console.error('❌ Failed to get statistics:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Show usage
 */
function showUsage() {
  console.log('Records Verification Job\n');
  console.log('Usage:');
  console.log('  pnpm tsx apps/api/src/jobs/records.ts --verify    Verify all record hashes');
  console.log('  pnpm tsx apps/api/src/jobs/records.ts --dispose   Dispose expired records');
  console.log('  pnpm tsx apps/api/src/jobs/records.ts --stats     Show archive statistics');
  console.log('  pnpm tsx apps/api/src/jobs/records.ts --help      Show this help\n');
  console.log('Examples:');
  console.log('  # Verify all records');
  console.log('  pnpm tsx apps/api/src/jobs/records.ts --verify\n');
  console.log('  # Schedule with cron (daily at 2 AM)');
  console.log('  0 2 * * * cd /path/to/app && pnpm tsx apps/api/src/jobs/records.ts --verify\n');
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  let result: JobResult;

  if (args.includes('--verify')) {
    result = await verifyRecords();
  } else if (args.includes('--dispose')) {
    result = await disposeExpiredRecords();
  } else if (args.includes('--stats')) {
    result = await showStats();
  } else {
    console.error('❌ Unknown command\n');
    showUsage();
    process.exit(1);
  }

  await prisma.$disconnect();

  if (!result.success) {
    console.error(`\n❌ Job failed: ${result.message}`);
    process.exit(1);
  }

  console.log('\n✅ Job completed successfully');
  process.exit(0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { verifyRecords, disposeExpiredRecords, showStats };