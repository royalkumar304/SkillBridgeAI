const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');
const { getJwtConfig } = require('../config/jwt');
const { AUTH_COOKIE_NAME } = require('../config/cookie');

const verifyToken = (token) => {
  const config = getJwtConfig();
  return jwt.verify(token, config.secret, {
    algorithms: config.algorithms,
    issuer: config.issuer,
    audience: config.audience,
  });
};

/**
 * Extracts JWT token from either HttpOnly cookie or Authorization Bearer header
 */
const extractToken = (req) => {
  // 1. Primary: HttpOnly cookie
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }
  // 2. Compatibility: Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.split(' ')[1];
    if (headerToken && headerToken.trim()) {
      return headerToken.trim();
    }
  }
  return null;
};

const authenticateToken = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return errorResponse(res, 401, 'Unauthorized', 'Authentication session missing or expired');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Unauthorized', 'Token expired. Please login again.');
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
      return errorResponse(res, 401, 'Unauthorized', 'Invalid authentication token');
    }
    return errorResponse(res, 401, 'Unauthorized', 'Invalid authentication token');
  }

  // Task 1: Strict Token Version Fail-Closed Enforcement
  // 1. Every valid JWT must contain user ID and an explicit non-negative integer tokenVersion.
  if (
    !decoded ||
    !decoded.id ||
    decoded.tokenVersion === undefined ||
    decoded.tokenVersion === null ||
    typeof decoded.tokenVersion !== 'number' ||
    !Number.isInteger(decoded.tokenVersion) ||
    decoded.tokenVersion < 0
  ) {
    return errorResponse(res, 401, 'Unauthorized', 'Invalid or unversioned token. Please log in again.');
  }

  // 2. Authoritative database validation with fail-closed guarantee
  try {
    const User = require('../models/User');
    const currentUser = await User.findById(decoded.id, 'tokenVersion status');

    if (!currentUser) {
      return errorResponse(res, 401, 'Unauthorized', 'User account not found.');
    }

    if (currentUser.status !== 'ACTIVE') {
      return errorResponse(res, 401, 'Unauthorized', 'Account is suspended or inactive.');
    }

    const currentVersion = currentUser.tokenVersion !== undefined ? currentUser.tokenVersion : 0;
    if (currentVersion !== decoded.tokenVersion) {
      return errorResponse(res, 401, 'Unauthorized', 'Session has been revoked. Please log in again.');
    }

    req.user = decoded;
    next();
  } catch (dbErr) {
    console.error('[authMiddleware.authenticateToken] Database verification error:', dbErr.message);
    // Fail closed: Never authenticate requests when database session check cannot complete
    return errorResponse(res, 503, 'Service Unavailable', 'Authentication verification currently unavailable.');
  }
};

const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    if (
      decoded &&
      decoded.id &&
      decoded.tokenVersion !== undefined &&
      typeof decoded.tokenVersion === 'number' &&
      decoded.tokenVersion >= 0
    ) {
      const User = require('../models/User');
      const currentUser = await User.findById(decoded.id, 'tokenVersion status');
      if (currentUser && currentUser.status === 'ACTIVE' && (currentUser.tokenVersion || 0) === decoded.tokenVersion) {
        req.user = decoded;
      }
    }
  } catch (err) {
    // ignore invalid token for optional auth
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
};

