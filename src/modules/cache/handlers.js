// src/modules/cache/handlers.js
import CacheService from './service.js';

async function invalidateAllCache(request, reply) {
  const cacheService = new CacheService(this.redis);
  
  try {
    const result = await cacheService.invalidateAll();
    return reply.code(200).send({
      message: 'All cache cleared successfully',
      keysDeleted: result.keysDeleted
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      error: 'Failed to clear cache' 
    });
  }
}

async function invalidateCacheByKey(request, reply) {
  const cacheService = new CacheService(this.redis);
  const { key } = request.body;
  
  try {
    const result = await cacheService.invalidateByKey(key);
    
    if (result.deleted) {
      return reply.code(200).send({
        message: `Cache key '${key}' deleted successfully`,
        deleted: true
      });
    } else {
      return reply.code(404).send({
        message: `Cache key '${key}' not found`,
        deleted: false
      });
    }
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      error: 'Failed to delete cache key' 
    });
  }
}

async function invalidateCacheByPattern(request, reply) {
  const cacheService = new CacheService(this.redis);
  const { pattern } = request.body;
  
  try {
    const result = await cacheService.invalidateByPattern(pattern);
    return reply.code(200).send({
      message: `Cache keys matching pattern '${pattern}' deleted successfully`,
      keysDeleted: result.keysDeleted,
      keys: result.keys
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      error: 'Failed to delete cache by pattern' 
    });
  }
}

async function getCacheStats(request, reply) {
  const cacheService = new CacheService(this.redis);
  
  try {
    const stats = await cacheService.getStats();
    return reply.code(200).send(stats);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      error: 'Failed to get cache statistics' 
    });
  }
}

export {
  invalidateAllCache,
  invalidateCacheByKey,
  invalidateCacheByPattern,
  getCacheStats
};