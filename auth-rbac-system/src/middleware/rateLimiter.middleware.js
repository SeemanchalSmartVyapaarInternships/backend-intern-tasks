const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Builds a JSON response in the application's standard format
 * when a rate limit is exceeded.
 */
const rateLimitHandler = (req, res) => {
  new ApiResponse(429, 'Too many requests. Please try again later.').send(res);
};

/**
 * General-purpose rate limiter applied to all API routes.
 * Default: 100 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Stricter rate limiter for sensitive authentication endpoints
 * (login, register, forgot-password) to mitigate brute-force
 * and credential-stuffing attacks.
 * Default: 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
});

module.exports = { generalLimiter, authLimiter };
