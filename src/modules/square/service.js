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
      const { result } = await this.client.team.searchTeamMembers({
        query: {
          filter: {
            locationIds: [this.locationId],
            status: 'ACTIVE'
          }
        }
      });

      return result.teamMembers?.map(member => ({
        id: member.id,
        givenName: member.givenName,
        familyName: member.familyName,
        displayName: `${member.givenName} ${member.familyName}`,
        email: member.emailAddress,
        phoneNumber: member.phoneNumber,
        status: member.status,
        isOwner: member.isOwner || false,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      })) || [];
    } catch (error) {
      console.error('Square getBarbers error:', error);
      throw new AppError('Failed to fetch barbers', 500);
    }
  }

  /**
   * Get barber details
   * @param {string} barberId - Team member ID
   * @returns {Promise<Object>} Barber details
   */
  async getBarberDetails(barberId) {
    try {
      const { result } = await this.client.team.retrieveTeamMember(barberId);
      const member = result.teamMember;

      if (!member) {
        throw new AppError('Barber not found', 404);
      }

      return {
        id: member.id,
        givenName: member.givenName,
        familyName: member.familyName,
        displayName: `${member.givenName} ${member.familyName}`,
        email: member.emailAddress,
        phoneNumber: member.phoneNumber,
        status: member.status,
        isOwner: member.isOwner || false,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new AppError('Barber not found', 404);
      }
      console.error('Square getBarberDetails error:', error);
      throw new AppError('Failed to fetch barber details', 500);
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
      const { result } = await this.client.catalog.listCatalog({
        types: 'ITEM'
      });

      let services = result.objects?.filter(item => {
        // Filter for service items (not products)
        return item.type === 'ITEM' && 
               item.itemData?.productType === 'APPOINTMENTS_SERVICE';
      }) || [];

      // Apply custom filters if provided
      if (filter) {
        services = services.filter(service => {
          const name = service.itemData?.name?.toLowerCase() || '';
          const description = service.itemData?.description?.toLowerCase() || '';
          const filterLower = filter.toLowerCase();
          return name.includes(filterLower) || description.includes(filterLower);
        });
      }

      return services.map(service => ({
        id: service.id,
        name: service.itemData?.name,
        description: service.itemData?.description,
        category: service.itemData?.categoryId,
        variations: service.itemData?.variations?.map(variation => ({
          id: variation.id,
          name: variation.itemVariationData?.name,
          price: {
            amount: variation.itemVariationData?.priceMoney?.amount,
            currency: variation.itemVariationData?.priceMoney?.currency
          },
          serviceDuration: variation.itemVariationData?.serviceDuration,
          availableForBooking: variation.itemVariationData?.availableForBooking || true
        })) || [],
        isDeleted: service.isDeleted || false,
        updatedAt: service.updatedAt
      }));
    } catch (error) {
      console.error('Square getServices error:', error);
      throw new AppError('Failed to fetch services', 500);
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
      throw new AppError('Failed to check availability', 500);
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
        throw new AppError(error.errors[0].detail || 'Invalid booking data', 400);
      }
      throw new AppError('Failed to create booking', 500);
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
        throw new AppError('Booking not found', 404);
      }
      console.error('Square getBookingDetails error:', error);
      throw new AppError('Failed to fetch booking details', 500);
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
        throw new AppError('Booking not found', 404);
      }
      console.error('Square cancelBooking error:', error);
      throw new AppError('Failed to cancel booking', 500);
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