const config = require('../config/env');
const jwtUtil = require('./jwt.util');

/**
 * Cookie options for the refresh token cookie.
 * - httpOnly: prevents access via client-side JavaScript (XSS mitigation)
 * - secure: only sent over HTTPS in production
 * - sameSite: 'strict' mitigates CSRF for cookie-based flows
 */
const refreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: 'strict',
  path: '/api/v1/auth', // restrict cookie to auth routes only
  maxAge: jwtUtil.durationToMs(config.jwt.refreshExpiresIn),
});

/**
 * Cookie options for the (optional) access token cookie, used as
 * a fallback transport for browser-based clients.
 */
const accessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: 'strict',
  path: '/',
  maxAge: jwtUtil.durationToMs(config.jwt.accessExpiresIn),
});

/**
 * Sets both the access and refresh token cookies on the response.
 */
const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken', accessToken, accessTokenCookieOptions());
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions());
};

/**
 * Clears both auth cookies (used on logout).
 */
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
};

module.exports = { setAuthCookies, clearAuthCookies, refreshTokenCookieOptions, accessTokenCookieOptions };
