/**
 * src/middlewares/requestId.middleware.js
 *
 * ARCHITECTURE DECISION:
 * Every inbound request gets a unique ID (UUID v4) stored on:
 *   • res.locals.requestId   – available to all subsequent middleware & controllers
 *   • X-Request-ID response header – returned to the client so they can
 *     correlate frontend logs with backend logs
 *
 * If the client already sends an X-Request-ID header (e.g., from a gateway),
 * we honour it — enabling end-to-end distributed tracing.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * @type {import('express').RequestHandler}
 */
const requestIdMiddleware = (req, res, next) => {
  // Honour incoming request ID (e.g., from API gateway / upstream service)
  const incomingId = req.headers['x-request-id'];
  const requestId  = incomingId || uuidv4();

  // Attach to locals so any downstream code can read it without touching req
  res.locals.requestId = requestId;

  // Echo back on the response so clients can trace their request
  res.setHeader('X-Request-ID', requestId);

  next();
};

module.exports = requestIdMiddleware;
