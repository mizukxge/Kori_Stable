import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import cookie from '@fastify/cookie';
import { env } from '../../../config/env.js';
import { metricsMiddleware } from './observability/metricsMiddleware.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    disableRequestLogging: false,
    requestIdLogLabel: 'reqId',
  });

  // Register security middleware - Helmet
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Content-Length'],
  });

  // Register cookie plugin
  await fastify.register(cookie, {
    secret: env.SESSION_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  });
  // Register metrics middleware to track all requests
  fastify.addHook('onRequest', metricsMiddleware);


  // Register rate limiting
  await fastify.register(rateLimit, {
    max: 100, // max requests
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${context.after}`,
      };
    },
  });

  // Register sensible plugin for better error handling
  await fastify.register(sensible);

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    // Log error
    request.log.error({
      err: error,
      reqId: request.id,
      url: request.url,
      method: request.method,
    }, 'Request error');

    // Don't leak error details in production
    const isProduction = env.NODE_ENV === 'production';
    const statusCode = error.statusCode || 500;
    
    reply.status(statusCode).send({
      statusCode,
      error: error.name || 'Internal Server Error',
      message: isProduction && statusCode === 500 
        ? 'An internal server error occurred' 
        : error.message,
      ...((!isProduction && error.stack) && { stack: error.stack }),
    });
  });

  // Not found handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  return fastify;
}