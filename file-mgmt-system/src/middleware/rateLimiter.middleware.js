/**
 * rateLimiter.middleware.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Two rate limiters:
 *     - `generalLimiter` applied globally in app.js to throttle abusive
 *       clients across the whole API.
 *     - `authLimiter` applied specifically to /auth/login with a tighter
 *       window, to slow down brute-force password guessing.
 *
 * Connects with:
 *   - app.js applies generalLimiter to all routes.
 *   - routes/auth.routes.js applies authLimiter to POST /auth/login.
 * ----------------------------------------------------------------------------
 */

const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many login attempts, please try again later' },
});

module.exports = { generalLimiter, authLimiter };
