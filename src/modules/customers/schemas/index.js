// src/modules/customers/schemas/index.js

export const getProfileSchema = {
  tags: ['customers'],
  summary: 'Get customer profile',
  description: 'Retrieves the authenticated customer\'s profile information',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Customer profile retrieved successfully',
      type: 'object',
      properties: {
        id: { type: 'string' },
        phoneNumber: { type: 'string' },
        email: { type: ['string', 'null'] },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        isVerified: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

export const updateProfileSchema = {
  tags: ['customers'],
  summary: 'Update customer profile',
  description: 'Updates the authenticated customer\'s profile information. At least one field must be provided.',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Customer\'s first name'
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Customer\'s last name'
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255,
        description: 'Customer\'s email address'
      }
    },
    minProperties: 1 // At least one field must be provided
  },
  response: {
    200: {
      description: 'Customer profile updated successfully',
      type: 'object',
      properties: {
        id: { type: 'string' },
        phoneNumber: { type: 'string' },
        email: { type: ['string', 'null'] },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        isVerified: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

export const getBookingsSchema = {
  tags: ['customers'],
  summary: 'Get customer bookings',
  description: 'Retrieves all bookings for the authenticated customer with optional filters',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        format: 'date-time',
        description: 'Filter bookings starting from this date'
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        description: 'Filter bookings up to this date'
      },
      status: {
        type: 'string',
        enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'],
        description: 'Filter by booking status'
      }
    }
  },
  response: {
    200: {
      description: 'List of customer bookings retrieved successfully',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string' },
          startAt: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
          customerNote: { type: ['string', 'null'] },
          appointmentSegments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                durationMinutes: { type: 'number' },
                serviceVariationId: { type: 'string' },
                teamMemberId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

export const getStatisticsSchema = {
  tags: ['customers'],
  summary: 'Get customer statistics',
  description: 'Retrieves booking statistics for the authenticated customer',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Customer booking statistics retrieved successfully',
      type: 'object',
      properties: {
        totalBookings: { type: 'number', description: 'Total number of bookings' },
        upcomingBookings: { type: 'number', description: 'Number of upcoming bookings' },
        pastBookings: { type: 'number', description: 'Number of past bookings' },
        cancelledBookings: { type: 'number', description: 'Number of cancelled bookings' },
        lastBookingDate: { type: ['string', 'null'], description: 'Date of the last booking' },
        nextBookingDate: { type: ['string', 'null'], description: 'Date of the next upcoming booking' }
      }
    }
  }
};