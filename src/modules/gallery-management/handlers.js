import { GalleryService } from './service.js';

/**
 * List gallery items
 */
export async function listGalleryItemsHandler(request, reply) {
    const galleryService = new GalleryService(request.server.prisma, request.server.redis);

    const { isActive } = request.query;
    const galleryItems = await galleryService.listGalleryItems({ isActive });

    return { galleryItems };
}

/**
 * Get single gallery item
 */
export async function getGalleryItemHandler(request, reply) {
    const galleryService = new GalleryService(request.server.prisma, request.server.redis);

    const { id } = request.params;
    const galleryItem = await galleryService.getGalleryItemById(id);

    return galleryItem;
}

/**
 * Create gallery item (Admin only)
 */
export async function createGalleryItemHandler(request, reply) {
    const galleryService = new GalleryService(request.server.prisma, request.server.redis);

    const galleryItem = await galleryService.createGalleryItem(request.body);

    return reply.code(201).send(galleryItem);
}

/**
 * Update gallery item (Admin only)
 */
export async function updateGalleryItemHandler(request, reply) {
    const galleryService = new GalleryService(request.server.prisma, request.server.redis);

    const { id } = request.params;
    const galleryItem = await galleryService.updateGalleryItem(id, request.body);

    return galleryItem;
}

/**
 * Delete gallery item (Admin only)
 */
export async function deleteGalleryItemHandler(request, reply) {
    const galleryService = new GalleryService(request.server.prisma, request.server.redis);

    const { id } = request.params;
    await galleryService.deleteGalleryItem(id);

    return reply.code(204).send();
}

/**
 * Reorder gallery items (Admin only)
 */
export async function reorderGalleryItemsHandler(request, reply) {
    const galleryService = new GalleryService(request.server.prisma, request.server.redis);

    const { updates } = request.body;
    await galleryService.reorderGalleryItems(updates);

    return { success: true };
}
