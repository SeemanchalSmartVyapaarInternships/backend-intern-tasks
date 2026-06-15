const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

/**
 * Role-based authorization middleware factory.
 *
 * Must be used AFTER the `authenticate` middleware, since it relies
 * on `req.user.role` being populated.
 *
 * Usage:
 *   router.get('/reports', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), controller.getReports);
 *
 * SUPER_ADMIN is always granted access regardless of the roles listed,
 * giving it full access across the system as required.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next(); // SUPER_ADMIN: full access
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }

  return next();
};

/**
 * Permission-based authorization middleware factory.
 * Accepts a permission key from config/roles.js PERMISSIONS map
 * and checks whether the current user's role is included.
 *
 * Usage:
 *   router.post('/users', authenticate, requirePermission('MANAGE_USERS'), controller.createUser);
 */
const requirePermission = (permissionKey) => (req, res, next) => {
  const { PERMISSIONS, ROLES: ROLES_MAP } = require('../config/roles');

  if (!req.user || !req.user.role) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.user.role === ROLES_MAP.SUPER_ADMIN) {
    return next();
  }

  const allowedRoles = PERMISSIONS[permissionKey];

  if (!allowedRoles) {
    return next(ApiError.internal(`Unknown permission: ${permissionKey}`));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }

  return next();
};

module.exports = { authorize, requirePermission };
