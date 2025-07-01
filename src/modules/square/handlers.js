// src/modules/square/handlers.js
import SquareService from './service.js';

async function getBarbers(request, reply) {
  const squareService = new SquareService();
  const cacheKey = 'barbers:all';
  const cacheTTL = parseInt(process.env.CACHE_TTL_BARBERS || '86400'); // 1 day default
  
  try {
    // Check cache if Redis is available
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return reply.code(200).send(JSON.parse(cached));
      }
    }
    
    const barbers = await squareService.getBarbers();
    
    // Cache the result if Redis is available
    if (this.redis && barbers.length > 0) {
      await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(barbers));
    }
    
    return reply.code(200).send(barbers);
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal server error' 
    });
  }
}

async function getBarberDetails(request, reply) {
  const squareService = new SquareService();
  const cacheKey = `barbers:${request.params.id}`;
  const cacheTTL = parseInt(process.env.CACHE_TTL_BARBERS || '86400'); // 1 day default
  
  try {
    // Check cache if Redis is available
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
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
      error: 'Internal server error' 
    });
  }
}

async function getServices(request, reply) {
  const squareService = new SquareService();
  const { filter, type } = request.query;
  const cacheKey = `services:${filter || 'all'}:${type || 'all'}`;
  const cacheTTL = parseInt(process.env.CACHE_TTL_SERVICES || '86400'); // 1 day default
  
  try {
    // Check cache if Redis is available
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return reply.code(200).send(JSON.parse(cached));
      }
    }
    
    const services = await squareService.getServices(filter, type);
    
    // Cache the result if Redis is available
    if (this.redis && services.length > 0) {
      await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(services));
    }
    
    return reply.code(200).send(services);
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal server error' 
    });
  }
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
      error: 'Internal server error' 
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
      error: 'Internal server error' 
    });
  }
}

async function getBookingDetails(request, reply) {
  const squareService = new SquareService();
  
  try {
    const booking = await squareService.getBookingDetails(request.params.id);
    
    // For customers, only allow viewing their own bookings
    if (request.user.role === 'CUSTOMER' && booking.customerId !== request.user.id) {
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: 'You can only view your own bookings'
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
      error: 'Internal server error' 
    });
  }
}

async function cancelBooking(request, reply) {
  const squareService = new SquareService();
  
  try {
    // First get booking details to verify ownership
    const booking = await squareService.getBookingDetails(request.params.id);
    
    // For customers, only allow canceling their own bookings
    if (request.user.role === 'CUSTOMER' && booking.customerId !== request.user.id) {
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: 'You can only cancel your own bookings'
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
      error: 'Internal server error' 
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