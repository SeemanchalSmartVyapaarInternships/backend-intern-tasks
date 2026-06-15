const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * JWT helper utilities.
 * Access tokens are short-lived and carry the user's id and role.
 * Refresh tokens are long-lived, opaque-looking JWTs whose raw value
 * is also hashed and persisted in the database so they can be
 * revoked/rotated server-side.
 */

/**
 * Generates a signed JWT access token.
 * @param {object} payload - Must contain at least { id, role }
 * @returns {string} signed JWT
 */
const generateAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    subject: String(payload.id),
  });

/**
 * Generates a signed JWT refresh token.
 * @param {object} payload - Must contain at least { id }
 * @returns {string} signed JWT
 */
const generateRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    subject: String(payload.id),
  });

/**
 * Verifies an access token. Throws if invalid/expired.
 */
const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

/**
 * Verifies a refresh token. Throws if invalid/expired.
 */
const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

/**
 * Generates a cryptographically secure random token (used for
 * password reset links). Returns both the raw token (sent to user)
 * and its SHA-256 hash (stored in the database).
 */
const generateSecureToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

/**
 * Hashes an arbitrary token string using SHA-256.
 * Used to hash refresh tokens / reset tokens before persisting them,
 * so that raw tokens are never stored in the database.
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Converts a duration string like "15m" or "7d" into milliseconds.
 * Supports s (seconds), m (minutes), h (hours), d (days).
 */
const durationToMs = (duration) => {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  durationToMs,
};
