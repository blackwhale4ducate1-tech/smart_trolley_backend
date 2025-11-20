const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    // Support token from Authorization header or query param for browser-opened links
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user exists and is active
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found.',
      });
    }

    // Check session validity if sessionId is present
    if (decoded.sessionId && user.sessionId !== decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
        sessionExpired: true,
      });
    }

    // Check session expiry for users (not for admin)
    if (user.role === 'user' && decoded.sessionId && !user.isSessionValid()) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
        sessionExpired: true,
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        tokenExpired: true,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
  next();
};

// Check if user is admin or the resource owner
const isAdminOrOwner = (userIdField = 'userId') => {
  return (req, res, next) => {
    const requestedUserId = req.params[userIdField] || req.body[userIdField];
    
    if (req.user.role === 'admin' || req.user.userId === requestedUserId) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }
  };
};

// Rate limiting middleware for session management
const sessionRateLimit = (req, res, next) => {
  // This is a simple implementation. In production, use redis-based rate limiting
  const maxSessionsPerUser = 5;
  const timeWindow = 60 * 60 * 1000; // 1 hour

  // For now, just pass through. Implement proper rate limiting as needed
  next();
};

// Middleware to check session timeout for invoice operations
const checkSessionTimeout = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      // Admins don't have session timeouts
      return next();
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if user has an active session
    if (!user.sessionId || !user.isSessionValid()) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again to start a new billing session.',
        sessionExpired: true,
      });
    }

    next();
  } catch (error) {
    console.error('Session timeout check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Middleware to log user activities
const logActivity = (action) => {
  return (req, res, next) => {
    // Log user activity for audit purposes
    console.log(`User ${req.user.userId} (${req.user.role}) performed action: ${action} at ${new Date()}`);
    next();
  };
};

module.exports = {
  verifyToken,
  isAdmin,
  isAdminOrOwner,
  sessionRateLimit,
  checkSessionTimeout,
  logActivity,
};
