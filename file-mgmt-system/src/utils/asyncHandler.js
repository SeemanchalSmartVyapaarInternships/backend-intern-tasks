/**
 * asyncHandler.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Wraps async Express route handlers so any rejected promise (thrown
 *   error) is automatically forwarded to `next(err)` instead of crashing
 *   the process or requiring a try/catch block in every single controller.
 *
 * Connects with:
 *   - Every function exported from controllers/* is wrapped with this
 *     before being passed to routes/*.
 *   - Errors it forwards end up in middleware/errorHandler.middleware.js.
 * ----------------------------------------------------------------------------
 */

const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
