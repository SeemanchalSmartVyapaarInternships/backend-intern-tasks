const RefreshToken = require('../models/RefreshToken.model');

/**
 * RefreshToken Repository
 * Encapsulates all direct interactions with the RefreshToken collection.
 */
class RefreshTokenRepository {
  /**
   * Persists a new (hashed) refresh token document.
   */
  async create({ userId, tokenHash, expiresAt, userAgent, ipAddress }) {
    return RefreshToken.create({
      userId,
      token: tokenHash,
      expiresAt,
      userAgent,
      ipAddress,
    });
  }

  /**
   * Finds an active (non-revoked, non-expired) refresh token by its hash.
   */
  async findActiveByHash(tokenHash) {
    return RefreshToken.findOne({
      token: tokenHash,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Finds any refresh token document by its hash (active or not).
   * Useful for detecting token reuse attacks.
   */
  async findByHash(tokenHash) {
    return RefreshToken.findOne({ token: tokenHash });
  }

  /**
   * Marks a single refresh token as revoked, optionally recording
   * the token that replaced it (for rotation tracking).
   */
  async revoke(tokenDoc, replacedByTokenHash = null) {
    tokenDoc.revoked = true;
    tokenDoc.revokedAt = new Date();
    if (replacedByTokenHash) {
      tokenDoc.replacedByToken = replacedByTokenHash;
    }
    return tokenDoc.save();
  }

  /**
   * Revokes ALL active refresh tokens for a given user.
   * Used on logout-from-all-devices or password change.
   */
  async revokeAllForUser(userId) {
    return RefreshToken.updateMany(
      { userId, revoked: false },
      { $set: { revoked: true, revokedAt: new Date() } }
    );
  }

  /**
   * Deletes a specific refresh token document by its hash.
   */
  async deleteByHash(tokenHash) {
    return RefreshToken.deleteOne({ token: tokenHash });
  }
}

module.exports = new RefreshTokenRepository();
