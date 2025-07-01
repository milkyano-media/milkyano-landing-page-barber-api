// src/modules/auth/service.js
import { SquareClient } from "square";
import twilioService from "./utils/twilio.js";
import { AppError } from "../../utils/errors.js";

export default class AuthService {
  constructor(prisma, squareClient) {
    this.prisma = prisma;
    this.squareClient =
      squareClient ||
      new SquareClient({
        token: process.env.SQUARE_ACCESS_TOKEN
      });
  }

  /**
   * Request OTP for phone number
   * @param {string} phoneNumber - Phone number to send OTP to
   * @param {string} firstName - User's first name (for new users)
   * @param {string} lastName - User's last name (for new users)
   * @param {string} email - User's email (optional)
   * @returns {Promise<Object>} OTP request status
   */
  async requestOTP({ phoneNumber, firstName, lastName, email }) {
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber: formattedPhone }
    });

    // If user doesn't exist, create a new customer user
    if (!user) {
      // Check if email is already taken
      if (email) {
        const existingEmailUser = await this.prisma.user.findUnique({
          where: { email }
        });

        if (existingEmailUser) {
          throw new AppError("Email already registered", 400);
        }
      }

      // Create customer in Square
      let squareCustomerId = null;
      try {
        const { result } = await this.squareClient.customersApi.createCustomer({
          givenName: firstName,
          familyName: lastName,
          phoneNumber: formattedPhone,
          emailAddress: email || undefined
        });

        squareCustomerId = result.customer.id;
      } catch (error) {
        console.error("Square customer creation error:", error);
        // Continue without Square customer ID for now
      }

      // Create user in database
      user = await this.prisma.user.create({
        data: {
          id: squareCustomerId || undefined, // Use Square customer ID as user ID if available
          phoneNumber: formattedPhone,
          firstName,
          lastName,
          email: email || null,
          role: "CUSTOMER",
          isVerified: false
        }
      });
    }

    // Send OTP
    const otpResult = await twilioService.sendOTP(phoneNumber);

    return {
      status: "sent",
      phoneNumber: formattedPhone,
      userId: user.id,
      message: "OTP sent successfully"
    };
  }

  /**
   * Verify OTP and return tokens
   * @param {string} phoneNumber - Phone number that received OTP
   * @param {string} otpCode - OTP code to verify
   * @returns {Promise<Object>} User and tokens
   */
  async verifyOTP({ phoneNumber, otpCode }) {
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    // Verify OTP with Twilio
    const verificationResult = await twilioService.verifyOTP(
      phoneNumber,
      otpCode
    );

    if (!verificationResult.valid) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: formattedPhone }
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update user as verified
    if (!user.isVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
      user.isVerified = true;
    }

    return user;
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUser(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, { firstName, lastName, email }) {
    // Check if email is already taken by another user
    if (email) {
      const existingEmailUser = await this.prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (existingEmailUser) {
        throw new AppError("Email already registered", 400);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined
      }
    });

    // Update Square customer if user has Square ID
    if (updatedUser.id.length > 10) {
      // Square IDs are longer than UUIDs
      try {
        await this.squareClient.customersApi.updateCustomer(updatedUser.id, {
          givenName: updatedUser.firstName,
          familyName: updatedUser.lastName,
          emailAddress: updatedUser.email || undefined
        });
      } catch (error) {
        console.error("Square customer update error:", error);
        // Continue even if Square update fails
      }
    }

    return updatedUser;
  }
}
