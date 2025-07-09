const jwtService = require('../utils/jwt');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Access token is required'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token:', token.substring(0, 50) + '...');

    // Check if token is blacklisted
    const isBlacklisted = await jwtService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_BLACKLISTED',
          message: 'Token has been invalidated'
        }
      });
    }

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);
    console.log('Decoded token:', decoded);
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    console.log('Found user:', user ? user.username : 'null', 'ID:', user ? user._id : 'null');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is deactivated'
        }
      });
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.message === 'Invalid access token') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token'
        }
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error occurred'
      }
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await jwtService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next();
    }

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return next();
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required'
      }
    });
  }
  next();
};

// Check if user owns the resource
const requireOwnership = (paramName = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName];
    
    if (req.user._id.toString() !== resourceUserId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied - resource ownership required'
        }
      });
    }
    next();
  };
};

// Check if user has admin role (for future admin features)
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Admin access required'
      }
    });
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireVerification,
  requireOwnership,
  requireAdmin
}; 