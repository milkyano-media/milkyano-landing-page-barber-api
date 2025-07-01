// src/modules/square/schemas/index.js

export const getBarbersSchema = {
  tags: ['square'],
  summary: 'Get all barbers',
  description: 'Retrieves a list of all barbers/team members from Square',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'List of barbers retrieved successfully',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          givenName: { type: 'string' },
          familyName: { type: 'string' },
          displayName: { type: 'string' },
          email: { type: ['string', 'null'] },
          phoneNumber: { type: ['string', 'null'] },
          status: { type: 'string' },
          isOwner: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      }
    }
  }
};

export const getBarberDetailsSchema = {
  tags: ['square'],
  summary: 'Get barber details',
  description: 'Retrieves detailed information about a specific barber/team member from Square',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The barber/team member ID' }
    },
    required: ['id']
  },
  response: {
    200: {
      description: 'Barber details retrieved successfully',
      type: 'object',
      properties: {
        id: { type: 'string' },
        givenName: { type: 'string' },
        familyName: { type: 'string' },
        displayName: { type: 'string' },
        email: { type: ['string', 'null'] },
        phoneNumber: { type: ['string', 'null'] },
        status: { type: 'string' },
        isOwner: { type: 'boolean' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
      }
    }
  }
};

export const getServicesSchema = {
  tags: ['square'],
  summary: 'Get available services',
  description: 'Retrieves a list of all available services from Square catalog',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      filter: { type: 'string', description: 'Filter services by name or category' },
      type: { type: 'string', description: 'Service type filter' }
    }
  },
  response: {
    200: {
      description: 'List of services retrieved successfully',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          category: { type: ['string', 'null'] },
          variations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                price: {
                  type: 'object',
                  properties: {
                    amount: { type: ['number', 'null'] },
                    currency: { type: ['string', 'null'] }
                  }
                },
                serviceDuration: { type: ['number', 'null'] },
                availableForBooking: { type: 'boolean' }
              }
            }
          },
          isDeleted: { type: 'boolean' },
          updatedAt: { type: 'string' }
        }
      }
    }
  }
};

export const checkAvailabilitySchema = {
  tags: ['square'],
  summary: 'Check booking availability',
  description: 'Checks availability for booking a service with specific team members in a given time range',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['serviceVariationId', 'startAt', 'endAt'],
    properties: {
      serviceVariationId: { type: 'string', description: 'The ID of the service variation to check availability for' },
      startAt: { 
        type: 'string',
        format: 'date-time',
        description: 'Start of the time range to check (ISO 8601 date-time)'
      },
      endAt: { 
        type: 'string',
        format: 'date-time',
        description: 'End of the time range to check (ISO 8601 date-time)'
      },
      teamMemberIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional list of specific team member IDs to check'
      }
    }
  },
  response: {
    200: {
      description: 'Available time slots retrieved successfully',
      type: 'object',
      properties: {
        availabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startAt: { type: 'string' },
              locationId: { type: 'string' },
              appointmentSegments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    durationMinutes: { type: 'number' },
                    serviceVariationId: { type: 'string' },
                    teamMemberId: { type: 'string' },
                    serviceVariationVersion: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export const createBookingSchema = {
  tags: ['square'],
  summary: 'Create a new booking',
  description: 'Creates a new booking appointment with Square for an authenticated customer',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['serviceVariationId', 'teamMemberId', 'startAt'],
    properties: {
      serviceVariationId: { type: 'string', description: 'The ID of the service variation to book' },
      teamMemberId: { type: 'string', description: 'The ID of the team member to book with' },
      startAt: { 
        type: 'string',
        format: 'date-time',
        description: 'The appointment start time (ISO 8601 date-time)'
      },
      customerNote: { 
        type: 'string',
        maxLength: 500,
        description: 'Optional note from the customer about the appointment'
      }
    }
  },
  response: {
    200: {
      description: 'Booking created successfully',
      type: 'object',
      properties: {
        id: { type: 'string' },
        version: { type: 'number' },
        status: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        startAt: { type: 'string' },
        locationId: { type: 'string' },
        customerId: { type: 'string' },
        customerNote: { type: ['string', 'null'] },
        appointmentSegments: {
          type: 'array',
          items: {
            type: 'object'
          }
        }
      }
    }
  }
};

export const getBookingDetailsSchema = {
  tags: ['square'],
  summary: 'Get booking details',
  description: 'Retrieves detailed information about a specific booking',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The booking ID' }
    },
    required: ['id']
  },
  response: {
    200: {
      description: 'Booking details retrieved successfully',
      type: 'object',
      properties: {
        id: { type: 'string' },
        version: { type: 'number' },
        status: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        startAt: { type: 'string' },
        locationId: { type: 'string' },
        customerId: { type: 'string' },
        customerNote: { type: ['string', 'null'] },
        appointmentSegments: {
          type: 'array',
          items: {
            type: 'object'
          }
        },
        source: { type: 'string' }
      }
    }
  }
};

export const cancelBookingSchema = {
  tags: ['square'],
  summary: 'Cancel a booking',
  description: 'Cancels an existing booking appointment',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The booking ID to cancel' }
    },
    required: ['id']
  },
  body: {
    type: 'object',
    required: ['bookingVersion'],
    properties: {
      bookingVersion: { 
        type: 'number',
        description: 'Version number for optimistic concurrency control'
      }
    }
  },
  response: {
    200: {
      description: 'Booking cancelled successfully',
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        updatedAt: { type: 'string' },
        canceledAt: { type: 'string' }
      }
    }
  }
};