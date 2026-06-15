const config = require('../config/env');
const jwtUtil = require('../utils/jwt.util');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Token Service
 * Centralizes all JWT issuance, rotation, and revocation logic so that
 * controllers/services never manipulate tokens or the RefreshToken
 * collection directly.
 */
class TokenService {
  /**
   * Generates a new access + refresh token pair for a user and
   * persists a hashed record of the refresh token.
   *
   * @param {object} user - Mongoose user document (must have _id and role)
   * @param {object} meta - { userAgent, ipAddress } for audit/session tracking
   * @returns {{ accessToken: string, refreshToken: string, refreshExpiresAt: Date }}
   */
  async issueTokenPair(user, meta = {}) {
    const payload = { id: user._id.toString(), role: user.role };

    const accessToken = jwtUtil.generateAccessToken(payload);
    const refreshToken = jwtUtil.generateRefreshToken({ id: user._id.toString() });

    const refreshExpiresAt = new Date(
      Date.now() + jwtUtil.durationToMs(config.jwt.refreshExpiresIn)
    );

    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash: jwtUtil.hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  /**
   * Validates an incoming refresh token, rotates it (revokes the old
   * one and issues a new pair), and returns the new token pair.
   *
   * Implements rotation with reuse detection: if a revoked token is
   * presented again, all of the user's sessions are revoked, as this
   * indicates the refresh token may have been stolen.
   *
   * @param {string} rawRefreshToken
   * @param {object} meta - { userAgent, ipAddress }
   */
  async rotateRefreshToken(rawRefreshToken, meta = {}) {
    let decoded;
    try {
      decoded = jwtUtil.verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = jwtUtil.hashToken(rawRefreshToken);
    const storedToken = await refreshTokenRepository.findByHash(tokenHash);

    if (!storedToken) {
      throw ApiError.unauthorized('Refresh token not recognized');
    }

    if (!storedToken.isActive()) {
      // Possible token reuse / theft — revoke all sessions for safety.
      logger.warn(`Refresh token reuse detected for user ${storedToken.userId}`);
      await refreshTokenRepository.revokeAllForUser(storedToken.userId);
      throw ApiError.unauthorized('Refresh token has been revoked. Please log in again.');
    }

    const User = require('../models/User.model'); // lazy require to avoid circular deps
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Issue new pair
    const newPayload = { id: user._id.toString(), role: user.role };
    const newAccessToken = jwtUtil.generateAccessToken(newPayload);
    const newRefreshToken = jwtUtil.generateRefreshToken({ id: user._id.toString() });
    const newRefreshHash = jwtUtil.hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + jwtUtil.durationToMs(config.jwt.refreshExpiresIn));

    // Revoke old token and link it to the new one (rotation chain)
    await refreshTokenRepository.revoke(storedToken, newRefreshHash);

    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash: newRefreshHash,
      expiresAt: newExpiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      refreshExpiresAt: newExpiresAt,
      user,
    };
  }

  /**
   * Revokes a single refresh token (used on logout from current device).
   */
  async revokeRefreshToken(rawRefreshToken) {
    const tokenHash = jwtUtil.hashToken(rawRefreshToken);
    const storedToken = await refreshTokenRepository.findByHash(tokenHash);

    if (storedToken && storedToken.isActive()) {
      await refreshTokenRepository.revoke(storedToken);
    }
  }

  /**
   * Revokes all refresh tokens belonging to a user (logout from all devices,
   * or invalidate sessions after a password change/reset).
   */
  async revokeAllUserTokens(userId) {
    await refreshTokenRepository.revokeAllForUser(userId);
  }
}

module.exports = new TokenService();
