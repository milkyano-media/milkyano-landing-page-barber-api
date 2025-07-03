// src/modules/auth/handlers.js
import AuthService from './service.js';

async function register(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    const result = await authService.register(request.body);
    
    // Get the created user
    const user = await authService.getUser(result.userId);
    
    // Generate tokens for the new user
    const tokens = await this.generateTokens(user);
    
    return reply.code(201).send({
      ...tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: result.message
    });
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal server error' 
    });
  }
}

async function registerAdmin(request, reply) {
  // Validate X-Secret-Key header
  const secretKey = request.headers['x-secret-key'];
  
  if (!secretKey || secretKey !== process.env.X_SECRET_KEY) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  
  const authService = new AuthService(this.prisma);
  
  try {
    const result = await authService.registerAdmin(request.body);
    return reply.code(201).send(result);
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal server error' 
    });
  }
}

async function requestOTP(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    // Pass authenticated user if exists
    const result = await authService.requestOTP(
      request.body.phoneNumber,
      request.authenticatedUser
    );
    return reply.code(200).send(result);
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    // Check if it's a phone number validation error
    if (error.message && error.message.includes('Please')) {
      return reply.code(400).send({ 
        error: error.message 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Something went wrong. Please try again.' 
    });
  }
}

async function forgotPassword(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    const result = await authService.forgotPassword(request.body.phoneNumber);
    return reply.code(200).send(result);
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal server error' 
    });
  }
}

async function login(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    const { emailOrPhone, password } = request.body;
    
    // Authenticate user
    const user = await authService.login(emailOrPhone, password);
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    return reply.code(200).send({
      ...tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal server error' 
    });
  }
}

async function verifyOTP(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    // Verify OTP and get user - pass authenticated user if exists
    const user = await authService.verifyOTP(
      request.body,
      request.authenticatedUser
    );
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    return reply.code(200).send({
      ...tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    // Check for specific OTP errors
    if (error.message && (error.message.includes('Invalid OTP') || error.message.includes('expired'))) {
      return reply.code(400).send({ 
        error: 'The verification code is incorrect or has expired. Please check and try again.' 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Something went wrong. Please try again.' 
    });
  }
}

async function refreshToken(request, reply) {
  try {
    const result = await this.refreshAccessToken(request.body.refreshToken);
    return reply.code(200).send(result);
  } catch (error) {
    request.log.error(error);
    return reply.code(401).send({ 
      error: error.message || 'Invalid refresh token' 
    });
  }
}

async function getMe(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    const user = await authService.getUser(request.user.sub);
    
    return reply.code(200).send({
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal server error' 
    });
  }
}

export {
  register,
  registerAdmin,
  requestOTP,
  forgotPassword,
  login,
  verifyOTP,
  refreshToken,
  getMe
};