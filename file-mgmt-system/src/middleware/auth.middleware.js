/**
 * auth.middleware.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Verifies the `Authorization: Bearer <token>` JWT on protected routes,
 *   attaches the decoded payload to `req.user`, and confirms the user still
 *   exists and is active. On failure, throws ApiError(401) and records an
 *   'Unauthorized Access' audit entry.
 *
 * Connects with:
 *   - routes/*.routes.js apply this to every protected endpoint.
 *   - services/audit.service.js logs the unauthorized attempt.
 *   - middleware/role.middleware.js runs after this and reads req.user.role.
 * ----------------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/user.model');
const { recordAudit } = require('../services/audit.service');
const { getClientIp } = require('../utils/deviceParser');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    await logUnauthorized(req, 'Missing token');
    throw new ApiError(401, 'Authentication token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    await logUnauthorized(req, 'Invalid or expired token');
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await userModel.findUserById(decoded.id);
  if (!user || !user.is_active) {
    await logUnauthorized(req, 'User no longer exists or is inactive');
    throw new ApiError(401, 'Account is no longer valid');
  }

  req.user = { id: user.id, role: user.role, email: user.email };
  next();
});

async function logUnauthorized(req, description) {
  await recordAudit({
    userId: null,
    action: 'UNAUTHORIZED_ACCESS',
    module: 'AUTH',
    description,
    httpMethod: req.method,
    endpoint: req.originalUrl,
    ipAddress: getClientIp(req),
    status: 'FAILURE',
  });
}

module.exports = authenticate;
