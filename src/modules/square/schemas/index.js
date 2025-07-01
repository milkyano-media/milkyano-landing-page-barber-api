// src/modules/square/schemas/index.js

export const getBarbersSchema = {
  response: {
    200: {
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
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    },
    required: ['id']
  },
  response: {
    200: {
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
  querystring: {
    type: 'object',
    properties: {
      filter: { type: 'string' },
      type: { type: 'string' }
    }
  },
  response: {
    200: {
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
  body: {
    type: 'object',
    required: ['serviceVariationId', 'startAt', 'endAt'],
    properties: {
      serviceVariationId: { type: 'string' },
      startAt: { 
        type: 'string',
        format: 'date-time',
        description: 'ISO 8601 date-time'
      },
      endAt: { 
        type: 'string',
        format: 'date-time',
        description: 'ISO 8601 date-time'
      },
      teamMemberIds: {
        type: 'array',
        items: { type: 'string' }
      }
    }
  },
  response: {
    200: {
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
  body: {
    type: 'object',
    required: ['serviceVariationId', 'teamMemberId', 'startAt'],
    properties: {
      serviceVariationId: { type: 'string' },
      teamMemberId: { type: 'string' },
      startAt: { 
        type: 'string',
        format: 'date-time',
        description: 'ISO 8601 date-time'
      },
      customerNote: { 
        type: 'string',
        maxLength: 500
      }
    }
  },
  response: {
    200: {
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
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    },
    required: ['id']
  },
  response: {
    200: {
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
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
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