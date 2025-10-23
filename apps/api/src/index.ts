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
    // Build server with all middlewares
    const server = await buildServer();

    // Serve uploaded files statically
    await server.register(fastifyStatic, {
      root: path.join(__dirname, '..', 'uploads'),
      prefix: '/uploads/',
      decorateReply: false,
      setHeaders: (res: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      }
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