/**
 * ApiError.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   A custom Error subclass that carries an HTTP status code alongside the
 *   message. Every controller/service throws this (instead of a plain
 *   Error) so the central error-handling middleware
 *   (middleware/errorHandler.middleware.js) can send a correctly-shaped,
 *   correctly-coded JSON response without guessing the status.
 *
 * Connects with:
 *   - Thrown from controllers/services/validators.
 *   - Caught by middleware/errorHandler.middleware.js, which reads
 *     `statusCode` and `message` off it to build the response, and also
 *     writes an audit log entry for it.
 * ----------------------------------------------------------------------------
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 500...)
   * @param {string} message - Human-readable error message returned to the client
   * @param {Array}  errors - Optional array of field-level validation errors
   */
  constructor(statusCode, message = 'Something went wrong', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
