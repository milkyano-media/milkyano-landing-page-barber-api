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
  updatePhoneNumber
} from './handlers.js';

import {
  registerSchema,
  registerAdminSchema,
  requestOTPSchema,
  forgotPasswordSchema,
  loginSchema,
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

  // Login endpoint
  fastify.post('/login', {
    schema: loginSchema,
    handler: login
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

  fastify.patch('/update-phone', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Update phone number',
      description: 'Updates the authenticated user\'s phone number',
      security: [{ bearerAuth: [] }],
      headers: {
        type: 'object',
        properties: {
          authorization: {
            type: 'string',
            pattern: '^Bearer .+$',
            description: 'Bearer token'
          }
        },
        required: ['authorization']
      },
      body: {
        type: 'object',
        required: ['phoneNumber'],
        properties: {
          phoneNumber: {
            type: 'string',
            pattern: '^[0-9+\\-() ]+$',
            minLength: 10,
            maxLength: 20,
            description: 'New phone number in international format'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                phoneNumber: { type: 'string' },
                email: { type: ['string', 'null'] },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
                isVerified: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Invalid phone number or already in use',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: updatePhoneNumber
  });
}