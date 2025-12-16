import { buildServer } from './server.js';
import { registerRoutes } from './routes/index.js';
import { env } from '../../../config/env.js';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle BigInt serialization for JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  try {
    // Initialize database migrations before starting server
    console.log('🔄 Initializing database...');
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      // Test connection and ensure migrations are applied
      await prisma.$executeRawUnsafe('SELECT 1');
      await prisma.$disconnect();
      console.log('✅ Database ready');
    } catch (dbError) {
      console.warn('⚠️  Database initialization warning:', dbError instanceof Error ? dbError.message : 'Unknown error');
      // Continue anyway - migrations might not be needed yet
    }

    // Build server with all middlewares
    const server = await buildServer();

    // Add hook to modify headers for PDF files before sending response
    server.addHook('onSend', async (request, reply, payload) => {
      // Check if this is a PDF file request
      if (request.url.includes('/uploads/') && request.url.endsWith('.pdf')) {
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', 'inline');
        // Don't override Access-Control headers - let CORS plugin handle it
        // Remove X-Frame-Options to allow iframe embedding
        reply.removeHeader('X-Frame-Options');
        // Set CSP to allow framing from localhost:3000
        reply.header('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000");
      }
      return payload;
    });

    // Serve uploaded files statically
    await server.register(fastifyStatic, {
      root: path.join(__dirname, '..', 'uploads'),
      prefix: '/uploads/',
      decorateReply: false
    });

    // Register all routes
    await registerRoutes(server);

    // Start listening
    await server.listen({ 
      port: env.API_PORT, 
      host: env.API_HOST 
    });

    console.log(`🚀 API server running on http://${env.API_HOST}:${env.API_PORT}`);
    console.log(`📁 Uploads served at http://localhost:${env.API_PORT}/uploads/`);
    console.log(`❤️  Health check: http://localhost:${env.API_PORT}/healthz`);
    console.log(`✅ Readiness check: http://localhost:${env.API_PORT}/readyz`);
    console.log(`📋 Version info: http://localhost:${env.API_PORT}/version`);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        try {
          await server.close();
          console.log('✅ Server closed successfully');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error during shutdown:', err);
          process.exit(1);
        }
      });
    });

  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
}

start();