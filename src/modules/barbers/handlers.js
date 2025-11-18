import BarberService from './service.js';

/**
 * List all barbers
 */
export async function listBarbersHandler(request, reply) {
    try {
        const service = new BarberService(request.server.prisma);
        const barbers = await service.listBarbers(request.query);

        return reply.code(200).send({ barbers });
    } catch (error) {
        request.log.error(error);
        if (error.statusCode) {
            return reply.code(error.statusCode).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Internal server error' });
    }
}

/**
 * Get barber by ID
 */
export async function getBarberHandler(request, reply) {
    try {
        const service = new BarberService(request.server.prisma);
        const barber = await service.getBarberById(request.params.id);

        return reply.code(200).send(barber);
    } catch (error) {
        request.log.error(error);
        if (error.statusCode) {
            return reply.code(error.statusCode).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Internal server error' });
    }
}

/**
 * Create a new barber (admin only)
 */
export async function createBarberHandler(request, reply) {
    try {
        const service = new BarberService(request.server.prisma);
        const barber = await service.createBarber(request.body);

        return reply.code(201).send(barber);
    } catch (error) {
        request.log.error(error);
        if (error.statusCode) {
            return reply.code(error.statusCode).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Internal server error' });
    }
}

/**
 * Update an existing barber (admin only)
 */
export async function updateBarberHandler(request, reply) {
    try {
        const service = new BarberService(request.server.prisma);
        const barber = await service.updateBarber(request.params.id, request.body);

        return reply.code(200).send(barber);
    } catch (error) {
        request.log.error(error);
        if (error.statusCode) {
            return reply.code(error.statusCode).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Internal server error' });
    }
}

/**
 * Delete a barber (admin only)
 */
export async function deleteBarberHandler(request, reply) {
    try {
        const service = new BarberService(request.server.prisma);
        await service.deleteBarber(request.params.id);

        return reply.code(200).send({ message: 'Barber deleted successfully' });
    } catch (error) {
        request.log.error(error);
        if (error.statusCode) {
            return reply.code(error.statusCode).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Internal server error' });
    }
}

/**
 * Reorder barbers (admin only)
 */
export async function reorderBarbersHandler(request, reply) {
    try {
        const service = new BarberService(request.server.prisma);
        await service.reorderBarbers(request.body.updates);

        return reply.code(200).send({ message: 'Barbers reordered successfully' });
    } catch (error) {
        request.log.error(error);
        if (error.statusCode) {
            return reply.code(error.statusCode).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Internal server error' });
    }
}
