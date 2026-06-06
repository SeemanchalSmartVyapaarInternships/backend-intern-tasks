/**
 * src/utils/AppError.js
 *
 * ARCHITECTURE DECISION:
 * We distinguish two error categories:
 *
 *  1. OPERATIONAL errors (isOperational = true):
 *     Expected failures that our code deliberately triggers — 404 Not Found,
 *     400 Bad Request, 401 Unauthorized, etc.
 *     Safe to expose the message to the client.
 *
 *  2. PROGRAMMING / UNEXPECTED errors (isOperational = false):
 *     Bugs, unhandled rejections, third-party failures.
 *     We log the full stack and return a generic "Internal Server Error".
 *
 * The global error handler uses `isOperational` to decide what to show.
 */

'use strict';

class AppError extends Error {
  /**
   * @param {string}  message     – error message (shown to client for operational errors)
   * @param {number}  statusCode  – HTTP status code
   * @param {Array}   [errors]    – optional array of field-level validation errors
   */
  constructor(message, statusCode, errors = null) {
    super(message);

    this.statusCode    = statusCode;
    this.status        = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;   // mark as a known, handled error
    this.errors        = errors; // structured validation errors if any

    // Capture stack trace, excluding the constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Static factory helpers ───────────────────────────────────────────────

  static badRequest(message = 'Bad Request', errors = null) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message = 'Resource already exists') {
    return new AppError(message, 409);
  }

  static unprocessable(message = 'Unprocessable Entity', errors = null) {
    return new AppError(message, 422, errors);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new AppError(message, 429);
  }

  static internal(message = 'Internal Server Error') {
    return new AppError(message, 500);
  }
}

module.exports = AppError;
