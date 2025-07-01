// src/modules/auth/routes.js
import {
  requestOTP,
  verifyOTP,
  refreshToken,
  getMe
} from './handlers.js';

import {
  requestOTPSchema,
  verifyOTPSchema,
  refreshTokenSchema,
  getMeSchema
} from './schemas/index.js';

export default async function authRoutes(fastify, opts) {
  // Public routes - no authentication required
  fastify.post('/request-otp', {
    schema: requestOTPSchema,
    handler: requestOTP
  });

  fastify.post('/verify-otp', {
    schema: verifyOTPSchema,
    handler: verifyOTP
  });

  fastify.post('/refresh', {
    schema: refreshTokenSchema,
    handler: refreshToken
  });

  // Protected routes - authentication required
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: getMeSchema,
    handler: getMe
  });
}