/**
 * src/config/index.js
 *
 * ARCHITECTURE DECISION:
 * All environment variables are read ONCE here, validated, and exported
 * as a frozen plain object.  The rest of the codebase imports from this
 * module — never from process.env directly.  This gives us:
 *   • One place to audit what env vars the app needs
 *   • Fast-fail on startup when required vars are missing
 *   • Easy mocking in tests (just replace this module)
 */

'use strict';

require('dotenv').config();

/**
 * Reads an env var; throws if it is required and missing.
 * @param {string} key
 * @param {*}      defaultValue  – omit or pass undefined to mark as required
 */
function get(key, defaultValue) {
  const value = process.env[key];

  if (value !== undefined && value !== '') return value;

  if (defaultValue !== undefined) return defaultValue;

  throw new Error(`[Config] Missing required environment variable: "${key}"`);
}

const config = Object.freeze({
  // ── App ──────────────────────────────────────────────────────
  env:        get('NODE_ENV',      'development'),
  appName:    get('APP_NAME',      'EnterpriseAPI'),
  appVersion: get('APP_VERSION',   '1.0.0'),
  port:       parseInt(get('PORT', '3000'), 10),
  apiPrefix:  get('API_PREFIX',    '/api/v1'),

  // Convenience flags
  isDev:  get('NODE_ENV', 'development') === 'development',
  isProd: get('NODE_ENV', 'development') === 'production',
  isTest: get('NODE_ENV', 'development') === 'test',

  // ── Security ─────────────────────────────────────────────────
  jwt: {
    secret:    get('JWT_SECRET'),
    expiresIn: get('JWT_EXPIRES_IN', '7d'),
  },
  bcryptSaltRounds: parseInt(get('BCRYPT_SALT_ROUNDS', '12'), 10),

  // ── Rate Limiting ─────────────────────────────────────────────
  rateLimit: {
    windowMs:    parseInt(get('RATE_LIMIT_WINDOW_MS',    '900000'), 10),
    maxRequests: parseInt(get('RATE_LIMIT_MAX_REQUESTS', '100'),    10),
  },

  // ── Logging ──────────────────────────────────────────────────
  logging: {
    level: get('LOG_LEVEL', 'info'),
    dir:   get('LOG_DIR',   'logs'),
  },

  // ── CORS ─────────────────────────────────────────────────────
  cors: {
    // Support comma-separated list of allowed origins
    origins: get('CORS_ORIGIN', 'http://localhost:3000').split(','),
  },

  // ── Database ─────────────────────────────────────────────────
  db: {
    host:     get('DB_HOST',     'localhost'),
    port:     parseInt(get('DB_PORT', '5432'), 10),
    name:     get('DB_NAME',     'enterprise_db'),
    user:     get('DB_USER',     'postgres'),
    password: get('DB_PASSWORD', ''),
  },
});

module.exports = config;
