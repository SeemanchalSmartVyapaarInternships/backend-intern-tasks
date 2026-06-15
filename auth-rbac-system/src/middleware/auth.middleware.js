const jwtUtil = require('../utils/jwt.util');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User.model');

/**
 * Extracts a Bearer token from the Authorization header, falling
 * back to the `accessToken` cookie if present.
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * Authentication middleware.
 * - Verifies the JWT access token (signature + expiry).
 * - Loads the corresponding user from the database.
 * - Rejects requests where the user no longer exists, is deactivated,
 *   or has changed their password since the token was issued.
 * - Attaches the authenticated user to `req.user`.
 */
const authenticate = catchAsync(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw ApiError.unauthorized('Authentication token is missing');
  }

  let decoded;
  try {
    decoded = jwtUtil.verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token has expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }

  const user = await User.findById(decoded.id).select('+passwordChangedAt');

  if (!user) {
    throw ApiError.unauthorized('User belonging to this token no longer exists');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password was changed recently. Please log in again');
  }

  // Attach a lean representation to the request for downstream handlers.
  req.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };

  next();
});

module.exports = authenticate;
