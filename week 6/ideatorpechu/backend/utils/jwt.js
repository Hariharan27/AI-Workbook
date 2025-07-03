const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const redisClient = require('../config/redis');

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  // Generate access token
  generateAccessToken(payload) {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'ideatorpechu',
      audience: 'ideatorpechu-users'
    });
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'ideatorpechu',
      audience: 'ideatorpechu-users'
    });
  }

  // Generate both tokens
  generateTokens(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpiry(this.accessTokenExpiry)
    };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        issuer: 'ideatorpechu',
        audience: 'ideatorpechu-users'
      });
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'ideatorpechu',
        audience: 'ideatorpechu-users'
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Decode token without verification
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  // Get token expiry in seconds
  getTokenExpiry(expiryString) {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };
    
    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes
    }
    
    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  // Blacklist token
  async blacklistToken(token) {
    try {
      const decoded = this.decodeToken(token);
      const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
      await redisClient.blacklistToken(token, ttl);
    } catch (error) {
      console.error('Error blacklisting token:', error);
    }
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token) {
    try {
      return await redisClient.isTokenBlacklisted(token);
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      return false;
    }
  }

  // Store refresh token in Redis
  async storeRefreshToken(userId, refreshToken) {
    try {
      const key = `refresh_token:${userId}`;
      const ttl = this.getTokenExpiry(this.refreshTokenExpiry);
      await redisClient.set(key, refreshToken, ttl);
    } catch (error) {
      console.error('Error storing refresh token:', error);
    }
  }

  // Get stored refresh token
  async getStoredRefreshToken(userId) {
    try {
      const key = `refresh_token:${userId}`;
      return await redisClient.get(key);
    } catch (error) {
      console.error('Error getting stored refresh token:', error);
      return null;
    }
  }

  // Remove stored refresh token
  async removeStoredRefreshToken(userId) {
    try {
      const key = `refresh_token:${userId}`;
      await redisClient.del(key);
    } catch (error) {
      console.error('Error removing stored refresh token:', error);
    }
  }

  // Generate random token for email verification/password reset
  generateRandomToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate email verification token
  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate password reset token
  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Get token payload for user
  getTokenPayload(user) {
    return {
      userId: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      isActive: user.isActive
    };
  }
}

const jwtService = new JWTService();

module.exports = jwtService; 