/**
 * src/middlewares/errorHandler.middleware.js
 *
 * ARCHITECTURE DECISION:
 * Express error middleware (4-argument signature) is the SINGLE exit point
 * for all errors.  It:
 *   1. Normalises known third-party errors (JWT, Mongoose, DB) into AppError
 *   2. Logs the error (always) with request context
 *   3. Sends a consistent ApiResponse.error() envelope to the client
 *
 * Rule: controllers/services NEVER send error responses themselves — they
 * always throw (or pass next(err)) and let this handler respond.
 */

'use strict';

const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const logger      = require('../utils/logger');
const config      = require('../config');

// ── Error normalisers ─────────────────────────────────────────────────────────

/**
 * CastError — typically from Mongoose when an ObjectId is malformed.
 */
function handleCastError(err) {
  return AppError.badRequest(`Invalid value for field: ${err.path}`);
}

/**
 * Duplicate key error (MongoDB / Postgres unique constraint violation).
 */
function handleDuplicateKeyError(err) {
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
  return AppError.conflict(`Duplicate value for: ${field}`);
}

/**
 * Mongoose / Joi validation error — unwrap into array of field-level messages.
 */
function handleValidationError(err) {
  const errors = Object.values(err.errors || {}).map((e) => ({
    field:   e.path || e.context?.key || 'unknown',
    message: e.message,
  }));
  return AppError.badRequest('Validation failed', errors);
}

/**
 * JWT errors.
 */
function handleJWTError() {
  return AppError.unauthorized('Invalid token. Please log in again.');
}

function handleJWTExpiredError() {
  return AppError.unauthorized('Your token has expired. Please log in again.');
}

// ── Main error handler ────────────────────────────────────────────────────────

/**
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default values
  let error = err;

  // ── Normalise known error types ──────────────────────────────
  if (err.name === 'CastError')              error = handleCastError(err);
  if (err.code === 11000)                    error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError')        error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError')      error = handleJWTError();
  if (err.name === 'TokenExpiredError')      error = handleJWTExpiredError();

  // Ensure we always have statusCode & message
  error.statusCode = error.statusCode || 500;
  error.message    = error.message    || 'Internal Server Error';

  // ── Logging ──────────────────────────────────────────────────
  const logPayload = {
    requestId:  res.locals.requestId,
    method:     req.method,
    url:        req.originalUrl,
    statusCode: error.statusCode,
    message:    error.message,
    stack:      error.stack,
    body:       req.body,
  };

  if (error.statusCode >= 500) {
    logger.error('SERVER ERROR', logPayload);
  } else {
    logger.warn('CLIENT ERROR', logPayload);
  }

  // ── Response ─────────────────────────────────────────────────
  // For non-operational (programming) errors in production, hide details
  if (!error.isOperational && config.isProd) {
    return ApiResponse.error(res, {
      message:    'Something went wrong. Please try again later.',
      statusCode: 500,
    });
  }

  return ApiResponse.error(res, {
    message:    error.message,
    statusCode: error.statusCode,
    errors:     error.errors || null,
    stack:      error.stack,
  });
};

module.exports = errorHandler;
