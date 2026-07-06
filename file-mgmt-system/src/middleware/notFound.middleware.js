/**
 * notFound.middleware.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Catches any request that didn't match a defined route and forwards a
 *   404 ApiError into the central error handler, instead of Express's
 *   default HTML error page.
 *
 * Connects with:
 *   - app.js registers this after all routes, before errorHandler.
 * ----------------------------------------------------------------------------
 */

const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
