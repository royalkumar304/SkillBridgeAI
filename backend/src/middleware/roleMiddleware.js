const { errorResponse } = require('../utils/responseHelper');

/**
 * Middleware factory for Role-Based Access Control (RBAC).
 * @param  {...string} allowedRoles - E.g. 'STUDENT', 'UNIVERSITY_ADMIN', 'RECRUITER'
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 403, 'Forbidden', 'User role not identified');
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return errorResponse(
        res,
        403,
        'Forbidden',
        `Access restricted. Required role: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      );
    }

    next();
  };
};

module.exports = {
  requireRole,
};

