// src/app.js
import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import pino from 'pino';
import 'dotenv/config';

// Import plugins
import loggerPlugin from './plugins/logger.js';
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import jwtPlugin from './plugins/jwt.js';
import rbacPlugin from './plugins/rbac.js';

// Import routes
import authRoutes from './modules/auth/routes.js';
import squareRoutes from './modules/square/routes.js';
import customerRoutes from './modules/customers/routes.js';
import cacheRoutes from './modules/cache/routes.js';

// Logger configuration
function createLoggerConfig() {
  const TOKEN = process.env.LOGTAIL_SOURCE_TOKEN;
  const INGESTING_HOST = process.env.LOGTAIL_INGESTING_HOST || "logs.betterstack.com";
  const LOGGER_FILE = process.env.LOGGER_FILE;

  if (TOKEN) {
    return {
      transport: {
        targets: [
          {
            target: "@logtail/pino",
            options: {
              sourceToken: TOKEN,
              options: { endpoint: `https://${INGESTING_HOST}` },
            },
          },
          ...(LOGGER_FILE
            ? [
                {
                  target: "pino/file",
                  options: { destination: LOGGER_FILE },
                },
              ]
            : []),
          {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
              colorize: true,
            },
          },
        ]
      }
    };
  } else {
    return {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true
        }
      }
    };
  }
}

export default function build(opts = {}) {
  // Merge default logger config with passed options
  const options = {
    logger: createLoggerConfig(),
    ...opts
  };
  
  const app = fastify(options);

  // Configure CORS - Parse and trim origins with fallback defaults
  const corsOrigins = (process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS)
    ?.split(',')
    .map(origin => origin.trim()) || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8800'
    ];

  app.register(cors, {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',         // CRITICAL: Frontend uses lowercase 'x-api-key'
      'X-API-Key',         // Also support uppercase variant
      'X-Requested-With',
      'Accept'
    ],
    exposedHeaders: ['Referrer-Policy', 'Content-Length', 'X-Request-Id'],
    maxAge: 86400 // 24 hours preflight cache
  });

  // Add Referrer-Policy header for localhost testing
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Referrer-Policy', 'no-referrer-when-downgrade');
  });

  // Register plugins
  app.register(loggerPlugin);
  app.register(prismaPlugin);
  app.register(redisPlugin);
  app.register(jwtPlugin);
  app.register(rbacPlugin);

  // Swagger documentation
  app.register(swagger, {
    swagger: {
      info: {
        title: 'Barber Core API',
        description: 'Core API for Milkyano Barber booking system with OTP authentication and Square integration',
        version: '1.0.0'
      },
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT Bearer token'
        }
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'square', description: 'Square API integration' },
        { name: 'customers', description: 'Customer management' },
        { name: 'cache', description: 'Cache management (Admin only)' }
      ]
    }
  });
  
  app.register(swaggerUi, {
    routePrefix: '/documentation',
  });

  // API routes with prefix /api/v1
  app.register((apiInstance, opts, done) => {
    // Register routes within the /api/v1 prefix
    apiInstance.register(authRoutes, { prefix: '/auth' });
    apiInstance.register(squareRoutes);
    apiInstance.register(customerRoutes, { prefix: '/customers' });
    apiInstance.register(cacheRoutes, { prefix: '/cache' });
    
    done();
  }, { prefix: '/api/v1' });

  // Health check (outside API namespace)
  app.get('/health', async (request, reply) => {
    return { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'barber-core-api'
    };
  });

  return app;
}