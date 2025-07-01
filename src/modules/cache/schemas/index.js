// src/modules/cache/schemas/index.js

export const invalidateAllCacheSchema = {
  tags: ['cache'],
  summary: 'Clear all cache',
  description: 'Removes all keys from Redis cache (Admin only)',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Cache cleared successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        keysDeleted: { type: 'number' }
      }
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    403: {
      description: 'Forbidden - Admin role required',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const invalidateByKeySchema = {
  tags: ['cache'],
  summary: 'Clear specific cache key',
  description: 'Removes a specific key from Redis cache (Admin only)',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['key'],
    properties: {
      key: {
        type: 'string',
        minLength: 1,
        description: 'Cache key to delete (e.g., "barbers:all", "services:location:123")'
      }
    }
  },
  response: {
    200: {
      description: 'Key deleted successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        deleted: { type: 'boolean' }
      }
    },
    404: {
      description: 'Key not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        deleted: { type: 'boolean' }
      }
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    403: {
      description: 'Forbidden - Admin role required',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const invalidateByPatternSchema = {
  tags: ['cache'],
  summary: 'Clear cache by pattern',
  description: 'Removes all keys matching a pattern from Redis cache (Admin only)',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['pattern'],
    properties: {
      pattern: {
        type: 'string',
        minLength: 1,
        description: 'Pattern to match cache keys (e.g., "barbers:*", "services:*", "*:location:123")'
      }
    }
  },
  response: {
    200: {
      description: 'Keys deleted successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        keysDeleted: { type: 'number' },
        keys: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of deleted keys'
        }
      }
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    403: {
      description: 'Forbidden - Admin role required',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const cacheStatsSchema = {
  tags: ['cache'],
  summary: 'Get cache statistics',
  description: 'Returns statistics about the current cache state (Admin only)',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Cache statistics retrieved successfully',
      type: 'object',
      properties: {
        totalKeys: { type: 'number', description: 'Total number of keys in cache' },
        keysByPattern: {
          type: 'object',
          description: 'Keys grouped by pattern',
          properties: {
            barbers: { type: 'number', description: 'Number of barber-related keys' },
            services: { type: 'number', description: 'Number of service-related keys' },
            availability: { type: 'number', description: 'Number of availability-related keys' },
            other: { type: 'number', description: 'Number of other keys' }
          }
        },
        memoryUsage: { type: 'string', description: 'Redis memory usage information' },
        cacheKeys: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of all cache keys'
        }
      }
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    403: {
      description: 'Forbidden - Admin role required',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};