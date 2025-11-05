// src/modules/parameters/handlers.js
import ParameterService from './service.js';

/**
 * List all parameters with optional filters
 * Admin only
 */
async function listParameters(request, reply) {
  const parameterService = new ParameterService(this.prisma, this.redis);

  try {
    const result = await parameterService.listParameters(request.query);
    return reply.code(200).send(result);
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: 'Internal server error'
    });
  }
}

/**
 * Get parameter by ID
 * Admin only
 */
async function getParameterById(request, reply) {
  const parameterService = new ParameterService(this.prisma, this.redis);

  try {
    const parameter = await parameterService.getParameterById(request.params.id);
    return reply.code(200).send({
      parameter,
      message: 'Parameter retrieved successfully'
    });
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: 'Internal server error'
    });
  }
}

/**
 * Get parameter by key
 * Admin only
 */
async function getParameterByKey(request, reply) {
  const parameterService = new ParameterService(this.prisma, this.redis);

  try {
    const parameter = await parameterService.getParameterByKey(request.params.key);
    return reply.code(200).send({
      parameter,
      message: 'Parameter retrieved successfully'
    });
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: 'Internal server error'
    });
  }
}

/**
 * Get active parameters (public endpoint)
 * No authentication required
 */
async function getPublicParameters(request, reply) {
  const parameterService = new ParameterService(this.prisma, this.redis);

  try {
    const parameters = await parameterService.getPublicParameters(request.query.category);
    return reply.code(200).send({
      parameters
    });
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: 'Internal server error'
    });
  }
}

/**
 * Create a new parameter
 * Admin only
 */
async function createParameter(request, reply) {
  const parameterService = new ParameterService(this.prisma, this.redis);

  try {
    const parameter = await parameterService.createParameter(request.body);
    return reply.code(201).send({
      parameter,
      message: 'Parameter created successfully'
    });
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: 'Internal server error'
    });
  }
}

/**
 * Update parameter by ID
 * Admin only
 */
async function updateParameterById(request, reply) {
  const parameterService = new ParameterService(this.prisma, this.redis);

  try {
    const parameter = await parameterService.updateParameterById(
      request.params.id,
      request.body
    );
    return reply.code(200).send({
      parameter,
      message: 'Parameter updated successfully'
    });
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: 'Internal server error'
    });
  }
}

/**
 * Update parameter by key
 * Admin only
 */
async function updateParameterByKey(request, reply) {
  const parameterService = new ParameterService(this.prisma, this.redis);

  try {
    const parameter = await parameterService.updateParameterByKey(
      request.params.key,
      request.body
    );
    return reply.code(200).send({
      parameter,
      message: 'Parameter updated successfully'
    });
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: 'Internal server error'
    });
  }
}

/**
 * Delete parameter by ID
 * Admin only
 */
async function deleteParameter(request, reply) {
  const parameterService = new ParameterService(this.prisma, this.redis);

  try {
    await parameterService.deleteParameter(request.params.id);
    return reply.code(200).send({
      message: 'Parameter deleted successfully'
    });
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: 'Internal server error'
    });
  }
}

export {
  listParameters,
  getParameterById,
  getParameterByKey,
  getPublicParameters,
  createParameter,
  updateParameterById,
  updateParameterByKey,
  deleteParameter
};
