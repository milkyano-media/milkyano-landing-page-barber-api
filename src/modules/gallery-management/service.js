import { createBadRequestError, createNotFoundError } from '../../utils/errors.js';

/**
 * Gallery Service
 * Handles CRUD operations for gallery items
 */
export class GalleryService {
    constructor(prisma, redis = null) {
        this.prisma = prisma;
        this.redis = redis;
    }

    /**
     * List gallery items with optional filtering
     */
    async listGalleryItems(options = {}) {
        const { isActive } = options;

        const where = {};
        if (isActive !== undefined) {
            where.isActive = isActive === 'true' || isActive === true;
        }

        const galleryItems = await this.prisma.galleryItem.findMany({
            where,
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        return galleryItems;
    }

    /**
     * Get single gallery item by ID
     */
    async getGalleryItemById(id) {
        const galleryItem = await this.prisma.galleryItem.findUnique({
            where: { id }
        });

        if (!galleryItem) {
            throw createNotFoundError('Gallery item not found');
        }

        return galleryItem;
    }

    /**
     * Create new gallery item
     */
    async createGalleryItem(data) {
        // Validate base64 image
        this.validateBase64Image(data.imageBase64);

        // Get the highest sortOrder and increment
        const lastItem = await this.prisma.galleryItem.findFirst({
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true }
        });

        const sortOrder = lastItem ? lastItem.sortOrder + 1 : 0;

        const galleryItem = await this.prisma.galleryItem.create({
            data: {
                ...data,
                sortOrder
            }
        });

        return galleryItem;
    }

    /**
     * Update gallery item
     */
    async updateGalleryItem(id, data) {
        // Check if gallery item exists
        await this.getGalleryItemById(id);

        // Validate base64 image if provided
        if (data.imageBase64) {
            this.validateBase64Image(data.imageBase64);
        }

        const galleryItem = await this.prisma.galleryItem.update({
            where: { id },
            data
        });

        return galleryItem;
    }

    /**
     * Delete gallery item
     */
    async deleteGalleryItem(id) {
        // Check if gallery item exists
        await this.getGalleryItemById(id);

        await this.prisma.galleryItem.delete({
            where: { id }
        });

        return { success: true };
    }

    /**
     * Reorder gallery items
     */
    async reorderGalleryItems(updates) {
        // Use transaction to update all items atomically
        await this.prisma.$transaction(
            updates.map(({ id, sortOrder }) =>
                this.prisma.galleryItem.update({
                    where: { id },
                    data: { sortOrder }
                })
            )
        );

        return { success: true };
    }

    /**
     * Validate base64 image format and size
     */
    validateBase64Image(imageBase64) {
        // Check if it's a valid data URL with image mime type
        const dataUrlRegex = /^data:image\/(png|jpe?g|webp);base64,/;
        if (!dataUrlRegex.test(imageBase64)) {
            throw createBadRequestError(
                'Invalid image format. Must be a base64 data URL with image/png, image/jpeg, or image/webp mime type.'
            );
        }

        // Extract base64 data (remove data URL prefix)
        const base64Data = imageBase64.split(',')[1];
        if (!base64Data) {
            throw createBadRequestError('Invalid base64 data');
        }

        // Calculate decoded size (base64 encoding increases size by ~33%)
        const decodedSize = (base64Data.length * 3) / 4;
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (decodedSize > maxSize) {
            throw createBadRequestError(
                'Image size exceeds 2MB limit. Please upload a smaller image.'
            );
        }

        return true;
    }
}

export default GalleryService;
