// src/modules/auth/utils/twilio.js
import twilio from "twilio";
import { parsePhoneNumber } from "libphonenumber-js";

class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.serviceSid = process.env.TWILIO_SMS_SID;
  }

  /**
   * Format phone number to E.164 format for Australian numbers
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    try {
      // Parse the phone number with Australian default
      const parsed = parsePhoneNumber(phoneNumber, "AU");

      if (!parsed || !parsed.isValid()) {
        throw new Error("Invalid phone number");
      }

      return parsed.format("E.164"); // Returns format like +61412345678
    } catch (error) {
      throw new Error(`Invalid phone number format: ${error.message}`);
    }
  }

  /**
   * Send OTP via Twilio Verify
   * @param {string} phoneNumber - Phone number to send OTP to
   * @returns {Promise<Object>} Verification status
   */
  async sendOTP(phoneNumber) {
    const e164PhoneNumber = this.formatPhoneNumber(phoneNumber);

    // Mock OTP for development
    if (process.env.MOCK_OTP) {
      console.log(`[MOCK OTP] Sending OTP ${process.env.MOCK_OTP} to ${e164PhoneNumber}`);
      return {
        status: "pending",
        valid: false,
        to: e164PhoneNumber
      };
    }

    try {
      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications.create({
          to: e164PhoneNumber,
          channel: "sms"
        });

      return {
        status: verification.status,
        valid: verification.valid,
        to: verification.to
      };
    } catch (error) {
      console.error("Twilio send OTP error:", error);
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }

  /**
   * Verify OTP code
   * @param {string} phoneNumber - Phone number that received the OTP
   * @param {string} otpCode - OTP code to verify
   * @returns {Promise<Object>} Verification check status
   */
  async verifyOTP(phoneNumber, otpCode) {
    const e164PhoneNumber = this.formatPhoneNumber(phoneNumber);

    // Mock OTP verification for development
    if (process.env.MOCK_OTP) {
      console.log(`[MOCK OTP] Verifying OTP ${otpCode} for ${e164PhoneNumber}`);
      const isValid = otpCode === process.env.MOCK_OTP;
      return {
        status: isValid ? "approved" : "pending",
        valid: isValid,
        to: e164PhoneNumber
      };
    }

    try {
      const verificationCheck = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({
          to: e164PhoneNumber,
          code: otpCode
        });

      return {
        status: verificationCheck.status,
        valid: verificationCheck.valid === true,
        to: verificationCheck.to
      };
    } catch (error) {
      console.error("Twilio verify OTP error:", error);
      throw new Error(`Failed to verify OTP: ${error.message}`);
    }
  }
}

export default new TwilioService();
