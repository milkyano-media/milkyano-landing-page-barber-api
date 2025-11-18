import {
    listGalleryItemsHandler,
    getGalleryItemHandler,
    createGalleryItemHandler,
    updateGalleryItemHandler,
    deleteGalleryItemHandler,
    reorderGalleryItemsHandler,
} from './handlers.js';
import {
    listGalleryItemsSchema,
    getGalleryItemSchema,
    createGalleryItemSchema,
    updateGalleryItemSchema,
    deleteGalleryItemSchema,
    reorderGalleryItemsSchema,
} from './schemas/index.js';

/**
 * Gallery routes
 * @param {import('fastify').FastifyInstance} fastify
 */
async function galleryRoutes(fastify) {
    // Public routes - no authentication required
    fastify.get('/', {
        schema: listGalleryItemsSchema,
        handler: listGalleryItemsHandler,
    });

    fastify.get('/:id', {
        schema: getGalleryItemSchema,
        handler: getGalleryItemHandler,
    });

    // Admin routes - require ADMIN role
    fastify.post('/', {
        schema: createGalleryItemSchema,
        preHandler: [fastify.authenticate, fastify.adminOnly],
        handler: createGalleryItemHandler,
    });

    fastify.patch('/:id', {
        schema: updateGalleryItemSchema,
        preHandler: [fastify.authenticate, fastify.adminOnly],
        handler: updateGalleryItemHandler,
    });

    fastify.delete('/:id', {
        schema: deleteGalleryItemSchema,
        preHandler: [fastify.authenticate, fastify.adminOnly],
        handler: deleteGalleryItemHandler,
    });

    fastify.patch('/reorder', {
        schema: reorderGalleryItemsSchema,
        preHandler: [fastify.authenticate, fastify.adminOnly],
        handler: reorderGalleryItemsHandler,
    });
}

export default galleryRoutes;
