// src/modules/square/service.js
import { getSquareClient, SQUARE_LOCATION_ID } from './utils/client.js';
import { AppError } from '../../utils/errors.js';

export default class SquareService {
  constructor(prisma) {
    this.client = getSquareClient();
    this.locationId = SQUARE_LOCATION_ID;
    this.prisma = prisma;
  }

  /**
   * Get all barbers (team members) using booking profiles endpoint
   * @returns {Promise<Array>} List of barbers with booking profiles
   */
  async getBarbers() {
    try {
      console.log('Fetching team member booking profiles...');
      
      const response = await this.client.get('/bookings/team-member-booking-profiles', {
        params: {
          bookable_only: true,
          location_id: this.locationId
        }
      });

      const profiles = response.data.team_member_booking_profiles || [];
      console.log(`Found ${profiles.length} booking profiles`);

      // Return the profiles with normalized field names
      return profiles.map(profile => ({
        id: profile.team_member_id,
        displayName: profile.display_name,
        isBookable: profile.is_bookable || true,
        // These fields are not in the booking profile response, but we keep them for compatibility
        givenName: null,
        familyName: null,
        email: null,
        phoneNumber: null,
        status: 'ACTIVE',
        isOwner: false,
        createdAt: null,
        updatedAt: null
      }));
    } catch (error) {
      console.error('Square getBarbers error:', error.response?.data || error.message);
      throw new AppError(500, 'Failed to fetch barbers');
    }
  }

  /**
   * Get barber details
   * @param {string} barberId - Team member ID
   * @returns {Promise<Object>} Barber details
   */
  async getBarberDetails(barberId) {
    try {
      const response = await this.client.get(`/team-members/${barberId}`);
      const member = response.data.team_member;

      if (!member) {
        throw new AppError(404, 'Barber not found');
      }

      return {
        id: member.id,
        givenName: member.given_name,
        familyName: member.family_name,
        displayName: `${member.given_name || ''} ${member.family_name || ''}`.trim(),
        email: member.email_address,
        phoneNumber: member.phone_number,
        status: member.status,
        isOwner: member.is_owner || false,
        createdAt: member.created_at,
        updatedAt: member.updated_at
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new AppError(404, 'Barber not found');
      }
      console.error('Square getBarberDetails error:', error);
      throw new AppError(500, 'Failed to fetch barber details');
    }
  }

  /**
   * Get all services (catalog items) using search endpoint
   * @param {string} filter - Barber name filter (e.g., 'Rayhan', 'all')
   * @param {string} type - Service type filter (e.g., 'O', 'M')
   * @returns {Promise<Array>} List of services
   */
  async getServices(filter, type) {
    try {
      // Build search text based on filter
      let searchText;
      if (filter === 'all' || !filter) {
        searchText = 'By'; // Matches all services like "Hair By X", "Beard By Y"
      } else {
        searchText = filter;
      }

      // Build search request
      const requestBody = {
        object_types: ['ITEM'],
        query: {
          text_query: {
            keywords: type ? [`${searchText} (${type})`] : [searchText]
          }
        }
      };

      console.log('Searching catalog with:', requestBody);
      const response = await this.client.post('/catalog/search', requestBody);

      let services = response.data.objects || [];

      // Filter by type if specified
      if (type) {
        services = services.filter(item => 
          item.item_data?.name?.includes(`(${type})`)
        );
      }

      // Only include appointment services
      services = services.filter(item => 
        item.type === 'ITEM' && 
        item.item_data?.product_type === 'APPOINTMENTS_SERVICE'
      );

      return services.map(service => ({
        id: service.id,
        name: service.item_data?.name,
        description: service.item_data?.description,
        category: service.item_data?.category_id,
        variations: service.item_data?.variations?.map(variation => ({
          id: variation.id,
          name: variation.item_variation_data?.name,
          price: {
            amount: variation.item_variation_data?.price_money?.amount,
            currency: variation.item_variation_data?.price_money?.currency
          },
          serviceDuration: variation.item_variation_data?.service_duration,
          availableForBooking: variation.item_variation_data?.available_for_booking !== false,
          teamMemberIds: variation.item_variation_data?.team_member_ids || []
        })) || [],
        isDeleted: service.is_deleted || false,
        updatedAt: service.updated_at
      }));
    } catch (error) {
      console.error('Square getServices error:', error.response?.data || error.message);
      throw new AppError(500, 'Failed to fetch services');
    }
  }

  /**
   * Check availability for a service
   * @param {Object} params - Availability search parameters
   * @returns {Promise<Object>} Availability slots
   */
  async checkAvailability({ serviceVariationId, startAt, endAt }) {
    try {
      const requestBody = {
        query: {
          filter: {
            start_at_range: {
              start_at: startAt,
              end_at: endAt
            },
            segment_filters: [
              {
                service_variation_id: serviceVariationId
              }
            ],
            location_id: this.locationId
          }
        }
      };

      console.log('Searching availability with:', JSON.stringify(requestBody, null, 2));
      const response = await this.client.post('/bookings/availability/search', requestBody);
      
      // Ensure we have the availabilities array
      const availabilities = response.data.availabilities || [];
      
      console.log(`Found ${availabilities.length} availability slots`);
      
      // Return a properly structured response
      return {
        availabilities: availabilities,
        errors: response.data.errors || []
      };
    } catch (error) {
      console.error('Square checkAvailability error:', error.response?.data || error.message);
      throw new AppError(500, 'Failed to check availability');
    }
  }

  /**
   * Create a booking
   * @param {Object} bookingRequest - Booking request in Square format
   * @returns {Promise<Object>} Created booking
   */
  async createBooking(bookingRequest) {
    try {
      // Extract the booking object from the request
      const { booking } = bookingRequest;
      
      // Check if we need to translate user ID to Square customer ID
      let finalCustomerId = booking.customer_id;
      
      if (this.prisma && booking.customer_id) {
        const user = await this.prisma.user.findUnique({
          where: { id: booking.customer_id }
        });
        
        if (user) {
          if (user.squareupId) {
            // User has Square customer ID, use it
            console.log(`Using existing Square ID ${user.squareupId} for user ${user.id}`);
            finalCustomerId = user.squareupId;
          } else {
            // User exists but no Square customer yet, create one
            console.log(`Creating Square customer for user ${user.id}`);
            const idempotencyKey = `migrate-${user.phoneNumber}-${Date.now()}`;
            
            try {
              const customerResponse = await this.client.post('/customers', {
                idempotency_key: idempotencyKey,
                given_name: user.firstName,
                family_name: user.lastName,
                phone_number: user.phoneNumber,
                email_address: user.email
              });
              
              const newSquareCustomerId = customerResponse.data.customer.id;
              console.log(`Created Square customer ${newSquareCustomerId} for user ${user.id}`);
              
              // Update user with Square customer ID
              await this.prisma.user.update({
                where: { id: user.id },
                data: { squareupId: newSquareCustomerId }
              });
              
              finalCustomerId = newSquareCustomerId;
            } catch (customerError) {
              console.error('Failed to create Square customer:', customerError.response?.data || customerError.message);
              throw new AppError(500, 'Failed to create customer in Square');
            }
          }
        }
      }
      
      // Add required fields if not present
      const requestBody = {
        booking: {
          ...booking,
          customer_id: finalCustomerId,
          location_type: 'BUSINESS_LOCATION',
          seller_note: booking.seller_note || ''
        }
      };

      console.log('Creating booking with:', JSON.stringify(requestBody, null, 2));
      const response = await this.client.post('/bookings', requestBody);
      
      // Return the complete booking object from Square
      return response.data.booking;
    } catch (error) {
      console.error('Square createBooking error:', error.response?.data || error.message);
      if (error.response?.data?.errors?.[0]?.code === 'INVALID_VALUE') {
        throw new AppError(400, error.response.data.errors[0].detail || 'Invalid booking data');
      }
      throw new AppError(500, 'Failed to create booking');
    }
  }

  /**
   * Get booking details
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Booking details
   */
  async getBookingDetails(bookingId) {
    try {
      const response = await this.client.get(`/bookings/${bookingId}`);
      const booking = response.data.booking;
      
      return {
        id: booking.id,
        version: booking.version,
        status: booking.status,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        startAt: booking.start_at,
        locationId: booking.location_id,
        customerId: booking.customer_id,
        customerNote: booking.customer_note,
        appointmentSegments: booking.appointment_segments,
        source: booking.source
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new AppError(404, 'Booking not found');
      }
      console.error('Square getBookingDetails error:', error.response?.data || error.message);
      throw new AppError(500, 'Failed to fetch booking details');
    }
  }

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking ID
   * @param {number} bookingVersion - Booking version for optimistic concurrency
   * @returns {Promise<Object>} Cancelled booking
   */
  async cancelBooking(bookingId, bookingVersion) {
    try {
      const requestBody = {
        booking_version: bookingVersion
      };
      
      const response = await this.client.post(`/bookings/${bookingId}/cancel`, requestBody);
      const booking = response.data.booking;
      
      return {
        id: booking.id,
        status: booking.status,
        updatedAt: booking.updated_at,
        canceledAt: booking.canceled_at
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new AppError(404, 'Booking not found');
      }
      console.error('Square cancelBooking error:', error.response?.data || error.message);
      throw new AppError(500, 'Failed to cancel booking');
    }
  }

  /**
   * Create a customer
   * @param {Object} customerData - Customer details
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customerData) {
    try {
      const response = await this.client.post('/customers', customerData);
      return response.data;
    } catch (error) {
      console.error('Square createCustomer error:', error.response?.data || error.message);
      if (error.response?.data?.errors?.[0]?.code === 'INVALID_VALUE') {
        throw new AppError(400, error.response.data.errors[0].detail || 'Invalid customer data');
      }
      throw new AppError(500, 'Failed to create customer');
    }
  }

  /**
   * Search for customers by email and phone
   * @param {string} email - Customer email
   * @param {string} phone - Customer phone number
   * @returns {Promise<Object|null>} Customer if found, null otherwise
   */
  async findCustomerByEmailAndPhone(email, phone) {
    try {
      // First try to search by email
      const emailSearchBody = {
        filter: {
          email_address: {
            exact: email
          }
        }
      };

      console.log('Searching for customer with email:', email);
      const emailResponse = await this.client.post('/customers/search', emailSearchBody);
      const customersByEmail = emailResponse.data.customers || [];
      
      // If we found customers by email, check if any match the phone number
      if (customersByEmail.length > 0) {
        const matchingCustomer = customersByEmail.find(customer => 
          customer.phone_number === phone
        );
        
        if (matchingCustomer) {
          console.log('Found customer matching both email and phone');
          return matchingCustomer;
        }
      }
      
      // If no match found by email+phone, try searching by phone
      const phoneSearchBody = {
        filter: {
          phone_number: {
            exact: phone
          }
        }
      };
      
      console.log('Searching for customer with phone:', phone);
      const phoneResponse = await this.client.post('/customers/search', phoneSearchBody);
      const customersByPhone = phoneResponse.data.customers || [];
      
      // Check if any match the email
      const matchingCustomer = customersByPhone.find(customer => 
        customer.email_address === email
      );
      
      return matchingCustomer || null;
    } catch (error) {
      console.error('Square findCustomer error:', error.response?.data || error.message);
      // Return null instead of throwing to indicate customer not found
      return null;
    }
  }

  /**
   * Helper method to get service variation details
   * @private
   */
  async _getServiceVariationDetails(serviceVariationId) {
    try {
      const response = await this.client.get(`/catalog/object/${serviceVariationId}`);
      const object = response.data.object;
      
      return {
        durationMinutes: object?.item_variation_data?.service_duration / 60000, // Convert ms to minutes
        version: object?.version
      };
    } catch (error) {
      console.error('Failed to get service variation details:', error);
      return { durationMinutes: 30, version: 1 }; // Default to 30 minutes
    }
  }
}