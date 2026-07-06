/**
 * app.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Builds and configures the Express application: global security
 *   middleware (Helmet, CORS, rate limiting), body parsing, request
 *   logging, route mounting, and the final 404 + error handlers.
 *   Exports the configured app WITHOUT calling .listen() — that's
 *   server.js's job — which keeps this file testable in isolation.
 *
 * Connects with:
 *   - server.js imports this and calls app.listen().
 *   - routes/index.js supplies all /api/* routes.
 *   - middleware/apiLogger.middleware.js, rateLimiter, errorHandler,
 *     notFound are all wired in here, in the order that matters.
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const apiLogger = require('./middleware/apiLogger.middleware');
const { generalLimiter } = require('./middleware/rateLimiter.middleware');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

// --- Security middleware -----------------------------------------------
app.use(helmet()); // sets secure HTTP headers (XSS protection, no-sniff, etc.)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(generalLimiter); // global rate limiting for all routes

// --- Body parsing ---------------------------------------------------------
app.use(express.json({ limit: '10kb' })); // JSON bodies only; file uploads use multipart, handled by Multer separately
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- Request logging (every request, regardless of outcome) ---------------
app.use(apiLogger);

// --- Health check (useful for uptime monitors / load balancers) -----------
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// --- API routes -------------------------------------------------------
app.use('/api', routes);

// --- 404 + centralized error handling (must be registered last) ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
