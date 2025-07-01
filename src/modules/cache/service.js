// src/modules/cache/service.js
import { AppError } from '../../utils/errors.js';

export default class CacheService {
  constructor(redis) {
    if (!redis) {
      throw new AppError('Redis client not initialized', 500);
    }
    this.redis = redis;
  }

  /**
   * Invalidate all cache keys
   * @returns {Promise<Object>} Result with number of keys deleted
   */
  async invalidateAll() {
    try {
      // Get all keys
      const keys = await this.redis.keys('*');
      
      if (keys.length === 0) {
        return { keysDeleted: 0 };
      }

      // Delete all keys
      await this.redis.del(...keys);
      
      return { keysDeleted: keys.length };
    } catch (error) {
      console.error('Cache invalidateAll error:', error);
      throw new AppError('Failed to clear all cache', 500);
    }
  }

  /**
   * Invalidate specific cache key
   * @param {string} key - Cache key to delete
   * @returns {Promise<Object>} Result with deletion status
   */
  async invalidateByKey(key) {
    try {
      const result = await this.redis.del(key);
      return { deleted: result === 1 };
    } catch (error) {
      console.error('Cache invalidateByKey error:', error);
      throw new AppError(`Failed to delete cache key: ${key}`, 500);
    }
  }

  /**
   * Invalidate cache keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., 'barbers:*', 'services:*')
   * @returns {Promise<Object>} Result with number of keys deleted
   */
  async invalidateByPattern(pattern) {
    try {
      // Find all keys matching the pattern
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return { keysDeleted: 0, keys: [] };
      }

      // Delete matching keys
      await this.redis.del(...keys);
      
      return { 
        keysDeleted: keys.length,
        keys: keys 
      };
    } catch (error) {
      console.error('Cache invalidateByPattern error:', error);
      throw new AppError(`Failed to delete cache by pattern: ${pattern}`, 500);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      // Get all keys grouped by pattern
      const allKeys = await this.redis.keys('*');
      
      // Group keys by prefix
      const keyGroups = {};
      const patterns = {
        barbers: 0,
        services: 0,
        availability: 0,
        other: 0
      };

      allKeys.forEach(key => {
        if (key.startsWith('barbers:')) {
          patterns.barbers++;
        } else if (key.startsWith('services:')) {
          patterns.services++;
        } else if (key.startsWith('availability:')) {
          patterns.availability++;
        } else {
          patterns.other++;
        }
      });

      // Get memory usage info
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        totalKeys: allKeys.length,
        keysByPattern: patterns,
        memoryUsage,
        cacheKeys: allKeys.slice(0, 100) // Return first 100 keys
      };
    } catch (error) {
      console.error('Cache getStats error:', error);
      throw new AppError('Failed to get cache statistics', 500);
    }
  }
}