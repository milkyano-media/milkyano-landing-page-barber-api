// src/modules/square/service.js
import { getSquareClient, SQUARE_LOCATION_ID } from './utils/client.js';
import { AppError } from '../../utils/errors.js';

export default class SquareService {
  constructor() {
    this.client = getSquareClient();
    this.locationId = SQUARE_LOCATION_ID;
  }

  /**
   * Get all barbers (team members)
   * @returns {Promise<Array>} List of barbers
   */
  async getBarbers() {
    try {
      const requestBody = {
        query: {
          filter: {
            location_ids: [this.locationId],
            status: 'ACTIVE'
          }
        }
      };

      const response = await this.client.post('/team-members/search', requestBody);
      const teamMembers = response.data.team_members || [];

      return teamMembers.map(member => ({
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
      }));
    } catch (error) {
      console.error('Square getBarbers error:', error);
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
   * Get all services (catalog items)
   * @param {string} filter - Optional filter (e.g., 'HAIR', 'BEARD')
   * @param {string} type - Optional type filter
   * @returns {Promise<Array>} List of services
   */
  async getServices(filter, type) {
    try {
      const response = await this.client.get('/catalog/list', {
        params: {
          types: 'ITEM'
        }
      });

      let services = response.data.objects?.filter(item => {
        // Filter for service items (not products)
        return item.type === 'ITEM' && 
               item.item_data?.product_type === 'APPOINTMENTS_SERVICE';
      }) || [];

      // Apply custom filters if provided
      if (filter) {
        services = services.filter(service => {
          const name = service.item_data?.name?.toLowerCase() || '';
          const description = service.item_data?.description?.toLowerCase() || '';
          const filterLower = filter.toLowerCase();
          return name.includes(filterLower) || description.includes(filterLower);
        });
      }

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
      console.error('Square getServices error:', error);
      throw new AppError(500, 'Failed to fetch services');
    }
  }

  /**
   * Check availability for a service
   * @param {Object} params - Availability search parameters
   * @returns {Promise<Object>} Availability slots
   */
  async checkAvailability({ serviceVariationId, startAt, endAt, teamMemberIds }) {
    try {
      const searchRequest = {
        query: {
          filter: {
            locationId: this.locationId,
            segmentFilters: [{
              serviceVariationId,
              teamMemberIdFilter: {
                any: teamMemberIds || []
              }
            }],
            startAtRange: {
              startAt,
              endAt
            }
          }
        }
      };

      const { result } = await this.client.bookings.searchAvailability(searchRequest);

      return {
        availabilities: result.availabilities?.map(slot => ({
          startAt: slot.startAt,
          locationId: slot.locationId,
          appointmentSegments: slot.appointmentSegments?.map(segment => ({
            durationMinutes: segment.durationMinutes,
            serviceVariationId: segment.serviceVariationId,
            teamMemberId: segment.teamMemberId,
            serviceVariationVersion: segment.serviceVariationVersion
          }))
        })) || []
      };
    } catch (error) {
      console.error('Square checkAvailability error:', error);
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
      
      const booking = {
        customerId,
        startAt,
        locationId: this.locationId,
        appointmentSegments: [{
          durationMinutes: serviceDetails.durationMinutes || 30,
          serviceVariationId,
          teamMemberId,
          serviceVariationVersion: serviceDetails.version
        }],
        customerNote
      };

      const { result } = await this.client.bookings.createBooking({ booking });

      return {
        id: result.booking.id,
        version: result.booking.version,
        status: result.booking.status,
        createdAt: result.booking.createdAt,
        updatedAt: result.booking.updatedAt,
        startAt: result.booking.startAt,
        locationId: result.booking.locationId,
        customerId: result.booking.customerId,
        customerNote: result.booking.customerNote,
        appointmentSegments: result.booking.appointmentSegments
      };
    } catch (error) {
      console.error('Square createBooking error:', error);
      if (error.errors?.[0]?.code === 'INVALID_VALUE') {
        throw new AppError(400, error.errors[0].detail || 'Invalid booking data');
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
      const { result } = await this.client.bookings.retrieveBooking(bookingId);
      
      return {
        id: result.booking.id,
        version: result.booking.version,
        status: result.booking.status,
        createdAt: result.booking.createdAt,
        updatedAt: result.booking.updatedAt,
        startAt: result.booking.startAt,
        locationId: result.booking.locationId,
        customerId: result.booking.customerId,
        customerNote: result.booking.customerNote,
        appointmentSegments: result.booking.appointmentSegments,
        source: result.booking.source
      };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new AppError(404, 'Booking not found');
      }
      console.error('Square getBookingDetails error:', error);
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
      const { result } = await this.client.bookings.cancelBooking(bookingId, {
        bookingVersion
      });
      
      return {
        id: result.booking.id,
        status: result.booking.status,
        updatedAt: result.booking.updatedAt,
        canceledAt: result.booking.canceledAt
      };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new AppError(404, 'Booking not found');
      }
      console.error('Square cancelBooking error:', error);
      throw new AppError(500, 'Failed to cancel booking');
    }
  }

  /**
   * Helper method to get service variation details
   * @private
   */
  async _getServiceVariationDetails(serviceVariationId) {
    try {
      const { result } = await this.client.catalog.retrieveCatalogObject(serviceVariationId);
      
      return {
        durationMinutes: result.object?.itemVariationData?.serviceDuration / 60000, // Convert ms to minutes
        version: result.object?.version
      };
    } catch (error) {
      console.error('Failed to get service variation details:', error);
      return { durationMinutes: 30 }; // Default to 30 minutes
    }
  }
}