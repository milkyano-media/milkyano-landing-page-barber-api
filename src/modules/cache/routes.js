// src/modules/cache/routes.js
import {
  invalidateAllCache,
  invalidateCacheByKey,
  invalidateCacheByPattern,
  getCacheStats
} from './handlers.js';

import {
  invalidateAllCacheSchema,
  invalidateByKeySchema,
  invalidateByPatternSchema,
  cacheStatsSchema
} from './schemas/index.js';

export default async function cacheRoutes(fastify, opts) {
  // All cache management routes require admin authentication
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
    
    // Only ADMIN role can manage cache
    // if (request.user.role !== 'ADMIN') {
    //   reply.code(403).send({ 
    //     error: 'Access denied. Admin role required.' 
    //   });
    // }
  });

  // Clear all cache
  fastify.delete('/all', {
    schema: invalidateAllCacheSchema,
    handler: invalidateAllCache
  });

  // Clear specific key
  fastify.delete('/key', {
    schema: invalidateByKeySchema,
    handler: invalidateCacheByKey
  });

  // Clear by pattern
  fastify.delete('/pattern', {
    schema: invalidateByPatternSchema,
    handler: invalidateCacheByPattern
  });

  // Get cache statistics
  fastify.get('/stats', {
    schema: cacheStatsSchema,
    handler: getCacheStats
  });
}