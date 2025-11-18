/**
 * Validation schemas for gallery management endpoints
 */

const galleryItemResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        description: { type: ['string', 'null'] },
        imageBase64: { type: 'string' },
        isActive: { type: 'boolean' },
        sortOrder: { type: 'integer' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
    }
};

/**
 * List gallery items schema
 */
export const listGalleryItemsSchema = {
    tags: ['gallery'],
    summary: 'List all gallery items',
    querystring: {
        type: 'object',
        properties: {
            isActive: { type: 'boolean' }
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                galleryItems: {
                    type: 'array',
                    items: galleryItemResponseSchema
                }
            }
        }
    }
};

/**
 * Get gallery item schema
 */
export const getGalleryItemSchema = {
    tags: ['gallery'],
    summary: 'Get a single gallery item by ID',
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' }
        }
    },
    response: {
        200: galleryItemResponseSchema,
        404: {
            type: 'object',
            properties: {
                statusCode: { type: 'integer' },
                error: { type: 'string' },
                message: { type: 'string' }
            }
        }
    }
};

/**
 * Create gallery item schema
 */
export const createGalleryItemSchema = {
    tags: ['gallery'],
    summary: 'Create a new gallery item (Admin only)',
    body: {
        type: 'object',
        required: ['title', 'imageBase64'],
        properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            imageBase64: { type: 'string', minLength: 100 },
            isActive: { type: 'boolean' }
        }
    },
    response: {
        201: galleryItemResponseSchema,
        400: {
            type: 'object',
            properties: {
                statusCode: { type: 'integer' },
                error: { type: 'string' },
                message: { type: 'string' }
            }
        }
    }
};

/**
 * Update gallery item schema
 */
export const updateGalleryItemSchema = {
    tags: ['gallery'],
    summary: 'Update an existing gallery item (Admin only)',
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' }
        }
    },
    body: {
        type: 'object',
        properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            imageBase64: { type: 'string', minLength: 100 },
            isActive: { type: 'boolean' }
        }
    },
    response: {
        200: galleryItemResponseSchema,
        404: {
            type: 'object',
            properties: {
                statusCode: { type: 'integer' },
                error: { type: 'string' },
                message: { type: 'string' }
            }
        }
    }
};

/**
 * Delete gallery item schema
 */
export const deleteGalleryItemSchema = {
    tags: ['gallery'],
    summary: 'Delete a gallery item (Admin only)',
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' }
        }
    },
    response: {
        204: {
            type: 'null',
            description: 'Gallery item deleted successfully'
        },
        404: {
            type: 'object',
            properties: {
                statusCode: { type: 'integer' },
                error: { type: 'string' },
                message: { type: 'string' }
            }
        }
    }
};

/**
 * Reorder gallery items schema
 */
export const reorderGalleryItemsSchema = {
    tags: ['gallery'],
    summary: 'Reorder gallery items (Admin only)',
    body: {
        type: 'object',
        required: ['updates'],
        properties: {
            updates: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['id', 'sortOrder'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        sortOrder: { type: 'integer', minimum: 0 }
                    }
                }
            }
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                success: { type: 'boolean' }
            }
        }
    }
};
