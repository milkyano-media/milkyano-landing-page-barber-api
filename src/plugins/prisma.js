// src/plugins/prisma.js
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

export default fp(async function(fastify, opts) {
  // Construct DATABASE_URL from individual components
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'barber_core_api_db';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'password';
  
  const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  await prisma.$connect();

  // Make Prisma Client available through the fastify instance
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
});