import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
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

  // Parse CORS origins
  const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());

  // Debug: Log environment and configuration
  console.log('🔧 [SERVER CONFIG] Initialization');
  console.log('🔧 [SERVER CONFIG] NODE_ENV:', env.NODE_ENV);
  console.log('🔧 [SERVER CONFIG] SESSION_COOKIE_SECURE:', env.SESSION_COOKIE_SECURE);
  console.log('🔧 [SERVER CONFIG] SESSION_COOKIE_SAMESITE:', env.SESSION_COOKIE_SAMESITE);
  console.log('🔧 [SERVER CONFIG] CORS_ORIGIN:', allowedOrigins.join(', '));
  console.log('🔧 [SERVER CONFIG] API_HOST:', env.API_HOST, 'API_PORT:', env.API_PORT);

  // Manual CORS handling via preHandler hook (instead of @fastify/cors plugin)
  // This ensures Access-Control-Allow-Credentials header is set correctly
  fastify.addHook('preHandler', async (request, reply) => {
    const origin = request.headers.origin as string | undefined;
    const requestMethod = request.method;

    // Debug logging
    console.log(`🔍 [CORS] ${requestMethod} ${request.url}`);
    console.log(`🔍 [CORS] Origin: ${origin}`);
    console.log(`🔍 [CORS] Allowed: ${allowedOrigins.join(', ')}`);
    console.log(`🔍 [CORS] Match: ${origin && allowedOrigins.includes(origin) ? '✓ YES' : '✗ NO'}`);
    console.log(`🔍 [CORS] Cookie header: ${request.headers.cookie ? '✓ Present' : '✗ Missing'}`);

    // Set CORS headers for allowed origins
    if (origin && allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      reply.header('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
      reply.header('Vary', 'Origin');
      console.log(`✅ [CORS] Headers set for ${origin}`);
    } else if (origin) {
      console.warn(`⚠️ [CORS] Origin ${origin} NOT in allowed list`);
    }

    // Handle OPTIONS (preflight) requests
    if (requestMethod === 'OPTIONS') {
      return reply.code(200).send();
    }
  });

  // Register metrics middleware to track all requests
  fastify.addHook('onRequest', metricsMiddleware);

  // Register security middleware - Helmet AFTER CORS so it doesn't interfere
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http://localhost:*'],
        frameSrc: ["'self'"],
        objectSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    // Disable X-Frame-Options to allow iframe embedding (we use CSP frame-ancestors instead)
    frameguard: false,
    // Don't set CORS headers - let @fastify/cors plugin handle it
    permittedCrossDomainPolicies: false,
  });

  // Register cookie plugin
  const cookieConfig = {
    secret: env.SESSION_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: env.SESSION_COOKIE_SECURE || env.NODE_ENV === 'production',
      sameSite: env.SESSION_COOKIE_SAMESITE.toLowerCase() as 'lax' | 'strict' | 'none',
    },
  };

  console.log('🍪 [COOKIE CONFIG] Registering cookie plugin:', {
    httpOnly: cookieConfig.parseOptions.httpOnly,
    secure: cookieConfig.parseOptions.secure,
    sameSite: cookieConfig.parseOptions.sameSite,
    secretLength: env.SESSION_SECRET.length,
  });

  await fastify.register(cookie, cookieConfig);

  // Register WebSocket plugin for real-time notifications
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB max payload
      clientTracking: false, // We'll manage connections ourselves
    },
  });

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