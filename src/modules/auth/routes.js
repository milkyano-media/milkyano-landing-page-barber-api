// src/modules/auth/routes.js
import {
  register,
  registerAdmin,
  requestOTP,
  forgotPassword,
  login,
  verifyOTP,
  refreshToken,
  getMe,
  updatePassword,
  verifyGoogleOAuth,
  completeGoogleOAuth,
  verifyAppleOAuth,
  completeAppleOAuth
} from './handlers.js';

import {
  registerSchema,
  registerAdminSchema,
  requestOTPSchema,
  forgotPasswordSchema,
  loginSchema,
  verifyOTPSchema,
  refreshTokenSchema,
  getMeSchema,
  updatePasswordSchema,
  verifyGoogleOAuthSchema,
  completeGoogleOAuthSchema,
  verifyAppleOAuthSchema,
  completeAppleOAuthSchema
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

  // Login endpoint
  fastify.post('/login', {
    schema: loginSchema,
    handler: login
  });

  // OTP management
  fastify.post('/request-otp', {
    schema: requestOTPSchema,
    preHandler: async (request, reply) => {
      // Try to authenticate but don't fail if no token
      try {
        await request.jwtVerify();
        const user = await fastify.prisma.user.findUnique({
          where: { id: request.user.sub }
        });
        if (user) {
          request.authenticatedUser = user;
        }
      } catch (err) {
        // No token or invalid token - that's OK for this endpoint
        request.authenticatedUser = null;
      }
    },
    handler: requestOTP
  });

  fastify.post('/forgot-password', {
    schema: forgotPasswordSchema,
    handler: forgotPassword
  });

  fastify.post('/verify-otp', {
    schema: verifyOTPSchema,
    preHandler: async (request, reply) => {
      // Try to authenticate but don't fail if no token
      try {
        await request.jwtVerify();
        const user = await fastify.prisma.user.findUnique({
          where: { id: request.user.sub }
        });
        if (user) {
          request.authenticatedUser = user;
        }
      } catch (err) {
        // No token or invalid token - that's OK for this endpoint
        request.authenticatedUser = null;
      }
    },
    handler: verifyOTP
  });

  // Token management
  fastify.post('/refresh', {
    schema: refreshTokenSchema,
    handler: refreshToken
  });

  // OAuth endpoints
  fastify.post('/google/verify', {
    schema: verifyGoogleOAuthSchema,
    handler: verifyGoogleOAuth
  });

  fastify.post('/google/complete', {
    schema: completeGoogleOAuthSchema,
    handler: completeGoogleOAuth
  });

  // Apple OAuth endpoints
  fastify.post('/apple/verify', {
    schema: verifyAppleOAuthSchema,
    handler: verifyAppleOAuth
  });

  fastify.post('/apple/complete', {
    schema: completeAppleOAuthSchema,
    handler: completeAppleOAuth
  });

  // Protected routes - authentication required
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: getMeSchema,
    handler: getMe
  });

  fastify.put('/update-password', {
    preHandler: [fastify.authenticate],
    schema: updatePasswordSchema,
    handler: updatePassword
  });

}