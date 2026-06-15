const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

/**
 * Converts known third-party/library errors (Mongoose, JWT, etc.)
 * into our standardized ApiError so the final handler can treat
 * everything uniformly.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.badRequest('Validation failed', details);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return ApiError.conflict(`Duplicate value for field: ${field}`);
  }

  // Mongoose invalid ObjectId / CastError
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for field: ${err.path}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token has expired');
  }

  // Fallback: unexpected/programming error
  return ApiError.internal(err.message || 'Internal server error');
};

/**
 * 404 handler for unmatched routes. Should be registered after
 * all other routes but before the error handler.
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized error-handling middleware.
 * Must be registered LAST in the middleware chain (4 arguments
 * signals Express that this is an error handler).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const apiError = normalizeError(err);

  // Log operational errors as warnings, programming errors as errors.
  if (apiError.isOperational) {
    logger.warn(`${req.method} ${req.originalUrl} -> ${apiError.statusCode} ${apiError.message}`);
  } else {
    logger.error(`${req.method} ${req.originalUrl} -> ${apiError.message}`, {
      stack: err.stack,
    });
  }

  const response = new ApiResponse(
    apiError.statusCode,
    apiError.message,
    apiError.details ? { errors: apiError.details } : undefined
  );

  // Include stack trace only in non-production environments for debugging.
  if (!config.isProduction && !apiError.isOperational) {
    response.stack = err.stack;
  }

  response.send(res);
};

module.exports = { errorHandler, notFoundHandler };
