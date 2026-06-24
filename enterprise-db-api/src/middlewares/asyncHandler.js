'use strict';

/**
 * Wraps async controller functions and forwards any rejected promise
 * to Express's next() error pipeline — no try/catch needed in controllers.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
