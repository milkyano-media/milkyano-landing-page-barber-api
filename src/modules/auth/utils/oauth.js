// src/modules/auth/utils/oauth.js
import { OAuth2Client } from 'google-auth-library';
import appleSigninAuth from 'apple-signin-auth';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AppError } from '../../../utils/errors.js';

class OAuthService {
  constructor() {
    this.googleClient = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    });

    // Initialize Apple JWKS client
    this.appleJwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });

    // Initialize Apple Sign In
    if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
      this.appleConfig = {
        client_id: process.env.APPLE_CLIENT_ID,
        team_id: process.env.APPLE_TEAM_ID,
        key_id: process.env.APPLE_KEY_ID,
        private_key: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scope: 'name email'
      };
    }
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

  /**
   * Verify Apple OAuth token using apple-signin-auth
   * @param {string} idToken - Apple ID token
   * @param {string} authorizationCode - Apple authorization code (optional)
   * @returns {Promise<Object>} User profile from Apple
   */
  async verifyAppleToken(idToken, authorizationCode = null) {
    try {
      // Use apple-signin-auth for verification
      const appleIdTokenClaims = await appleSigninAuth.verifyIdToken(idToken, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: false
      });

      // Apple ID tokens contain minimal user info
      // Full name is only provided on first authorization
      const profile = {
        providerId: appleIdTokenClaims.sub,
        email: appleIdTokenClaims.email,
        emailVerified: appleIdTokenClaims.email_verified !== false, // Apple emails are generally verified
        firstName: appleIdTokenClaims.given_name || 'Apple',
        lastName: appleIdTokenClaims.family_name || 'User'
      };

      return profile;
    } catch (error) {
      console.error('Apple token verification error:', error);
      // Fallback to manual JWT verification
      return this.verifyAppleIdToken(idToken);
    }
  }

  /**
   * Verify Apple ID token using JWT verification (alternative method)
   * @param {string} idToken - Apple ID token
   * @returns {Promise<Object>} User profile from Apple
   */
  async verifyAppleIdToken(idToken) {
    try {
      // Decode token header to get key ID
      const decodedHeader = jwt.decode(idToken, { complete: true })?.header;
      if (!decodedHeader || !decodedHeader.kid) {
        throw new AppError(401, 'Invalid Apple token header');
      }

      // Get signing key from Apple's JWKS
      const signingKey = await this.getAppleSigningKey(decodedHeader.kid);

      // Verify JWT signature
      const payload = jwt.verify(idToken, signingKey, {
        algorithms: ['RS256'],
        audience: process.env.APPLE_CLIENT_ID,
        issuer: 'https://appleid.apple.com'
      });

      return {
        providerId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified !== false,
        firstName: payload.given_name || 'Apple',
        lastName: payload.family_name || 'User'
      };
    } catch (error) {
      console.error('Apple ID token verification error:', error);
      throw new AppError(401, 'Invalid Apple ID token');
    }
  }

  /**
   * Get Apple signing key using JWKS client
   * @param {string} keyId - Key ID from JWT header
   * @returns {Promise<string>} PEM formatted signing key
   */
  async getAppleSigningKey(keyId) {
    return new Promise((resolve, reject) => {
      this.appleJwksClient.getSigningKey(keyId, (err, key) => {
        if (err) {
          reject(new AppError(500, 'Failed to get Apple signing key'));
          return;
        }
        
        const signingKey = key.publicKey || key.rsaPublicKey;
        resolve(signingKey);
      });
    });
  }
}

export default new OAuthService();