import { FastifyInstance } from 'fastify';

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
}
