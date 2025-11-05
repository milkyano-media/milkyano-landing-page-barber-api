// src/modules/parameters/service.js
import { AppError } from '../../utils/errors.js';

const CACHE_KEY_PREFIX = 'parameters:public';
const CACHE_TTL = 300; // 5 minutes

export default class ParameterService {
  constructor(prisma, redis = null) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * List all parameters with optional filtering, sorting, and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated list of parameters
   */
  async listParameters(options = {}) {
    const {
      category,
      type,
      is_active,
      search,
      page = 1,
      limit = 20,
      sort_by = 'key',
      sort_order = 'asc'
    } = options;

    // Build where clause
    const where = {};

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    if (is_active !== undefined) {
      where.isActive = is_active === 'true';
    }

    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Get total count
    const total = await this.prisma.parameter.count({ where });

    // Get parameters
    const parameters = await this.prisma.parameter.findMany({
      where,
      skip,
      take,
      orderBy: { [sort_by]: sort_order }
    });

    return {
      parameters,
      total,
      page: parseInt(page),
      limit: take
    };
  }

  /**
   * Get parameter by ID
   * @param {string} id - Parameter ID
   * @returns {Promise<Object>} Parameter
   */
  async getParameterById(id) {
    const parameter = await this.prisma.parameter.findUnique({
      where: { id }
    });

    if (!parameter) {
      throw new AppError('Parameter not found', 404);
    }

    return parameter;
  }

  /**
   * Get parameter by key
   * @param {string} key - Parameter key
   * @returns {Promise<Object>} Parameter
   */
  async getParameterByKey(key) {
    const parameter = await this.prisma.parameter.findUnique({
      where: { key }
    });

    if (!parameter) {
      throw new AppError('Parameter not found', 404);
    }

    return parameter;
  }

  /**
   * Get active parameters (public endpoint, cached)
   * @param {string} category - Optional category filter
   * @returns {Promise<Array>} List of active parameters
   */
  async getPublicParameters(category = null) {
    const cacheKey = category ? `${CACHE_KEY_PREFIX}:${category}` : CACHE_KEY_PREFIX;

    // Try to get from cache if Redis is available
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('Redis get error:', error);
        // Continue to fetch from database if cache fails
      }
    }

    // Build where clause
    const where = { isActive: true };
    if (category) {
      where.category = category;
    }

    // Fetch from database
    const parameters = await this.prisma.parameter.findMany({
      where,
      orderBy: { key: 'asc' }
    });

    // Cache the result if Redis is available
    if (this.redis) {
      try {
        await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(parameters));
      } catch (error) {
        console.error('Redis set error:', error);
        // Continue even if caching fails
      }
    }

    return parameters;
  }

  /**
   * Create a new parameter
   * @param {Object} data - Parameter data
   * @returns {Promise<Object>} Created parameter
   */
  async createParameter(data) {
    const { key, value, type, category, description, isActive = true } = data;

    // Check if key already exists
    const existing = await this.prisma.parameter.findUnique({
      where: { key }
    });

    if (existing) {
      throw new AppError('Parameter with this key already exists', 400);
    }

    // Validate value against type
    this.validateValueType(value, type);

    // Create parameter
    const parameter = await this.prisma.parameter.create({
      data: {
        key,
        value,
        type,
        category,
        description,
        isActive
      }
    });

    // Invalidate cache
    await this.invalidateCache();

    return parameter;
  }

  /**
   * Update parameter by ID
   * @param {string} id - Parameter ID
   * @param {Object} updates - Parameter updates
   * @returns {Promise<Object>} Updated parameter
   */
  async updateParameterById(id, updates) {
    // Check if parameter exists
    const existing = await this.getParameterById(id);

    // Validate value against type if both are provided or if only value is provided
    const finalType = updates.type || existing.type;
    if (updates.value !== undefined) {
      this.validateValueType(updates.value, finalType);
    }

    // Update parameter
    const parameter = await this.prisma.parameter.update({
      where: { id },
      data: updates
    });

    // Invalidate cache
    await this.invalidateCache();

    return parameter;
  }

  /**
   * Update parameter by key
   * @param {string} key - Parameter key
   * @param {Object} updates - Parameter updates
   * @returns {Promise<Object>} Updated parameter
   */
  async updateParameterByKey(key, updates) {
    // Check if parameter exists
    const existing = await this.getParameterByKey(key);

    // Validate value against type if both are provided or if only value is provided
    const finalType = updates.type || existing.type;
    if (updates.value !== undefined) {
      this.validateValueType(updates.value, finalType);
    }

    // Update parameter
    const parameter = await this.prisma.parameter.update({
      where: { key },
      data: updates
    });

    // Invalidate cache
    await this.invalidateCache();

    return parameter;
  }

  /**
   * Delete parameter by ID
   * @param {string} id - Parameter ID
   * @returns {Promise<void>}
   */
  async deleteParameter(id) {
    // Check if parameter exists
    await this.getParameterById(id);

    // Delete parameter
    await this.prisma.parameter.delete({
      where: { id }
    });

    // Invalidate cache
    await this.invalidateCache();
  }

  /**
   * Validate parameter value against type
   * @param {*} value - Parameter value
   * @param {string} type - Parameter type
   * @throws {AppError} If validation fails
   */
  validateValueType(value, type) {
    switch (type) {
      case 'STRING':
        if (typeof value !== 'string') {
          throw new AppError('Value must be a string', 400);
        }
        break;

      case 'NUMBER':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new AppError('Value must be a number', 400);
        }
        break;

      case 'BOOLEAN':
        if (typeof value !== 'boolean') {
          throw new AppError('Value must be a boolean', 400);
        }
        break;

      case 'COLOR':
        if (typeof value !== 'string' || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
          throw new AppError('Value must be a valid hex color (e.g., #ffffff or #fff)', 400);
        }
        break;

      case 'JSON':
        if (typeof value !== 'object' || value === null) {
          throw new AppError('Value must be a valid JSON object', 400);
        }
        break;

      case 'IMAGE_URL':
      case 'URL':
        if (typeof value !== 'string') {
          throw new AppError('Value must be a string URL', 400);
        }
        // Basic URL validation
        try {
          new URL(value);
        } catch {
          throw new AppError('Value must be a valid URL', 400);
        }
        break;

      default:
        throw new AppError('Invalid parameter type', 400);
    }
  }

  /**
   * Invalidate all parameter caches
   * @returns {Promise<void>}
   */
  async invalidateCache() {
    if (!this.redis) {
      return;
    }

    try {
      // Get all keys matching the pattern
      const keys = await this.redis.keys(`${CACHE_KEY_PREFIX}*`);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
      // Don't throw - caching is optional
    }
  }
}
