/**
 * errorHandler.middleware.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Single place where every thrown error (ApiError or otherwise) ends up.
 *   Normalizes the response shape, logs the stack trace via Winston, and
 *   writes an 'API_ERROR' audit log entry — this is what satisfies the
 *   "API Errors" audit-logging requirement.
 *
 * Connects with:
 *   - app.js registers this LAST, after all routes (Express error-handling
 *     middleware must be defined with 4 arguments and placed at the end).
 *   - utils/ApiError.js supplies the shape most thrown errors already have.
 *   - services/audit.service.js records the API_ERROR entry.
 * ----------------------------------------------------------------------------
 */

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { recordAudit } = require('../services/audit.service');
const { getClientIp } = require('../utils/deviceParser');

// eslint-disable-next-line no-unused-vars
async function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : 'Internal server error';
  const errors = isApiError ? err.errors : [];

  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  }

  // Record every 4xx/5xx as an audit trail entry for API errors, except
  // UNAUTHORIZED_ACCESS which auth.middleware.js already logs itself
  // (avoids double-logging the same event).
  if (statusCode !== 401 || err.message !== 'Authentication token is required') {
    await recordAudit({
      userId: req.user ? req.user.id : null,
      action: 'API_ERROR',
      module: 'SYSTEM',
      description: message,
      httpMethod: req.method,
      endpoint: req.originalUrl,
      ipAddress: getClientIp(req),
      status: 'FAILURE',
    });
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
  });
}

module.exports = errorHandler;
