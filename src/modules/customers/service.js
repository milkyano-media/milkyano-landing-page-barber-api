// src/modules/customers/service.js
import { getSquareClient, SQUARE_LOCATION_ID } from '../square/utils/client.js';
import { AppError } from '../../utils/errors.js';

export default class CustomerService {
  constructor(prisma) {
    this.prisma = prisma;
    this.squareClient = getSquareClient();
    this.locationId = SQUARE_LOCATION_ID;
  }

  /**
   * Get customer profile
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer profile with bookings
   */
  async getProfile(customerId) {
    // Get user data from database
    const user = await this.prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!user) {
      throw new AppError('Customer not found', 404);
    }

    // Only allow customers to view their own profile
    if (user.role !== 'CUSTOMER') {
      throw new AppError('Not a customer account', 403);
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Update customer profile
   * @param {string} customerId - Customer ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(customerId, { firstName, lastName, email }) {
    // Check if email is already taken by another user
    if (email) {
      const existingEmailUser = await this.prisma.user.findFirst({
        where: {
          email,
          NOT: { id: customerId }
        }
      });
      
      if (existingEmailUser) {
        throw new AppError('Email already registered', 400);
      }
    }

    // Update user in database
    const updatedUser = await this.prisma.user.update({
      where: { id: customerId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined
      }
    });

    // Update Square customer if user has Square ID
    if (updatedUser.id.startsWith('SQ')) { // Square IDs start with SQ
      try {
        await this.squareClient.customers.updateCustomer(updatedUser.id, {
          givenName: updatedUser.firstName,
          familyName: updatedUser.lastName,
          emailAddress: updatedUser.email || undefined
        });
      } catch (error) {
        console.error('Square customer update error:', error);
        // Continue even if Square update fails
      }
    }

    return {
      id: updatedUser.id,
      phoneNumber: updatedUser.phoneNumber,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  }

  /**
   * Get customer bookings
   * @param {string} customerId - Customer ID
   * @param {Object} filters - Optional filters (startDate, endDate, status)
   * @returns {Promise<Array>} List of bookings
   */
  async getBookings(customerId, filters = {}) {
    try {
      const searchRequest = {
        query: {
          filter: {
            customerIdFilter: {
              customerIds: [customerId]
            },
            locationIdFilter: {
              locationIds: [this.locationId]
            }
          }
        }
      };

      // Add date range filter if provided
      if (filters.startDate || filters.endDate) {
        searchRequest.query.filter.startAtRange = {};
        if (filters.startDate) {
          searchRequest.query.filter.startAtRange.startAt = filters.startDate;
        }
        if (filters.endDate) {
          searchRequest.query.filter.startAtRange.endAt = filters.endDate;
        }
      }

      // Add status filter if provided
      if (filters.status) {
        searchRequest.query.filter.statusFilter = {
          statuses: [filters.status]
        };
      }

      const { result } = await this.squareClient.bookings.listBookings(searchRequest);

      return result.bookings?.map(booking => ({
        id: booking.id,
        status: booking.status,
        startAt: booking.startAt,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        customerNote: booking.customerNote,
        appointmentSegments: booking.appointmentSegments?.map(segment => ({
          durationMinutes: segment.durationMinutes,
          serviceVariationId: segment.serviceVariationId,
          teamMemberId: segment.teamMemberId
        }))
      })) || [];
    } catch (error) {
      console.error('Square getBookings error:', error);
      throw new AppError('Failed to fetch bookings', 500);
    }
  }

  /**
   * Get customer statistics
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer statistics
   */
  async getStatistics(customerId) {
    try {
      // Get all bookings for statistics
      const allBookings = await this.getBookings(customerId);
      
      const now = new Date();
      const stats = {
        totalBookings: allBookings.length,
        upcomingBookings: 0,
        pastBookings: 0,
        cancelledBookings: 0,
        lastBookingDate: null,
        nextBookingDate: null
      };

      allBookings.forEach(booking => {
        const bookingDate = new Date(booking.startAt);
        
        if (booking.status === 'CANCELLED') {
          stats.cancelledBookings++;
        } else if (bookingDate > now) {
          stats.upcomingBookings++;
          if (!stats.nextBookingDate || bookingDate < new Date(stats.nextBookingDate)) {
            stats.nextBookingDate = booking.startAt;
          }
        } else {
          stats.pastBookings++;
          if (!stats.lastBookingDate || bookingDate > new Date(stats.lastBookingDate)) {
            stats.lastBookingDate = booking.startAt;
          }
        }
      });

      return stats;
    } catch (error) {
      console.error('Error calculating statistics:', error);
      throw new AppError('Failed to calculate statistics', 500);
    }
  }
}