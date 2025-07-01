// src/modules/auth/handlers.js
import AuthService from './service.js';

async function requestOTP(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    const result = await authService.requestOTP(request.body);
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

async function verifyOTP(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    // Verify OTP and get user
    const user = await authService.verifyOTP(request.body);
    
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
  requestOTP,
  verifyOTP,
  refreshToken,
  getMe
};