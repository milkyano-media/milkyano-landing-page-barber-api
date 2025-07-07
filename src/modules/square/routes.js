// src/modules/square/routes.js
import {
  getBarbers,
  getBarberDetails,
  getServices,
  checkAvailability,
  createBooking,
  getBookingDetails,
  cancelBooking,
  createCustomer,
  findCustomer,
  getCustomerStatus
} from './handlers.js';

import {
  getBarbersSchema,
  getBarberDetailsSchema,
  getServicesSchema,
  checkAvailabilitySchema,
  createBookingSchema,
  getBookingDetailsSchema,
  cancelBookingSchema,
  createCustomerSchema,
  findCustomerSchema,
  getCustomerStatusSchema
} from './schemas/index.js';

export default async function squareRoutes(fastify, opts) {
  // Public routes - no authentication required
  fastify.get('/barbers', {
    schema: {
      ...getBarbersSchema,
      tags: ['square'],
      summary: 'Get all barbers'
    },
    handler: getBarbers
  });

  fastify.get('/barbers/:id', {
    schema: {
      ...getBarberDetailsSchema,
      tags: ['square'],
      summary: 'Get barber details'
    },
    handler: getBarberDetails
  });

  fastify.get('/services', {
    schema: {
      ...getServicesSchema,
      tags: ['square'],
      summary: 'Get all services'
    },
    handler: getServices
  });

  fastify.post('/availability', {
    schema: {
      ...checkAvailabilitySchema,
      tags: ['square'],
      summary: 'Check availability for a service'
    },
    handler: checkAvailability
  });

  // Customer routes - public
  fastify.post('/customers', {
    schema: {
      ...createCustomerSchema,
      tags: ['square'],
      summary: 'Create a customer'
    },
    handler: createCustomer
  });

  fastify.get('/customers/search', {
    schema: {
      ...findCustomerSchema,
      tags: ['square'],
      summary: 'Find customer by email and phone'
    },
    handler: findCustomer
  });

  fastify.get('/customers/status', {
    schema: {
      ...getCustomerStatusSchema,
      tags: ['square'],
      summary: 'Check if customer exists'
    },
    handler: getCustomerStatus
  });

  // Protected routes - authentication required
  fastify.post('/bookings', {
    preHandler: [fastify.authenticate],
    schema: {
      ...createBookingSchema,
      tags: ['square'],
      summary: 'Create a booking',
      security: [{ bearerAuth: [] }]
    },
    handler: createBooking
  });

  fastify.get('/bookings/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      ...getBookingDetailsSchema,
      tags: ['square'],
      summary: 'Get booking details',
      security: [{ bearerAuth: [] }]
    },
    handler: getBookingDetails
  });

  fastify.post('/bookings/:id/cancel', {
    preHandler: [fastify.authenticate],
    schema: {
      ...cancelBookingSchema,
      tags: ['square'],
      summary: 'Cancel a booking',
      security: [{ bearerAuth: [] }]
    },
    handler: cancelBooking
  });
}