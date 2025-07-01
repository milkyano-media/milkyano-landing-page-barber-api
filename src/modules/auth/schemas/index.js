// src/modules/auth/schemas/index.js

export const registerSchema = {
  body: {
    type: 'object',
    required: ['phoneNumber', 'firstName', 'lastName', 'password'],
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
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 100,
        description: 'Password must be at least 8 characters'
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        phoneNumber: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
};

export const registerAdminSchema = {
  headers: {
    type: 'object',
    required: ['x-secret-key'],
    properties: {
      'x-secret-key': {
        type: 'string',
        description: 'Secret key for admin registration'
      }
    }
  },
  body: {
    type: 'object',
    required: ['phoneNumber', 'firstName', 'lastName', 'email', 'password'],
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
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 100,
        description: 'Password must be at least 8 characters'
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        phoneNumber: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['emailOrPhone', 'password'],
    properties: {
      emailOrPhone: {
        type: 'string',
        minLength: 1,
        description: 'Email address or phone number'
      },
      password: {
        type: 'string',
        minLength: 1
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
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            isVerified: { type: 'boolean' }
          }
        }
      }
    }
  }
};

export const requestOTPSchema = {
  body: {
    type: 'object',
    required: ['phoneNumber'],
    properties: {
      phoneNumber: {
        type: 'string',
        pattern: '^[0-9+\\-() ]+$',
        minLength: 10,
        maxLength: 20
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  }
};

export const forgotPasswordSchema = {
  body: {
    type: 'object',
    required: ['phoneNumber'],
    properties: {
      phoneNumber: {
        type: 'string',
        pattern: '^[0-9+\\-() ]+$',
        minLength: 10,
        maxLength: 20
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
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