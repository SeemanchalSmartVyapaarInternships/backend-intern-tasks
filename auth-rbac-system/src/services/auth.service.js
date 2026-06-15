const config = require('../config/env');
const userRepository = require('../repositories/user.repository');
const tokenService = require('./token.service');
const emailService = require('./email.service');
const jwtUtil = require('../utils/jwt.util');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

/**
 * Auth Service
 * Contains the core business logic for registration, login,
 * token refresh/rotation, logout, and password reset flows.
 * Controllers should remain thin and delegate to this layer.
 */
class AuthService {
  /**
   * Registers a new user.
   * - Ensures the email is not already registered.
   * - Prevents self-registration as SUPER_ADMIN for security reasons.
   * - Password hashing is handled automatically by the User model's
   *   pre-save hook.
   */
  async register({ name, email, password, role }) {
    const emailExists = await userRepository.existsByEmail(email);
    if (emailExists) {
      throw ApiError.conflict('A user with this email already exists');
    }

    // Disallow public registration of SUPER_ADMIN accounts.
    let assignedRole = role || ROLES.EMPLOYEE;
    if (assignedRole === ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot self-register as SUPER_ADMIN');
    }

    const user = await userRepository.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    return user;
  }

  /**
   * Authenticates a user with email and password.
   * Implements account lockout after repeated failed attempts.
   *
   * @returns {{ user, accessToken, refreshToken, refreshExpiresAt }}
   */
  async login({ email, password }, meta = {}) {
    const user = await userRepository.findByEmail(email, true);

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.isLocked()) {
      throw ApiError.forbidden(
        'Account temporarily locked due to multiple failed login attempts. Please try again later.'
      );
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact an administrator.');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await userRepository.incrementFailedLoginAttempts(user);
      throw ApiError.unauthorized('Invalid email or password');
    }

    await userRepository.resetFailedLoginAttempts(user);

    const { accessToken, refreshToken, refreshExpiresAt } = await tokenService.issueTokenPair(
      user,
      meta
    );

    return { user, accessToken, refreshToken, refreshExpiresAt };
  }

  /**
   * Rotates a refresh token and returns a new token pair.
   */
  async refreshTokens(rawRefreshToken, meta = {}) {
    if (!rawRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }
    return tokenService.rotateRefreshToken(rawRefreshToken, meta);
  }

  /**
   * Logs the user out of the current device by revoking the
   * provided refresh token.
   */
  async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;
    await tokenService.revokeRefreshToken(rawRefreshToken);
  }

  /**
   * Logs the user out of all devices by revoking every refresh
   * token associated with their account.
   */
  async logoutAll(userId) {
    await tokenService.revokeAllUserTokens(userId);
  }

  /**
   * Initiates the password reset flow:
   * - Generates a secure random token and stores its hash + expiry.
   * - Emails the user a reset link containing the raw (unhashed) token.
   *
   * For security, this method does not reveal whether the email exists.
   */
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Avoid leaking which emails are registered.
      return;
    }

    const { rawToken, hashedToken } = jwtUtil.generateSecureToken();

    user.passwordResetTokenHash = hashedToken;
    user.passwordResetExpires = new Date(
      Date.now() + config.passwordReset.expiresInMinutes * 60 * 1000
    );
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${config.passwordReset.clientUrl}?token=${rawToken}&email=${encodeURIComponent(
      user.email
    )}`;

    await emailService.sendPasswordResetEmail(user, resetUrl);
  }

  /**
   * Completes the password reset flow:
   * - Validates the provided raw token against the stored hash + expiry.
   * - Sets the new password (hashed automatically by the model).
   * - Invalidates the reset token and revokes all existing sessions.
   */
  async resetPassword(rawToken, newPassword) {
    const hashedToken = jwtUtil.hashToken(rawToken);
    const user = await userRepository.findByResetTokenHash(hashedToken);

    if (!user) {
      throw ApiError.badRequest('Password reset token is invalid or has expired');
    }

    user.password = newPassword;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate all existing sessions for security.
    await tokenService.revokeAllUserTokens(user._id);

    return user;
  }

  /**
   * Allows an authenticated user to change their own password
   * by providing their current password.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId, true);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    await tokenService.revokeAllUserTokens(user._id);

    return user;
  }
}

module.exports = new AuthService();
