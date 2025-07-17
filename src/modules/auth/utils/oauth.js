// src/modules/auth/utils/oauth.js
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../../../utils/errors.js';

class OAuthService {
  constructor() {
    this.googleClient = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    });
  }

  /**
   * Verify Google OAuth token
   * @param {string} idToken - Google ID token
   * @returns {Promise<Object>} User profile from Google
   */
  async verifyGoogleToken(idToken) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      
      return {
        providerId: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        emailVerified: payload.email_verified,
        picture: payload.picture
      };
    } catch (error) {
      throw new AppError(401, 'Invalid Google token');
    }
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} authCode - Authorization code from Google
   * @returns {Promise<Object>} Access and refresh tokens
   */
  async exchangeCodeForTokens(authCode) {
    try {
      const { tokens } = await this.googleClient.getToken(authCode);
      return tokens;
    } catch (error) {
      throw new AppError(400, 'Failed to exchange authorization code');
    }
  }

  /**
   * Get user profile using access token
   * @param {string} accessToken - Google access token
   * @returns {Promise<Object>} User profile information
   */
  async getGoogleUserProfile(accessToken) {
    try {
      this.googleClient.setCredentials({ access_token: accessToken });
      
      const response = await this.googleClient.request({
        url: 'https://www.googleapis.com/oauth2/v2/userinfo'
      });
      
      return {
        providerId: response.data.id,
        email: response.data.email,
        firstName: response.data.given_name,
        lastName: response.data.family_name,
        emailVerified: response.data.verified_email,
        picture: response.data.picture
      };
    } catch (error) {
      throw new AppError(401, 'Failed to get user profile');
    }
  }
}

export default new OAuthService();