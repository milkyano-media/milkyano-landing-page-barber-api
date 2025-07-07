// src/modules/auth/service.js
import bcrypt from "bcrypt";
import { getSquareClient } from "../square/utils/client.js";
import twilioService from "./utils/twilio.js";
import { AppError } from "../../utils/errors.js";

const SALT_ROUNDS = 10;

export default class AuthService {
  constructor(prisma) {
    this.prisma = prisma;
    this.squareClient = getSquareClient();
  }

  /**
   * Register new customer
   * @param {Object} data - Registration data
   * @returns {Promise<Object>} User data with OTP sent status
   */
  async register({ phoneNumber, firstName, lastName, email, password }) {
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: formattedPhone }
    });

    if (existingUser) {
      throw new AppError(400, "Phone number already registered");
    }

    // Check if email is already taken
    if (email) {
      const existingEmailUser = await this.prisma.user.findUnique({
        where: { email }
      });

      if (existingEmailUser) {
        throw new AppError(400, "Email already registered");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create customer in Square
    // Generate idempotency key for Square API
    const idempotencyKey = `register-${formattedPhone}-${Date.now()}`;
    
    const response = await this.squareClient.post('/customers', {
      idempotency_key: idempotencyKey,
      given_name: firstName,
      family_name: lastName,
      phone_number: formattedPhone,
      email_address: email
    });

    const squareCustomerId = response.data.customer.id;

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        phoneNumber: formattedPhone,
        firstName,
        lastName,
        email: email || null,
        password: hashedPassword,
        role: "CUSTOMER",
        isVerified: false,
        squareupId: squareCustomerId // Store Square customer ID in dedicated field
      }
    });

    // Send OTP
    await twilioService.sendOTP(phoneNumber);

    return {
      userId: user.id,
      phoneNumber: formattedPhone,
      message: "Registration successful. OTP sent."
    };
  }

  /**
   * Register new admin (no OTP required)
   * @param {Object} data - Registration data
   * @returns {Promise<Object>} Admin user data
   */
  async registerAdmin({ phoneNumber, firstName, lastName, email, password }) {
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: formattedPhone }
    });

    if (existingUser) {
      throw new AppError(400, "Phone number already registered");
    }

    // Check if email is already taken
    const existingEmailUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingEmailUser) {
      throw new AppError("Email already registered", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create admin user in database (no Square customer)
    const admin = await this.prisma.user.create({
      data: {
        phoneNumber: formattedPhone,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "ADMIN",
        isVerified: true // Admins are instantly verified
      }
    });

    return {
      userId: admin.id,
      phoneNumber: formattedPhone,
      message: "Admin created successfully"
    };
  }

  /**
   * Request OTP for existing user or phone number change
   * @param {string} phoneNumber - Phone number to send OTP to
   * @param {Object|null} authenticatedUser - Authenticated user if changing phone number
   * @returns {Promise<Object>} OTP request status
   */
  async requestOTP(phoneNumber, authenticatedUser = null) {
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    if (authenticatedUser) {
      // Authenticated flow - user changing phone number
      // Check new phone isn't already taken by another user
      const existingUser = await this.prisma.user.findUnique({
        where: { phoneNumber: formattedPhone }
      });
      
      if (existingUser && existingUser.id !== authenticatedUser.id) {
        throw new AppError(400, "Phone number already in use");
      }
      
      // Send OTP to new number
      await twilioService.sendOTP(phoneNumber);
      
      return {
        message: "OTP sent to new phone number"
      };
    } else {
      // Unauthenticated flow - existing user login
      const user = await this.prisma.user.findUnique({
        where: { phoneNumber: formattedPhone }
      });

      if (!user) {
        throw new AppError(404, "User not found");
      }

      // Only allow OTP for customers
      if (user.role !== "CUSTOMER") {
        throw new AppError(403, "OTP not available for this user type");
      }

      // Send OTP
      await twilioService.sendOTP(phoneNumber);

      return {
        message: "OTP sent successfully"
      };
    }
  }

  /**
   * Forgot password - send OTP to existing customer
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<Object>} OTP sent status
   */
  async forgotPassword(phoneNumber) {
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: formattedPhone }
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    // Only allow for customers
    if (user.role !== "CUSTOMER") {
      throw new AppError(
        "Password reset not available for this user type",
        403
      );
    }

    // Send OTP
    await twilioService.sendOTP(phoneNumber);

    return {
      message: "OTP sent for account recovery"
    };
  }

  /**
   * Login with email/phone and password
   * @param {string} emailOrPhone - Email or phone number
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async login(emailOrPhone, password) {
    // Determine if input is email or phone
    const isEmail = emailOrPhone.includes("@");

    let user;
    if (isEmail) {
      user = await this.prisma.user.findUnique({
        where: { email: emailOrPhone }
      });
    } else {
      const formattedPhone = twilioService.formatPhoneNumber(emailOrPhone);
      user = await this.prisma.user.findUnique({
        where: { phoneNumber: formattedPhone }
      });
    }

    if (!user) {
      throw new AppError(401, "Invalid credentials");
    }

    // Check if user has password (for backward compatibility)
    if (!user.password) {
      throw new AppError(400, "Please use OTP login for this account");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, "Invalid credentials");
    }

    // Return user even if not verified - frontend will handle showing OTP modal
    return user;
  }

  /**
   * Verify OTP and return user
   * @param {Object} data - Contains phoneNumber and otpCode
   * @param {Object|null} authenticatedUser - Authenticated user if changing phone number
   * @returns {Promise<Object>} Updated user
   */
  async verifyOTP({ phoneNumber, otpCode }, authenticatedUser = null) {
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    // Verify OTP with Twilio
    const verificationResult = await twilioService.verifyOTP(
      phoneNumber,
      otpCode
    );

    if (!verificationResult.valid) {
      throw new AppError(400, "Invalid or expired OTP");
    }

    let user;

    if (authenticatedUser) {
      // Authenticated flow - user changing phone number
      // Check if new phone number is already taken
      const existingUser = await this.prisma.user.findUnique({
        where: { phoneNumber: formattedPhone }
      });
      
      if (existingUser && existingUser.id !== authenticatedUser.id) {
        throw new AppError(400, "Phone number already in use");
      }

      // Update user's phone number and mark as verified
      user = await this.prisma.user.update({
        where: { id: authenticatedUser.id },
        data: { 
          phoneNumber: formattedPhone,
          isVerified: true 
        }
      });
    } else {
      // Unauthenticated flow - find user by phone number
      user = await this.prisma.user.findUnique({
        where: { phoneNumber: formattedPhone }
      });

      if (!user) {
        throw new AppError(404, "User not found");
      }

      // Update user as verified
      if (!user.isVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true }
        });
      }
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
      throw new AppError(404, "User not found");
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
        throw new AppError(400, "Email already registered");
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
        await this.squareClient.customers.updateCustomer(updatedUser.id, {
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

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updatePassword(userId, newPassword) {
    // Get user to verify they exist
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

}
