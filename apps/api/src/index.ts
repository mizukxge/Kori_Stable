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

    console.log(`ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ API server running on http://${env.API_HOST}:${env.API_PORT}`);
    console.log(`ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â  Health check: http://localhost:${env.API_PORT}/healthz`);
    console.log(`ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â Readiness check: http://localhost:${env.API_PORT}/readyz`);
    console.log(`ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¦ Version info: http://localhost:${env.API_PORT}/version`);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        try {
          await server.close();
          console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Server closed successfully');
          process.exit(0);
        } catch (err) {
          console.error('ÃƒÂ¢Ã‚ÂÃ…â€™ Error during shutdown:', err);
          process.exit(1);
        }
      });
    });

  } catch (err) {
    console.error('ÃƒÂ¢Ã‚ÂÃ…â€™ Error starting server:', err);
    process.exit(1);
  }
}

start();