import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Package version from package.json
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);

export async function healthRoutes(fastify: FastifyInstance) {
  // Liveness probe - is the app running?
  fastify.get('/healthz', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness probe - is the app ready to serve traffic?
  fastify.get('/readyz', async (_request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      
      return reply.status(200).send({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'connected',
        },
      });
    } catch (error) {
      return reply.status(503).send({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'disconnected',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Version information
  fastify.get('/version', async (_request, reply) => {
    return reply.status(200).send({
      name: packageJson.name,
      version: packageJson.version,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });
}