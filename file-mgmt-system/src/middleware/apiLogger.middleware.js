/**
 * apiLogger.middleware.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Logs every single API request to the `api_logs` table: endpoint, method,
 *   status code, response time, requesting user (if authenticated), and IP.
 *   Applied globally in app.js so it runs on every route, before we know the
 *   final status code — so it hooks `res.on('finish')` to capture that after
 *   the response has actually been sent.
 *
 * Connects with:
 *   - models/apiLog.model.js persists the row.
 *   - app.js registers this before the route handlers.
 * ----------------------------------------------------------------------------
 */

const { createApiLog } = require('../models/apiLog.model');
const { getClientIp } = require('../utils/deviceParser');
const logger = require('../utils/logger');

function apiLogger(req, res, next) {
  const startTime = process.hrtime.bigint();

  res.on('finish', async () => {
    const endTime = process.hrtime.bigint();
    const responseTimeMs = Number(endTime - startTime) / 1_000_000;

    try {
      await createApiLog({
        userId: req.user ? req.user.id : null,
        endpoint: req.originalUrl,
        httpMethod: req.method,
        statusCode: res.statusCode,
        responseTimeMs: Math.round(responseTimeMs),
        ipAddress: getClientIp(req),
      });
    } catch (err) {
      // Never let logging failures affect the actual response, which has
      // already been sent by the time this callback runs.
      logger.error(`Failed to write api log: ${err.message}`);
    }
  });

  next();
}

module.exports = apiLogger;
