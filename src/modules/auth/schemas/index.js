// src/modules/auth/schemas/index.js

export const requestOTPSchema = {
  body: {
    type: 'object',
    required: ['phoneNumber', 'firstName', 'lastName'],
    properties: {
      phoneNumber: {
        type: 'string',
        pattern: '^[0-9+\\-() ]+$',
        minLength: 10,
        maxLength: 20
      },
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        phoneNumber: { type: 'string' },
        userId: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
};

export const verifyOTPSchema = {
  body: {
    type: 'object',
    required: ['phoneNumber', 'otpCode'],
    properties: {
      phoneNumber: {
        type: 'string',
        pattern: '^[0-9+\\-() ]+$',
        minLength: 10,
        maxLength: 20
      },
      otpCode: {
        type: 'string',
        pattern: '^[0-9]{4,6}$',
        description: '4-6 digit OTP code'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        tokenType: { type: 'string' },
        expiresIn: { type: 'number' },
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
        }
      }
    }
  }
};

export const refreshTokenSchema = {
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: {
        type: 'string',
        minLength: 10,
        description: 'JWT refresh token'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        tokenType: { type: 'string' },
        expiresIn: { type: 'number' }
      }
    }
  }
};

export const getMeSchema = {
  headers: {
    type: 'object',
    properties: {
      authorization: {
        type: 'string',
        pattern: '^Bearer .+$'
      }
    },
    required: ['authorization']
  },
  response: {
    200: {
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
    }
  }
};