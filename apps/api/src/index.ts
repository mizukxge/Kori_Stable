import { buildServer } from './server.js';
import { registerRoutes } from './routes/index.js';
import { env } from '../../../config/env.js';

async function start() {
  try {
    // Build server with all middlewares
    const server = await buildServer();

    // Register all routes
    await registerRoutes(server);

    // Start listening
    await server.listen({ 
      port: env.API_PORT, 
      host: env.API_HOST 
    });

    console.log(`Ã°Å¸Å¡â‚¬ API server running on http://${env.API_HOST}:${env.API_PORT}`);
    console.log(`Ã°Å¸â€œÅ  Health check: http://localhost:${env.API_PORT}/healthz`);
    console.log(`Ã°Å¸â€Â Readiness check: http://localhost:${env.API_PORT}/readyz`);
    console.log(`Ã°Å¸â€œÂ¦ Version info: http://localhost:${env.API_PORT}/version`);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        try {
          await server.close();
          console.log('Ã¢Å“â€¦ Server closed successfully');
          process.exit(0);
        } catch (err) {
          console.error('Ã¢ÂÅ’ Error during shutdown:', err);
          process.exit(1);
        }
      });
    });

  } catch (err) {
    console.error('Ã¢ÂÅ’ Error starting server:', err);
    process.exit(1);
  }
}

start();