// src/modules/auth/routes.js
import {
  register,
  registerAdmin,
  requestOTP,
  forgotPassword,
  verifyOTP,
  refreshToken,
  getMe
} from './handlers.js';

import {
  registerSchema,
  registerAdminSchema,
  requestOTPSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  refreshTokenSchema,
  getMeSchema
} from './schemas/index.js';

export default async function authRoutes(fastify, opts) {
  // Public routes - no authentication required
  
  // Registration endpoints
  fastify.post('/register', {
    schema: registerSchema,
    handler: register
  });

  fastify.post('/register-admin', {
    schema: registerAdminSchema,
    handler: registerAdmin
  });

  // OTP management
  fastify.post('/request-otp', {
    schema: requestOTPSchema,
    handler: requestOTP
  });

  fastify.post('/forgot-password', {
    schema: forgotPasswordSchema,
    handler: forgotPassword
  });

  fastify.post('/verify-otp', {
    schema: verifyOTPSchema,
    handler: verifyOTP
  });

  // Token management
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