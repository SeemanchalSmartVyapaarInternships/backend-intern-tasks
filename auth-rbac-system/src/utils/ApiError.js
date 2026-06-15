/**
 * Custom application error class used for all operational errors
 * (i.e. expected errors such as validation failures, auth failures,
 * not-found resources, etc.) so the centralized error handler can
 * distinguish them from unexpected programming errors.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human readable error message
   * @param {boolean} isOperational - Whether this is a known/expected error
   * @param {object|null} details - Additional error details (e.g. validation errors)
   */
  constructor(statusCode, message, isOperational = true, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, true, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, true);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, true);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, true);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message, true);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message, true);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, false);
  }
}

module.exports = ApiError;
