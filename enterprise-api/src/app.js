/**
 * src/app.js
 *
 * ARCHITECTURE DECISION:
 * app.js is a pure Express application factory.  It does NOT start the HTTP
 * server (that is server.js's job).  This separation allows:
 *   • Supertest to spin up the app in tests without binding a port
 *   • Clean separation of "app configuration" vs "process management"
 *
 * Middleware mounting order matters:
 *   1. Security (helmet, cors, rate limiter)
 *   2. Request tracking (must be early so all logs carry the request ID)
 *   3. HTTP logger
 *   4. Body parsers
 *   5. Compression
 *   6. Application routes
 *   7. 404 handler    ← after all routes
 *   8. Global error handler ← always last
 */

'use strict';

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');

const config       = require('./config');
const routes       = require('./routes');
const requestId    = require('./middlewares/requestId.middleware');
const reqLogger    = require('./middlewares/requestLogger.middleware');
const notFound     = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const logger       = require('./utils/logger');

// ── App factory ───────────────────────────────────────────────────────────────

function createApp() {
  const app = express();

  // ── 1. Security headers ────────────────────────────────────────
  // helmet sets ~15 security-related HTTP headers with sane defaults
  app.use(helmet());

  // ── 2. CORS ────────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (config.cors.origins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders:   ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders:   ['X-Request-ID'],
    credentials:      true,
    optionsSuccessStatus: 200,
  }));

  // ── 3. Rate limiting ───────────────────────────────────────────
  // Applied globally; tighten on auth routes in production
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max:      config.rateLimit.maxRequests,
    standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
    legacyHeaders:   false,
    message: {
      success:    false,
      statusCode: 429,
      message:    'Too many requests. Please try again later.',
    },
  });
  app.use(limiter);

  // ── 4. Request ID ──────────────────────────────────────────────
  app.use(requestId);

  // ── 5. HTTP access logger ──────────────────────────────────────
  app.use(reqLogger);

  // ── 6. Body parsers ────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));         // parse JSON bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // form bodies

  // ── 7. Response compression ────────────────────────────────────
  app.use(compression());

  // ── 8. API routes ──────────────────────────────────────────────
  app.use(config.apiPrefix, routes);

  // ── 9. Root route — quick sanity check ────────────────────────
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: `${config.appName} v${config.appVersion} is running`,
      docs:    `${config.apiPrefix}/health/ready`,
    });
  });

  // ── 10. 404 handler (unmatched routes) ─────────────────────────
  app.use(notFound);

  // ── 11. Global error handler (MUST be last) ────────────────────
  app.use(errorHandler);

  logger.debug('Express application configured');
  return app;
}

module.exports = createApp;
