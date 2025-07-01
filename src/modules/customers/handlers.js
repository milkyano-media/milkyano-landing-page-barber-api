// src/modules/customers/handlers.js
import CustomerService from './service.js';

async function getProfile(request, reply) {
  const customerService = new CustomerService(this.prisma);
  
  try {
    // Customers can only get their own profile
    if (request.user.role !== 'CUSTOMER') {
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: 'Only customers can access this endpoint'
      });
    }
    
    const profile = await customerService.getProfile(request.user.sub);
    return reply.code(200).send(profile);
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

async function updateProfile(request, reply) {
  const customerService = new CustomerService(this.prisma);
  
  try {
    // Customers can only update their own profile
    if (request.user.role !== 'CUSTOMER') {
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: 'Only customers can access this endpoint'
      });
    }
    
    const updatedProfile = await customerService.updateProfile(
      request.user.sub,
      request.body
    );
    
    return reply.code(200).send(updatedProfile);
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

async function getBookings(request, reply) {
  const customerService = new CustomerService(this.prisma);
  
  try {
    // Customers can only get their own bookings
    if (request.user.role !== 'CUSTOMER') {
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: 'Only customers can access this endpoint'
      });
    }
    
    const bookings = await customerService.getBookings(
      request.user.sub,
      request.query
    );
    
    return reply.code(200).send(bookings);
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

async function getStatistics(request, reply) {
  const customerService = new CustomerService(this.prisma);
  
  try {
    // Customers can only get their own statistics
    if (request.user.role !== 'CUSTOMER') {
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: 'Only customers can access this endpoint'
      });
    }
    
    const statistics = await customerService.getStatistics(request.user.sub);
    return reply.code(200).send(statistics);
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
  getProfile,
  updateProfile,
  getBookings,
  getStatistics
};