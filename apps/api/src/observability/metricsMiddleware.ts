import { FastifyRequest, FastifyReply } from 'fastify';
import { httpRequestsTotal, httpRequestDuration, httpErrorsTotal } from './metrics.js';

/**
 * Middleware to track HTTP request metrics
 */
export async function metricsMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const startTime = process.hrtime.bigint();

  // Hook to track when response is sent
  reply.raw.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationSeconds = Number(endTime - startTime) / 1e9;

    const method = request.method;
    const route = request.routeOptions?.url || request.url;
    const statusCode = reply.statusCode.toString();

    // Track total requests
    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    // Track request duration
    httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      durationSeconds
    );

    // Track errors (4xx and 5xx)
    if (reply.statusCode >= 400) {
      const errorType = reply.statusCode >= 500 ? 'server_error' : 'client_error';
      
      httpErrorsTotal.inc({
        method,
        route,
        status_code: statusCode,
        error_type: errorType,
      });
    }
  });
}