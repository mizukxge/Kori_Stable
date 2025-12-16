import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function debugRoutes(fastify: FastifyInstance) {
  /**
   * GET /debug/env
   * Check environment variables and database connectivity
   */
  fastify.get('/debug/env', async (request, reply) => {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const nodeEnv = process.env.NODE_ENV || 'NOT SET';

    return reply.send({
      status: 'ok',
      environment: {
        NODE_ENV: nodeEnv,
        DATABASE_URL_PRESENT: dbUrl !== 'NOT SET',
        DATABASE_URL_PREFIX: dbUrl === 'NOT SET' ? 'NOT SET' : dbUrl.substring(0, 30) + '...',
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'NOT SET',
      },
    });
  });

  /**
   * GET /debug/db-tables
   * List all tables in the database
   */
  fastify.get('/debug/db-tables', async (request, reply) => {
    try {
      const result = await prisma.$queryRaw`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      ` as Array<{ table_name: string }>;

      return reply.send({
        status: 'ok',
        tableCount: result.length,
        tables: result.map((r) => r.table_name),
      });
    } catch (error) {
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to query database',
      });
    }
  });
}
