// src/plugins/redis.js
import fp from 'fastify-plugin';
import Redis from 'ioredis';

async function redisPlugin(fastify, opts) {
  // Skip Redis if URL not provided
  if (!process.env.REDIS_URL) {
    fastify.log.warn('Redis URL not provided, caching disabled');
    return;
  }

  try {
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    // Handle connection events
    redis.on('connect', () => {
      fastify.log.info('Redis connected');
    });

    redis.on('error', (err) => {
      fastify.log.error({ err }, 'Redis error');
    });

    // Connect to Redis
    await redis.connect();

    // Decorate fastify instance
    fastify.decorate('redis', redis);

    // Ensure Redis is closed when app shuts down
    fastify.addHook('onClose', async (instance) => {
      await instance.redis.quit();
    });
  } catch (error) {
    fastify.log.error({ error }, 'Failed to initialize Redis');
    // Continue without Redis - caching will be disabled
  }
}

export default fp(redisPlugin, {
  name: 'redis'
});