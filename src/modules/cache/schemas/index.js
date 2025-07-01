// src/modules/cache/schemas/index.js

export const invalidateByKeySchema = {
  body: {
    type: 'object',
    required: ['key'],
    properties: {
      key: {
        type: 'string',
        minLength: 1,
        description: 'Cache key to delete'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        deleted: { type: 'boolean' }
      }
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        deleted: { type: 'boolean' }
      }
    }
  }
};

export const invalidateByPatternSchema = {
  body: {
    type: 'object',
    required: ['pattern'],
    properties: {
      pattern: {
        type: 'string',
        minLength: 1,
        description: 'Pattern to match cache keys (e.g., "barbers:*", "services:*")'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        keysDeleted: { type: 'number' },
        keys: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  }
};

export const cacheStatsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        totalKeys: { type: 'number' },
        keysByPattern: {
          type: 'object',
          properties: {
            barbers: { type: 'number' },
            services: { type: 'number' },
            availability: { type: 'number' },
            other: { type: 'number' }
          }
        },
        memoryUsage: { type: 'string' },
        cacheKeys: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  }
};