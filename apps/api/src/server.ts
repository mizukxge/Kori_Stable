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

  // Register CORS FIRST - before Helmet
  const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Content-Length'],
    optionsSuccessStatus: 200,
  });

  // Explicit credentials header hook - runs AFTER route handlers
  // This ensures the header is set even if CORS plugin has timing issues
  fastify.addHook('onSend', async (request, reply, payload) => {
    const origin = request.headers.origin as string | undefined;
    const corsHeader = reply.getHeader('Access-Control-Allow-Origin');

    // If CORS allowed this origin but forgot credentials header, add it
    if (origin && corsHeader === origin && allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Credentials', 'true');
    }

    return payload;
  });

  // Register security middleware - Helmet AFTER CORS
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameSrc: ["'self'"],
        objectSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    // Disable X-Frame-Options to allow iframe embedding (we use CSP frame-ancestors instead)
    frameguard: false,
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

    // Ensure CORS credentials header is set for error responses too
    const origin = request.headers.origin as string | undefined;
    if (origin && allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Credentials', 'true');
    }

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
    // Ensure CORS credentials header is set for 404 responses too
    const origin = request.headers.origin as string | undefined;
    if (origin && allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Credentials', 'true');
    }

    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  return fastify;
}