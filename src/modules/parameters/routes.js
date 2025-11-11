// src/modules/parameters/routes.js
import {
    listParameters,
    getParameterById,
    getParameterByKey,
    getPublicParameters,
    updateParameterById,
    updateParameterByKey,
    deleteParameter,
    getParameterCategories,
} from "./handlers.js";

import {
    listParametersSchema,
    getParameterByIdSchema,
    getParameterByKeySchema,
    getPublicParametersSchema,
    createParameterSchema,
    updateParameterByIdSchema,
    updateParameterByKeySchema,
    deleteParameterSchema,
} from "./schemas/index.js";

export default async function parameterRoutes(fastify, opts) {
    // Admin-only options for protected endpoints
    const adminOnlyOpts = {
        preHandler: [fastify.adminOnly],
    };

    // Public endpoint - no authentication required
    fastify.get("/public", {
        schema: getPublicParametersSchema,
        handler: getPublicParameters,
    });

    // List all parameters with filters - Admin only
    fastify.get("/", {
        ...adminOnlyOpts,
        schema: listParametersSchema,
        handler: listParameters,
    });

    // Get parameter by ID - Admin only
    fastify.get("/:id", {
        ...adminOnlyOpts,
        schema: getParameterByIdSchema,
        handler: getParameterById,
    });

    // Get parameter by key - Admin only
    fastify.get("/key/:key", {
        ...adminOnlyOpts,
        schema: getParameterByKeySchema,
        handler: getParameterByKey,
    });

    // Update parameter by ID - Admin only
    fastify.patch("/:id", {
        ...adminOnlyOpts,
        schema: updateParameterByIdSchema,
        handler: updateParameterById,
    });

    // Update parameter by key - Admin only
    fastify.patch("/key/:key", {
        ...adminOnlyOpts,
        schema: updateParameterByKeySchema,
        handler: updateParameterByKey,
    });

    fastify.get("/categories", {
        ...adminOnlyOpts,
        handler: getParameterCategories
    });
}
