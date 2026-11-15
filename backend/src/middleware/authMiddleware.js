const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Unauthorized', 'Authorization token missing or malformed');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_skillbridge_2026');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Unauthorized', 'Token expired. Please login again.');
    }
    return errorResponse(res, 401, 'Unauthorized', 'Invalid authentication token');
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_skillbridge_2026');
    req.user = decoded;
  } catch (err) {
    // ignore invalid token for optional auth
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
};

