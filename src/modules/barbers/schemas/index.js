export const barberResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        imageBase64: { type: 'string' },
        redirectUrl: { type: 'string' },
        hasLanding: { type: 'boolean' },
        isActive: { type: 'boolean' },
        sortOrder: { type: 'integer' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

export const listBarbersSchema = {
    tags: ['barbers'],
    summary: 'List all barbers',
    description: 'Get list of barbers with optional active filter',
    querystring: {
        type: 'object',
        properties: {
            isActive: { type: 'boolean', description: 'Filter by active status' },
        },
    },
    response: {
        200: {
            type: 'object',
            properties: {
                barbers: {
                    type: 'array',
                    items: barberResponseSchema,
                },
            },
        },
    },
};

export const getBarberSchema = {
    tags: ['barbers'],
    summary: 'Get barber by ID',
    description: 'Get a single barber by ID',
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
    },
    response: {
        200: barberResponseSchema,
        404: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
    },
};

export const createBarberSchema = {
    tags: ['barbers'],
    summary: 'Create barber',
    description: 'Create a new barber (admin only)',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        required: ['name', 'displayName', 'imageBase64', 'redirectUrl'],
        properties: {
            name: {
                type: 'string',
                minLength: 1,
                description: 'Unique barber identifier (lowercase, no spaces)'
            },
            displayName: {
                type: 'string',
                minLength: 1,
                description: 'Display name for the barber'
            },
            imageBase64: {
                type: 'string',
                pattern: '^data:image\\/(png|jpe?g|webp);base64,',
                description: 'Base64 encoded image with data URL format'
            },
            redirectUrl: {
                type: 'string',
                minLength: 1,
                description: 'URL to redirect when clicking the barber'
            },
            hasLanding: {
                type: 'boolean',
                default: false,
                description: 'Whether the barber has a dedicated landing page'
            },
            isActive: {
                type: 'boolean',
                default: true,
                description: 'Whether the barber is active'
            },
        },
    },
    response: {
        201: barberResponseSchema,
        400: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
        401: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
        403: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
    },
};

export const updateBarberSchema = {
    tags: ['barbers'],
    summary: 'Update barber',
    description: 'Update an existing barber (admin only)',
    security: [{ bearerAuth: [] }],
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
    },
    body: {
        type: 'object',
        properties: {
            name: { type: 'string', minLength: 1 },
            displayName: { type: 'string', minLength: 1 },
            imageBase64: {
                type: 'string',
                pattern: '^data:image\\/(png|jpe?g|webp);base64,'
            },
            redirectUrl: { type: 'string', minLength: 1 },
            hasLanding: { type: 'boolean' },
            isActive: { type: 'boolean' },
        },
    },
    response: {
        200: barberResponseSchema,
        400: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
        401: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
        403: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
        404: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
    },
};

export const deleteBarberSchema = {
    tags: ['barbers'],
    summary: 'Delete barber',
    description: 'Delete a barber by ID (admin only)',
    security: [{ bearerAuth: [] }],
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
    },
    response: {
        200: {
            type: 'object',
            properties: {
                message: { type: 'string' },
            },
        },
        401: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
        403: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
        404: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
    },
};

export const reorderBarbersSchema = {
    tags: ['barbers'],
    summary: 'Reorder barbers',
    description: 'Update sort order for multiple barbers (admin only)',
    security: [{ bearerAuth: [] }],
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
                        sortOrder: { type: 'integer', minimum: 0 },
                    },
                },
            },
        },
    },
    response: {
        200: {
            type: 'object',
            properties: {
                message: { type: 'string' },
            },
        },
        400: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
        401: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
        403: {
            type: 'object',
            properties: {
                error: { type: 'string' },
            },
        },
    },
};
