const User = require('../models/User.model');

/**
 * User Repository
 * Encapsulates all direct interactions with the User collection.
 * Services should depend on this layer rather than calling
 * Mongoose models directly, keeping persistence logic isolated
 * and easy to mock in tests.
 */
class UserRepository {
  /**
   * Creates a new user document.
   */
  async create(userData) {
    return User.create(userData);
  }

  /**
   * Finds a user by email. Optionally includes the password field
   * (needed for login / password comparison).
   */
  async findByEmail(email, withPassword = false) {
    const query = User.findOne({ email: email.toLowerCase() });
    if (withPassword) {
      query.select('+password +failedLoginAttempts +lockUntil +passwordChangedAt');
    }
    return query;
  }

  /**
   * Finds a user by their MongoDB ObjectId.
   */
  async findById(id, withPassword = false) {
    const query = User.findById(id);
    if (withPassword) {
      query.select('+password +passwordChangedAt');
    }
    return query;
  }

  /**
   * Finds a user by a hashed password reset token, ensuring the
   * token has not yet expired.
   */
  async findByResetTokenHash(hashedToken) {
    return User.findOne({
      passwordResetTokenHash: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetTokenHash +passwordResetExpires +password');
  }

  /**
   * Returns a paginated list of users with optional filters.
   */
  async findAll({ filter = {}, page = 1, limit = 10, sort = '-createdAt' }) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Updates a user document by id and returns the updated document.
   */
  async updateById(id, update, options = { new: true, runValidators: true }) {
    return User.findByIdAndUpdate(id, update, options);
  }

  /**
   * Deletes a user document by id.
   */
  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  /**
   * Checks whether a user with the given email already exists.
   */
  async existsByEmail(email) {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  /**
   * Increments the failed login attempt counter and locks the
   * account if the threshold is exceeded.
   */
  async incrementFailedLoginAttempts(user) {
    const MAX_ATTEMPTS = 5;
    const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      user.failedLoginAttempts = 0;
    }

    await user.save({ validateBeforeSave: false });
  }

  /**
   * Resets the failed login attempt counter after a successful login.
   */
  async resetFailedLoginAttempts(user) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }
}

module.exports = new UserRepository();
