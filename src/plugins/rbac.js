// src/plugins/rbac.js
import fp from 'fastify-plugin';

export default fp(async function(fastify, opts) {
  // Simple role checker that works with our JWT payload
  fastify.decorate('checkRole', (requiredRoles) => {
    return async (request, reply) => {
      try {
        // The authenticate decorator already verifies JWT and loads user
        await fastify.authenticate(request, reply);
        
        // Check if user's role is in the list of required roles
        if (!requiredRoles.includes(request.user.role)) {
          return reply.status(403).send({ 
            error: 'Forbidden',
            message: `This action requires one of these roles: ${requiredRoles.join(', ')}`
          });
        }
      } catch (err) {
        // Error already handled by authenticate
      }
    };
  });

  // Convenience decorators for common role checks
  fastify.decorate('adminOnly', fastify.checkRole(['ADMIN']));
  fastify.decorate('customerOnly', fastify.checkRole(['CUSTOMER']));
  fastify.decorate('authenticatedOnly', fastify.authenticate);
});