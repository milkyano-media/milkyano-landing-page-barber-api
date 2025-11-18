import {
    listBarbersHandler,
    getBarberHandler,
    createBarberHandler,
    updateBarberHandler,
    deleteBarberHandler,
    reorderBarbersHandler,
} from './handlers.js';
import {
    listBarbersSchema,
    getBarberSchema,
    createBarberSchema,
    updateBarberSchema,
    deleteBarberSchema,
    reorderBarbersSchema,
} from './schemas/index.js';

/**
 * Barber routes
 * @param {import('fastify').FastifyInstance} fastify
 */
async function barberRoutes(fastify) {
    // Public routes - no authentication required
    fastify.get('/', {
        schema: listBarbersSchema,
        handler: listBarbersHandler,
    });

    fastify.get('/:id', {
        schema: getBarberSchema,
        handler: getBarberHandler,
    });

    // Admin routes - require ADMIN role
    fastify.post('/', {
        schema: createBarberSchema,
        preHandler: [fastify.authenticate, fastify.adminOnly],
        handler: createBarberHandler,
    });

    fastify.patch('/:id', {
        schema: updateBarberSchema,
        preHandler: [fastify.authenticate, fastify.adminOnly],
        handler: updateBarberHandler,
    });

    fastify.delete('/:id', {
        schema: deleteBarberSchema,
        preHandler: [fastify.authenticate, fastify.adminOnly],
        handler: deleteBarberHandler,
    });

    fastify.patch('/reorder', {
        schema: reorderBarbersSchema,
        preHandler: [fastify.authenticate, fastify.adminOnly],
        handler: reorderBarbersHandler,
    });
}

export default barberRoutes;
