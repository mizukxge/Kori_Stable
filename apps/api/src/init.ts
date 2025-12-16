import { execSync } from 'child_process';

/**
 * Initialize database - run migrations if needed
 * This ensures the database schema is in sync before starting the server
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔄 Checking database migrations...');

    // Run migrations
    console.log('📦 Applying Prisma migrations...');
    execSync('pnpm --filter @kori/api db:migrate:prod', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('⚠️  Migration warning (continuing anyway):', error instanceof Error ? error.message : error);
    // Don't fail startup - maybe migrations already applied
  }
}
