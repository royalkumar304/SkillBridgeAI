const { errorResponse } = require('../utils/responseHelper');

const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 404, 'Not Found', `Cannot ${req.method} ${req.originalUrl}`);
};

const globalErrorHandler = (err, req, res, next) => {
  console.error('[Error caught by globalErrorHandler]:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, 400, 'Validation Error', 'Invalid input data', messages);
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return errorResponse(res, 409, 'Conflict Error', `Duplicate value for field(s): ${field}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Unauthorized', 'Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Unauthorized', 'Authentication token has expired');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred';
  return errorResponse(res, statusCode, 'Server Error', message);
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};

