// src/server.js
import buildApp from './app.js';
import 'dotenv/config';

const app = buildApp({
  // We'll override the default Fastify logging behavior
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true,
        // Customize log output
        messageFormat: '{msg}',
        // Suppress the default Fastify startup messages
        suppressFlushSyncWarning: true
      }
    },
    // Disable default listen logs that show all bound addresses
    disableRequestLogging: true
  }
});

const start = async () => {
  try {
    // Wait for the app to be ready (plugins loaded)
    await app.ready();
    
    // Clear Redis cache on startup if Redis is available
    if (app.redis) {
      try {
        await app.redis.flushdb();
        app.log.info('🧹 Redis cache cleared on startup');
      } catch (redisError) {
        app.log.warn('⚠️  Failed to clear Redis cache:', redisError.message);
      }
    }
    
    const port = process.env.PORT || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    
    // Custom formatted server startup message
    const serverUrl = `http://localhost:${port}`;
    const docsUrl = `${serverUrl}/documentation`;
    const apiUrl = `${serverUrl}/api`;
    
    // Clear console and show a neat banner
    console.clear();
    app.log.info('='.repeat(60));
    app.log.info(`✅ Server successfully started!`);
    app.log.info(`🚀 Server running at: ${serverUrl}`);
    app.log.info(`📚 API Documentation: ${docsUrl}`);
    app.log.info(`🔌 API Endpoints: ${apiUrl}`);
    app.log.info(`🔍 Health Check: ${serverUrl}/health`);
    if (app.redis) {
      app.log.info(`🗄️  Redis Cache: Connected and cleared`);
    }
    app.log.info('='.repeat(60));
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();