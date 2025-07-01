// src/modules/customers/routes.js
import {
  getProfile,
  updateProfile,
  getBookings,
  getStatistics
} from './handlers.js';

import {
  getProfileSchema,
  updateProfileSchema,
  getBookingsSchema,
  getStatisticsSchema
} from './schemas/index.js';

export default async function customerRoutes(fastify, opts) {
  // All customer routes require authentication and customer role
  const customerOnlyOpts = {
    preHandler: [fastify.customerOnly]
  };

  fastify.get('/profile', {
    ...customerOnlyOpts,
    schema: {
      ...getProfileSchema,
      tags: ['customers'],
      summary: 'Get customer profile',
      security: [{ bearerAuth: [] }]
    },
    handler: getProfile
  });

  fastify.put('/profile', {
    ...customerOnlyOpts,
    schema: {
      ...updateProfileSchema,
      tags: ['customers'],
      summary: 'Update customer profile',
      security: [{ bearerAuth: [] }]
    },
    handler: updateProfile
  });

  fastify.get('/bookings', {
    ...customerOnlyOpts,
    schema: {
      ...getBookingsSchema,
      tags: ['customers'],
      summary: 'Get customer bookings',
      security: [{ bearerAuth: [] }]
    },
    handler: getBookings
  });

  fastify.get('/statistics', {
    ...customerOnlyOpts,
    schema: {
      ...getStatisticsSchema,
      tags: ['customers'],
      summary: 'Get customer statistics',
      security: [{ bearerAuth: [] }]
    },
    handler: getStatistics
  });
}