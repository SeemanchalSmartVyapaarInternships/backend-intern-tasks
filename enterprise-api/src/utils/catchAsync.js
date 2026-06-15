/**
 * src/utils/catchAsync.js
 *
 * ARCHITECTURE DECISION:
 * Express does not automatically forward async errors to the next() error
 * handler.  Wrapping every async controller with catchAsync() means:
 *   • No try/catch boilerplate in controllers
 *   • Any thrown error (including AppError) is forwarded to the global
 *     error handler via next(err)
 *
 * Usage:
 *   router.get('/users', catchAsync(UserController.getAll));
 */

'use strict';

/**
 * @param  {Function} fn  – async Express route handler
 * @returns {Function}    – wrapped handler that forwards rejections to next()
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
