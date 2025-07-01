// src/modules/customers/schemas/index.js

export const getProfileSchema = {
  response: {
    200: {
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
  body: {
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255
      }
    },
    minProperties: 1 // At least one field must be provided
  },
  response: {
    200: {
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
  response: {
    200: {
      type: 'object',
      properties: {
        totalBookings: { type: 'number' },
        upcomingBookings: { type: 'number' },
        pastBookings: { type: 'number' },
        cancelledBookings: { type: 'number' },
        lastBookingDate: { type: ['string', 'null'] },
        nextBookingDate: { type: ['string', 'null'] }
      }
    }
  }
};