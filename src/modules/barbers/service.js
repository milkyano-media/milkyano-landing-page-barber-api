import { createNotFoundError, createBadRequestError } from '../../utils/errors.js';

/**
 * BarberService - Business logic for barber management
 */
class BarberService {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * List all barbers with optional filtering
     * @param {Object} options - Query options
     * @param {boolean} options.isActive - Filter by active status
     * @returns {Promise<Array>} List of barbers
     */
    async listBarbers(options = {}) {
        const where = {};

        // Filter by active status if specified
        if (options.isActive !== undefined) {
            where.isActive = options.isActive === 'true' || options.isActive === true;
        }

        const barbers = await this.prisma.barber.findMany({
            where,
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'asc' },
            ],
        });

        return barbers;
    }

    /**
     * Get a single barber by ID
     * @param {string} id - Barber ID
     * @returns {Promise<Object>} Barber object
     */
    async getBarberById(id) {
        const barber = await this.prisma.barber.findUnique({
            where: { id },
        });

        if (!barber) {
            throw createNotFoundError('Barber not found');
        }

        return barber;
    }

    /**
     * Create a new barber
     * @param {Object} data - Barber data
     * @returns {Promise<Object>} Created barber
     */
    async createBarber(data) {
        // Validate base64 image format
        this.validateBase64Image(data.imageBase64);

        // Get the highest sortOrder and add 1
        const highestSortOrder = await this.prisma.barber.findFirst({
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });

        const sortOrder = highestSortOrder ? highestSortOrder.sortOrder + 1 : 0;

        const barber = await this.prisma.barber.create({
            data: {
                name: data.name,
                displayName: data.displayName,
                imageBase64: data.imageBase64,
                redirectUrl: data.redirectUrl,
                hasLanding: data.hasLanding ?? false,
                isActive: data.isActive ?? true,
                sortOrder,
            },
        });

        return barber;
    }

    /**
     * Update an existing barber
     * @param {string} id - Barber ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated barber
     */
    async updateBarber(id, data) {
        // Check if barber exists
        const existingBarber = await this.prisma.barber.findUnique({
            where: { id },
        });

        if (!existingBarber) {
            throw createNotFoundError('Barber not found');
        }

        // Validate base64 image if provided
        if (data.imageBase64) {
            this.validateBase64Image(data.imageBase64);
        }

        const updateData = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.displayName !== undefined) updateData.displayName = data.displayName;
        if (data.imageBase64 !== undefined) updateData.imageBase64 = data.imageBase64;
        if (data.redirectUrl !== undefined) updateData.redirectUrl = data.redirectUrl;
        if (data.hasLanding !== undefined) updateData.hasLanding = data.hasLanding;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const barber = await this.prisma.barber.update({
            where: { id },
            data: updateData,
        });

        return barber;
    }

    /**
     * Delete a barber
     * @param {string} id - Barber ID
     * @returns {Promise<void>}
     */
    async deleteBarber(id) {
        // Check if barber exists
        const existingBarber = await this.prisma.barber.findUnique({
            where: { id },
        });

        if (!existingBarber) {
            throw createNotFoundError('Barber not found');
        }

        await this.prisma.barber.delete({
            where: { id },
        });
    }

    /**
     * Reorder barbers by updating sortOrder
     * @param {Array<Object>} updates - Array of {id, sortOrder} objects
     * @returns {Promise<void>}
     */
    async reorderBarbers(updates) {
        if (!Array.isArray(updates) || updates.length === 0) {
            throw createBadRequestError('Updates array is required');
        }

        // Validate all barber IDs exist
        const barberIds = updates.map(u => u.id);
        const existingBarbers = await this.prisma.barber.findMany({
            where: { id: { in: barberIds } },
            select: { id: true },
        });

        if (existingBarbers.length !== barberIds.length) {
            throw createNotFoundError('One or more barbers not found');
        }

        // Update each barber's sortOrder in a transaction
        await this.prisma.$transaction(
            updates.map(({ id, sortOrder }) =>
                this.prisma.barber.update({
                    where: { id },
                    data: { sortOrder },
                })
            )
        );
    }

    /**
     * Validate base64 image format
     * @param {string} imageBase64 - Base64 image string
     * @throws {Error} If invalid format
     */
    validateBase64Image(imageBase64) {
        // Check if it starts with data URL format
        const dataUrlRegex = /^data:image\/(png|jpe?g|webp);base64,/;
        if (!dataUrlRegex.test(imageBase64)) {
            throw createBadRequestError(
                'Invalid image format. Must be data URL format: data:image/(png|jpg|jpeg|webp);base64,...'
            );
        }

        // Extract base64 part
        const base64Data = imageBase64.split(',')[1];
        if (!base64Data) {
            throw createBadRequestError('Invalid base64 data');
        }

        // Validate base64 string
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64Data)) {
            throw createBadRequestError('Invalid base64 encoding');
        }

        // Check decoded size (optional: max 2MB)
        const decodedSize = (base64Data.length * 3) / 4;
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (decodedSize > maxSize) {
            throw createBadRequestError('Image size exceeds 2MB limit');
        }
    }
}

export default BarberService;
