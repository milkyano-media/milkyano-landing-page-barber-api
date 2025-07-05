// src/modules/square/handlers.js
import SquareService from "./service.js";

async function getBarbers(request, reply) {
  const squareService = new SquareService();
  const cacheKey = "barbers:all";
  const cacheTTL = parseInt(process.env.CACHE_TTL_BARBERS || "86400"); // 1 day default

  try {
    // Check cache if Redis is available
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log("getBarbers from cache");
        const cachedData = JSON.parse(cached);
        // Return wrapped response for frontend compatibility
        return reply.code(200).send({
          team_member_booking_profiles: cachedData.map(barber => ({
            team_member_id: barber.id,
            display_name: barber.displayName,
            is_bookable: barber.isBookable !== undefined ? barber.isBookable : true
          }))
        });
      }
    }

    const barbers = await squareService.getBarbers();

    // Cache the result if Redis is available
    if (this.redis && barbers.length > 0) {
      await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(barbers));
    }

    // Return wrapped response for frontend compatibility
    return reply.code(200).send({
      team_member_booking_profiles: barbers.map(barber => ({
        team_member_id: barber.id,
        display_name: barber.displayName,
        is_bookable: barber.isBookable !== undefined ? barber.isBookable : true
      }))
    });
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: "Internal server error"
    });
  }
}

async function getBarberDetails(request, reply) {
  const squareService = new SquareService();
  const cacheKey = `barbers:${request.params.id}`;
  const cacheTTL = parseInt(process.env.CACHE_TTL_BARBERS || "86400"); // 1 day default

  try {
    // Check cache if Redis is available
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log("getBarberDetails from cache");
        return reply.code(200).send(JSON.parse(cached));
      }
    }

    const barber = await squareService.getBarberDetails(request.params.id);

    // Cache the result if Redis is available
    if (this.redis) {
      await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(barber));
    }

    return reply.code(200).send(barber);
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: "Internal server error"
    });
  }
}

async function getServices(request, reply) {
  const squareService = new SquareService();
  const { filter, type } = request.query;
  const cacheKey = `services:${filter || "all"}:${type || "all"}`;
  const cacheTTL = parseInt(process.env.CACHE_TTL_SERVICES || "86400"); // 1 day default

  try {
    // Check cache if Redis is available
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log("getServices from cache");
        const cachedData = JSON.parse(cached);
        // Transform to match frontend expectations
        const transformedServices = transformServices(cachedData);
        return reply.code(200).send({
          objects: transformedServices,
          cursor: '',
          matched_variation_ids: []
        });
      }
    }

    const services = await squareService.getServices(filter, type);

    // Cache the result if Redis is available
    if (this.redis && services.length > 0) {
      await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(services));
    }

    // Transform to match frontend expectations
    const transformedServices = transformServices(services);
    return reply.code(200).send({
      objects: transformedServices,
      cursor: '',
      matched_variation_ids: []
    });
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: "Internal server error"
    });
  }
}

// Helper function to transform services to match frontend format
function transformServices(services) {
  return services.map(service => ({
    type: 'ITEM',
    id: service.id,
    updated_at: service.updatedAt,
    created_at: service.updatedAt,
    version: 1,
    is_deleted: service.isDeleted,
    present_at_all_locations: true,
    item_data: {
      name: service.name,
      description: service.description,
      variations: service.variations.map(variation => ({
        type: 'ITEM_VARIATION',
        id: variation.id,
        updated_at: service.updatedAt,
        created_at: service.updatedAt,
        version: 1,
        is_deleted: false,
        present_at_all_locations: true,
        item_variation_data: {
          item_id: service.id,
          name: variation.name,
          ordinal: 0,
          pricing_type: 'FIXED_PRICING',
          price_money: variation.price,
          service_duration: variation.serviceDuration,
          price_description: `$${(variation.price.amount / 100).toFixed(2)} ${variation.price.currency} - ${Math.floor(variation.serviceDuration / 60000)} mins`,
          available_for_booking: variation.availableForBooking,
          sellable: true,
          stockable: false,
          team_member_ids: variation.teamMemberIds || []
        }
      })),
      product_type: 'APPOINTMENTS_SERVICE',
      skip_modifier_screen: false,
      visibility: 'PUBLIC',
      tax_ids: [],
      is_taxable: false,
      ecom_visibility: 'UNINDEXED',
      is_archived: false,
      channels: ['CH_WEBSTORE']
    }
  }));
}

async function checkAvailability(request, reply) {
  const squareService = new SquareService();

  try {
    const availability = await squareService.checkAvailability(request.body);
    return reply.code(200).send(availability);
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: "Internal server error"
    });
  }
}

async function createBooking(request, reply) {
  const squareService = new SquareService();

  try {
    // Add customer ID from authenticated user
    const bookingData = {
      ...request.body,
      customerId: request.user.id // Use the user's ID (which should be Square customer ID for customers)
    };

    const booking = await squareService.createBooking(bookingData);
    return reply.code(200).send(booking);
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: "Internal server error"
    });
  }
}

async function getBookingDetails(request, reply) {
  const squareService = new SquareService();

  try {
    const booking = await squareService.getBookingDetails(request.params.id);

    // For customers, only allow viewing their own bookings
    if (
      request.user.role === "CUSTOMER" &&
      booking.customerId !== request.user.id
    ) {
      return reply.code(403).send({
        error: "Forbidden",
        message: "You can only view your own bookings"
      });
    }

    return reply.code(200).send(booking);
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: "Internal server error"
    });
  }
}

async function cancelBooking(request, reply) {
  const squareService = new SquareService();

  try {
    // First get booking details to verify ownership
    const booking = await squareService.getBookingDetails(request.params.id);

    // For customers, only allow canceling their own bookings
    if (
      request.user.role === "CUSTOMER" &&
      booking.customerId !== request.user.id
    ) {
      return reply.code(403).send({
        error: "Forbidden",
        message: "You can only cancel your own bookings"
      });
    }

    const cancelledBooking = await squareService.cancelBooking(
      request.params.id,
      request.body.bookingVersion
    );

    return reply.code(200).send(cancelledBooking);
  } catch (error) {
    request.log.error(error);

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    return reply.code(500).send({
      error: "Internal server error"
    });
  }
}

export {
  getBarbers,
  getBarberDetails,
  getServices,
  checkAvailability,
  createBooking,
  getBookingDetails,
  cancelBooking
};
