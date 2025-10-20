import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: 'http://localhost:3000'
});

fastify.get('/api/hello', async (_request, _reply) => {
  return { message: 'Hello from Kori API!', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 API running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
