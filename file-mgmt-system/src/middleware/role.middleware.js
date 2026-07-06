/**
 * role.middleware.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Factory producing middleware that restricts a route to specific roles
 *   (e.g. only 'admin'). Must run AFTER auth.middleware.js since it depends
 *   on req.user being populated.
 *
 * Connects with:
 *   - routes/audit.routes.js, routes/loginHistory.routes.js,
 *     routes/apiLog.routes.js restrict admin-only endpoints with this.
 * ----------------------------------------------------------------------------
 */

const ApiError = require('../utils/ApiError');

/**
 * @param {...string} allowedRoles - e.g. authorize('admin')
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = authorize;
