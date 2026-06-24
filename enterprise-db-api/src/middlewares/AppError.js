'use strict';

class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status     = statusCode >= 500 ? 'error' : 'fail';
    this.isOperational = true;   // Distinguishes known errors from bugs
    this.errors     = errors;    // Optional array of validation errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
