// src/modules/parameters/schemas/index.js

// Shared parameter response schema
const parameterResponseProperties = {
  id: { type: 'string' },
  key: { type: 'string' },
  value: { description: 'Parameter value (can be any JSON type)' },
  type: { type: 'string', enum: ['STRING', 'NUMBER', 'BOOLEAN', 'COLOR', 'JSON', 'IMAGE_URL', 'URL'] },
  category: { type: 'string', enum: ['THEME', 'BRANDING', 'LAYOUT', 'CONTENT', 'FEATURE_FLAG', 'SEO', 'ANALYTICS', 'CONTACT', 'BOOKING'] },
  description: { type: ['string', 'null'] },
  isActive: { type: 'boolean' },
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' }
};

// GET /parameters - List all parameters with filters
export const listParametersSchema = {
  tags: ['parameters'],
  summary: 'List all parameters',
  description: 'Retrieves all parameters with optional filtering, sorting, and pagination',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by category'
      },
      type: {
        type: 'string',
        enum: ['STRING', 'NUMBER', 'BOOLEAN', 'COLOR', 'JSON', 'IMAGE_URL', 'URL'],
        description: 'Filter by type'
      },
      is_active: {
        type: 'string',
        enum: ['true', 'false'],
        description: 'Filter by active status'
      },
      search: {
        type: 'string',
        description: 'Search in key and description'
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Items per page'
      },
      sort_by: {
        type: 'string',
        enum: ['key', 'category', 'type', 'createdAt', 'updatedAt'],
        default: 'key',
        description: 'Sort field'
      },
      sort_order: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'asc',
        description: 'Sort direction'
      }
    }
  },
  response: {
    200: {
      description: 'List of parameters retrieved successfully',
      type: 'object',
      properties: {
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: parameterResponseProperties
          }
        },
        total: { type: 'integer', description: 'Total number of parameters' },
        page: { type: 'integer', description: 'Current page number' },
        limit: { type: 'integer', description: 'Items per page' }
      }
    }
  }
};

// GET /parameters/:id - Get parameter by ID
export const getParameterByIdSchema = {
  tags: ['parameters'],
  summary: 'Get parameter by ID',
  description: 'Retrieves a single parameter by its ID',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Parameter ID'
      }
    }
  },
  response: {
    200: {
      description: 'Parameter retrieved successfully',
      type: 'object',
      properties: {
        parameter: {
          type: 'object',
          properties: parameterResponseProperties
        },
        message: { type: 'string' }
      }
    }
  }
};

// GET /parameters/key/:key - Get parameter by key
export const getParameterByKeySchema = {
  tags: ['parameters'],
  summary: 'Get parameter by key',
  description: 'Retrieves a single parameter by its unique key (e.g., "theme.primary_color")',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['key'],
    properties: {
      key: {
        type: 'string',
        description: 'Parameter key (e.g., "theme.primary_color")'
      }
    }
  },
  response: {
    200: {
      description: 'Parameter retrieved successfully',
      type: 'object',
      properties: {
        parameter: {
          type: 'object',
          properties: parameterResponseProperties
        },
        message: { type: 'string' }
      }
    }
  }
};

// GET /parameters/public - Get active parameters (public endpoint, no auth)
export const getPublicParametersSchema = {
  tags: ['parameters'],
  summary: 'Get active parameters (public)',
  description: 'Retrieves all active parameters for public consumption (cached). No authentication required.',
  querystring: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['THEME', 'BRANDING', 'LAYOUT', 'CONTENT', 'FEATURE_FLAG', 'SEO', 'ANALYTICS', 'CONTACT', 'BOOKING'],
        description: 'Filter by category'
      }
    }
  },
  response: {
    200: {
      description: 'Active parameters retrieved successfully',
      type: 'object',
      properties: {
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: parameterResponseProperties
          }
        }
      }
    }
  }
};

// POST /parameters - Create parameter
export const createParameterSchema = {
  tags: ['parameters'],
  summary: 'Create parameter',
  description: 'Creates a new parameter. Admin only.',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['key', 'value', 'type', 'category'],
    properties: {
      key: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        pattern: '^[a-z0-9._]+$',
        description: 'Parameter key (lowercase, dots and underscores allowed, e.g., "theme.primary_color")'
      },
      value: {
        description: 'Parameter value (can be string, number, boolean, object, etc.)'
      },
      type: {
        type: 'string',
        enum: ['STRING', 'NUMBER', 'BOOLEAN', 'COLOR', 'JSON', 'IMAGE_URL', 'URL'],
        description: 'Parameter type'
      },
      category: {
        type: 'string',
        enum: ['THEME', 'BRANDING', 'LAYOUT', 'CONTENT', 'FEATURE_FLAG', 'SEO', 'ANALYTICS', 'CONTACT', 'BOOKING'],
        description: 'Parameter category'
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Optional description'
      },
      isActive: {
        type: 'boolean',
        default: true,
        description: 'Whether the parameter is active'
      }
    }
  },
  response: {
    201: {
      description: 'Parameter created successfully',
      type: 'object',
      properties: {
        parameter: {
          type: 'object',
          properties: parameterResponseProperties
        },
        message: { type: 'string' }
      }
    }
  }
};

// PATCH /parameters/:id - Update parameter by ID
export const updateParameterByIdSchema = {
  tags: ['parameters'],
  summary: 'Update parameter by ID',
  description: 'Updates an existing parameter by ID. Admin only.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Parameter ID'
      }
    }
  },
  body: {
    type: 'object',
    minProperties: 1,
    properties: {
      value: {
        description: 'Parameter value (can be string, number, boolean, object, etc.)'
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Parameter description'
      },
      isActive: {
        type: 'boolean',
        description: 'Whether the parameter is active'
      }
    }
  },
  response: {
    200: {
      description: 'Parameter updated successfully',
      type: 'object',
      properties: {
        parameter: {
          type: 'object',
          properties: parameterResponseProperties
        },
        message: { type: 'string' }
      }
    }
  }
};

// PATCH /parameters/key/:key - Update parameter by key
export const updateParameterByKeySchema = {
  tags: ['parameters'],
  summary: 'Update parameter by key',
  description: 'Updates an existing parameter by key. Admin only.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['key'],
    properties: {
      key: {
        type: 'string',
        description: 'Parameter key (e.g., "theme.primary_color")'
      }
    }
  },
  body: {
    type: 'object',
    minProperties: 1,
    properties: {
      value: {
        description: 'Parameter value (can be string, number, boolean, object, etc.)'
      },
      type: {
        type: 'string',
        enum: ['STRING', 'NUMBER', 'BOOLEAN', 'COLOR', 'JSON', 'IMAGE_URL', 'URL'],
        description: 'Parameter type'
      },
      category: {
        type: 'string',
        enum: ['THEME', 'BRANDING', 'LAYOUT', 'CONTENT', 'FEATURE_FLAG', 'SEO', 'ANALYTICS', 'CONTACT', 'BOOKING'],
        description: 'Parameter category'
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Parameter description'
      },
      isActive: {
        type: 'boolean',
        description: 'Whether the parameter is active'
      }
    }
  },
  response: {
    200: {
      description: 'Parameter updated successfully',
      type: 'object',
      properties: {
        parameter: {
          type: 'object',
          properties: parameterResponseProperties
        },
        message: { type: 'string' }
      }
    }
  }
};

// DELETE /parameters/:id - Delete parameter
export const deleteParameterSchema = {
  tags: ['parameters'],
  summary: 'Delete parameter',
  description: 'Deletes a parameter by ID. Admin only.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Parameter ID'
      }
    }
  },
  response: {
    200: {
      description: 'Parameter deleted successfully',
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  }
};
