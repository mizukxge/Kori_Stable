import { FastifyInstance } from 'fastify';
import { getMetrics, getMetricsJSON } from '../observability/metrics.js';

export async function metricsRoutes(fastify: FastifyInstance) {
  /**
   * GET /metrics
   * Prometheus metrics endpoint
   */
  fastify.get('/metrics', async (request, reply) => {
    try {
      const metrics = await getMetrics();
      
      reply.header('Content-Type', 'text/plain; version=0.0.4');
      return reply.send(metrics);
    } catch (error) {
      request.log.error(error, 'Error fetching metrics');
      throw error;
    }
  });

  /**
   * GET /metrics.json
   * Metrics in JSON format
   */
  fastify.get('/metrics.json', async (request, reply) => {
    try {
      const metrics = await getMetricsJSON();
      
      return reply.status(200).send({
        success: true,
        data: metrics,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching metrics JSON');
      throw error;
    }
  });
}