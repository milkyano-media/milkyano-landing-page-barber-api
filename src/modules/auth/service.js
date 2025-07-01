// src/modules/auth/service.js
import bcrypt from 'bcrypt';
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
      throw new AppError("Phone number already registered", 400);
    }

    // Check if email is already taken
    if (email) {
      const existingEmailUser = await this.prisma.user.findUnique({
        where: { email }
      });

      if (existingEmailUser) {
        throw new AppError("Email already registered", 400);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

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
    const user = await this.prisma.user.create({
      data: {
        id: squareCustomerId || undefined, // Use Square customer ID as user ID if available
        phoneNumber: formattedPhone,
        firstName,
        lastName,
        email: email || null,
        password: hashedPassword,
        role: "CUSTOMER",
        isVerified: false
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
      throw new AppError("Phone number already registered", 400);
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
   * Request OTP for existing user only
   * @param {string} phoneNumber - Phone number to send OTP to
   * @returns {Promise<Object>} OTP request status
   */
  async requestOTP(phoneNumber) {
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: formattedPhone }
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Only allow OTP for customers
    if (user.role !== "CUSTOMER") {
      throw new AppError("OTP not available for this user type", 403);
    }

    // Send OTP
    await twilioService.sendOTP(phoneNumber);

    return {
      message: "OTP sent successfully"
    };
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
      throw new AppError("User not found", 404);
    }

    // Only allow for customers
    if (user.role !== "CUSTOMER") {
      throw new AppError("Password reset not available for this user type", 403);
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
    const isEmail = emailOrPhone.includes('@');
    
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
      throw new AppError("Invalid credentials", 401);
    }

    // Check if user has password (for backward compatibility)
    if (!user.password) {
      throw new AppError("Please use OTP login for this account", 400);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new AppError("Please verify your account first", 403);
    }

    return user;
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
