// src/modules/auth/schemas/index.js

export const registerSchema = {
  tags: ['auth'],
  summary: 'Register new customer',
  description: 'Creates a new customer account with password and sends OTP verification',
  body: {
    type: 'object',
    required: ['phoneNumber', 'firstName', 'lastName', 'password'],
    properties: {
      phoneNumber: {
        type: 'string',
        pattern: '^[0-9+\\-() ]+$',
        minLength: 10,
        maxLength: 20,
        description: 'Phone number in international format (e.g., +61412345678)'
      },
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Customer first name'
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Customer last name'
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255,
        description: 'Optional email address'
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
      description: 'Registration successful, OTP sent',
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token (expires in 1 day)' },
        refreshToken: { type: 'string', description: 'JWT refresh token (expires in 90 days)' },
        tokenType: { type: 'string', description: 'Token type (Bearer)' },
        expiresIn: { type: 'number', description: 'Access token expiry in seconds' },
        user: {
          type: 'object',
          description: 'User information',
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
        message: { type: 'string', description: 'Success message' }
      }
    },
    400: {
      description: 'Invalid input data',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    409: {
      description: 'User already exists',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const registerAdminSchema = {
  tags: ['auth'],
  summary: 'Register new admin',
  description: 'Creates a new admin account (requires secret key)',
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
        maxLength: 20,
        description: 'Phone number in international format'
      },
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Admin first name'
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Admin last name'
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255,
        description: 'Admin email address (required)'
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
      description: 'Admin registration successful',
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Unique user ID' },
        phoneNumber: { type: 'string', description: 'Registered phone number' },
        message: { type: 'string', description: 'Success message' }
      }
    },
    401: {
      description: 'Invalid secret key',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const loginSchema = {
  tags: ['auth'],
  summary: 'Login with password',
  description: 'Authenticate using email/phone and password to receive JWT tokens',
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
        minLength: 1,
        description: 'Account password'
      }
    }
  },
  response: {
    200: {
      description: 'Login successful',
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token (expires in 1 day)' },
        refreshToken: { type: 'string', description: 'JWT refresh token (expires in 90 days)' },
        tokenType: { type: 'string', description: 'Token type (Bearer)' },
        expiresIn: { type: 'number', description: 'Access token expiry in seconds' },
        user: {
          type: 'object',
          description: 'User information',
          properties: {
            id: { type: 'string' },
            phoneNumber: { type: 'string' },
            email: { type: 'string', nullable: true },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
            isVerified: { type: 'boolean' }
          }
        }
      }
    },
    401: {
      description: 'Invalid credentials',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    403: {
      description: 'Account not verified',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const requestOTPSchema = {
  tags: ['auth'],
  summary: 'Request OTP for login or phone number change',
  description: 'Sends OTP to phone number. For unauthenticated users: sends OTP to existing registered number for login. For authenticated users: sends OTP to new number for phone change.',
  headers: {
    type: 'object',
    properties: {
      authorization: {
        type: 'string',
        pattern: '^Bearer .+$',
        description: 'Optional - Bearer token for authenticated phone number change'
      }
    }
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
        description: 'Phone number to send OTP to'
      }
    }
  },
  response: {
    200: {
      description: 'OTP sent successfully',
      type: 'object',
      properties: {
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
    404: {
      description: 'User not found (unauthenticated flow only)',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const forgotPasswordSchema = {
  tags: ['auth'],
  summary: 'Request password reset',
  description: 'Sends OTP for password reset (not implemented yet)',
  body: {
    type: 'object',
    required: ['phoneNumber'],
    properties: {
      phoneNumber: {
        type: 'string',
        pattern: '^[0-9+\\-() ]+$',
        minLength: 10,
        maxLength: 20,
        description: 'Registered phone number'
      }
    }
  },
  response: {
    200: {
      description: 'OTP sent for password reset',
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    },
    404: {
      description: 'User not found',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const verifyOTPSchema = {
  tags: ['auth'],
  summary: 'Verify OTP code',
  description: 'Verifies OTP and returns JWT tokens for authenticated access',
  body: {
    type: 'object',
    required: ['phoneNumber', 'otpCode'],
    properties: {
      phoneNumber: {
        type: 'string',
        pattern: '^[0-9+\\-() ]+$',
        minLength: 10,
        maxLength: 20,
        description: 'Phone number that received the OTP'
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
      description: 'OTP verified successfully',
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token (expires in 1 day)' },
        refreshToken: { type: 'string', description: 'JWT refresh token (expires in 90 days)' },
        tokenType: { type: 'string', description: 'Token type (Bearer)' },
        expiresIn: { type: 'number', description: 'Access token expiry in seconds' },
        user: {
          type: 'object',
          description: 'User information',
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
    },
    400: {
      description: 'Invalid OTP',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    404: {
      description: 'User not found',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const refreshTokenSchema = {
  tags: ['auth'],
  summary: 'Refresh access token',
  description: 'Exchange a valid refresh token for a new access token',
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
      description: 'Token refreshed successfully',
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'New JWT access token' },
        tokenType: { type: 'string', description: 'Token type (Bearer)' },
        expiresIn: { type: 'number', description: 'Access token expiry in seconds' }
      }
    },
    401: {
      description: 'Invalid or expired refresh token',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const getMeSchema = {
  tags: ['auth'],
  summary: 'Get current user',
  description: 'Returns information about the authenticated user',
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
  response: {
    200: {
      description: 'User information retrieved successfully',
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
    401: {
      description: 'Unauthorized - Invalid or missing token',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const updatePasswordSchema = {
  tags: ['auth'],
  summary: 'Update user password',
  description: 'Updates the password for the authenticated user',
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
    required: ['newPassword'],
    properties: {
      newPassword: {
        type: 'string',
        minLength: 8,
        maxLength: 100,
        description: 'New password (minimum 8 characters)'
      }
    }
  },
  response: {
    200: {
      description: 'Password updated successfully',
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    },
    401: {
      description: 'Unauthorized - Invalid or missing token',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    404: {
      description: 'User not found',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};