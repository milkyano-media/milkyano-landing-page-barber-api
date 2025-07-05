// src/modules/square/service.js
import { getSquareClient, SQUARE_LOCATION_ID } from './utils/client.js';
import { AppError } from '../../utils/errors.js';

export default class SquareService {
  constructor() {
    this.client = getSquareClient();
    this.locationId = SQUARE_LOCATION_ID;
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
   * @param {Object} bookingData - Booking details
   * @returns {Promise<Object>} Created booking
   */
  async createBooking(bookingData) {
    try {
      const { customerId, serviceVariationId, teamMemberId, startAt, customerNote } = bookingData;

      // Get service details to determine duration
      const serviceDetails = await this._getServiceVariationDetails(serviceVariationId);
      
      const requestBody = {
        booking: {
          customer_id: customerId,
          start_at: startAt,
          location_id: this.locationId,
          location_type: 'BUSINESS_LOCATION',
          appointment_segments: [{
            duration_minutes: Math.floor(serviceDetails.durationMinutes || 30),
            service_variation_id: serviceVariationId,
            team_member_id: teamMemberId,
            service_variation_version: serviceDetails.version || 1
          }],
          customer_note: customerNote || '',
          seller_note: ''
        }
      };

      console.log('Creating booking with:', requestBody);
      const response = await this.client.post('/bookings', requestBody);
      
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
        appointmentSegments: booking.appointment_segments
      };
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