/**
 * Standard API response formatter for consistency across all endpoints.
 */

const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const payload = {
    success: true,
    message,
  };
  if (data !== null) {
    payload.data = data;
  }
  return res.status(statusCode).json(payload);
};

const errorResponse = (res, statusCode = 500, error = 'Internal Server Error', message = '', details = null) => {
  const payload = {
    success: false,
    error,
    message: message || error,
  };
  if (details !== null) {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};

