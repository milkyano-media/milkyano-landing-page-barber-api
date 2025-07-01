// src/plugins/jwt.js
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import jwt from 'jsonwebtoken';

export default fp(async function(fastify, opts) {
  // Register JWT for access tokens
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    sign: {
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '1d',
      issuer: process.env.JWT_ISSUER || 'barber-core-api',
      audience: process.env.JWT_AUDIENCE || 'milkyano-barber-web'
    },
    verify: {
      issuer: process.env.JWT_ISSUER || 'barber-core-api',
      audience: process.env.JWT_AUDIENCE || 'milkyano-barber-web'
    }
  });

  // Get refresh token secret
  const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh-secret-key';

  // Decorate fastify with auth utilities
  fastify.decorate('generateTokens', async function (user) {
    // Generate access token with full user data
    const accessToken = fastify.jwt.sign({
      sub: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified
    });

    // Generate refresh token with minimal data (stateless JWT)
    const refreshToken = jwt.sign(
      { 
        sub: user.id,
        type: 'refresh'
      },
      refreshTokenSecret,
      {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '90d',
        issuer: process.env.JWT_ISSUER || 'barber-core-api',
        audience: process.env.JWT_AUDIENCE || 'milkyano-barber-web'
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400, // 1 day in seconds
      tokenType: 'Bearer'
    };
  });

  fastify.decorate('refreshAccessToken', async function (refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, refreshTokenSecret, {
        issuer: process.env.JWT_ISSUER || 'barber-core-api',
        audience: process.env.JWT_AUDIENCE || 'milkyano-barber-web'
      });

      // Check token type
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user from database
      const user = await fastify.prisma.user.findUnique({
        where: { id: decoded.sub }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = fastify.jwt.sign({
        sub: user.id,
        role: user.role,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified
      });

      return {
        accessToken,
        expiresIn: 86400, // 1 day in seconds
        tokenType: 'Bearer'
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      }
      throw new Error('Invalid refresh token');
    }
  });

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
      
      // Optionally verify user still exists and is active
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.sub }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Add full user object to request
      request.user = {
        ...request.user,
        ...user
      };
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: err.message });
    }
  });
});