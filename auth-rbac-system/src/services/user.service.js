const userRepository = require('../repositories/user.repository');
const tokenService = require('./token.service');
const ApiError = require('../utils/ApiError');
const { ROLES, ROLE_HIERARCHY } = require('../config/roles');

/**
 * User Service
 * Business logic for user management (admin/manager operations
 * such as listing, creating, updating, and deleting users).
 */
class UserService {
  /**
   * Returns the profile of the currently authenticated user.
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Updates the profile of the currently authenticated user.
   * Restricted to safe, self-editable fields only (name).
   * Role/isActive changes must go through admin endpoints.
   */
  async updateProfile(userId, updates) {
    const allowedUpdates = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;

    const user = await userRepository.updateById(userId, allowedUpdates);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Returns a paginated list of users. Available to ADMIN and above.
   */
  async listUsers({ page = 1, limit = 10, role, isActive }) {
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;

    return userRepository.findAll({ filter, page: Number(page), limit: Number(limit) });
  }

  /**
   * Returns a single user by id.
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Creates a new user as an administrative action.
   * Enforces that an actor cannot create a user with a role
   * higher than or equal to their own (except SUPER_ADMIN).
   */
  async createUser(actor, { name, email, password, role, isActive }) {
    const emailExists = await userRepository.existsByEmail(email);
    if (emailExists) {
      throw ApiError.conflict('A user with this email already exists');
    }

    const targetRole = role || ROLES.EMPLOYEE;
    this.assertCanAssignRole(actor, targetRole);

    return userRepository.create({
      name,
      email,
      password,
      role: targetRole,
      isActive: isActive !== undefined ? isActive : true,
    });
  }

  /**
   * Updates an existing user as an administrative action.
   * Prevents privilege escalation by enforcing role hierarchy rules.
   */
  async updateUser(actor, targetId, updates) {
    const targetUser = await userRepository.findById(targetId);
    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }

    this.assertCanModifyTarget(actor, targetUser);

    if (updates.role) {
      this.assertCanAssignRole(actor, updates.role);
    }

    const allowedFields = ['name', 'email', 'role', 'isActive'];
    const sanitizedUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    const updatedUser = await userRepository.updateById(targetId, sanitizedUpdates);

    // If the user was deactivated or had their role changed, revoke sessions.
    if (updates.isActive === false || updates.role) {
      await tokenService.revokeAllUserTokens(targetId);
    }

    return updatedUser;
  }

  /**
   * Deletes a user as an administrative action.
   */
  async deleteUser(actor, targetId) {
    const targetUser = await userRepository.findById(targetId);
    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }

    if (String(actor.id) === String(targetUser._id)) {
      throw ApiError.badRequest('You cannot delete your own account');
    }

    this.assertCanModifyTarget(actor, targetUser);

    await userRepository.deleteById(targetId);
    await tokenService.revokeAllUserTokens(targetId);

    return targetUser;
  }

  /**
   * Ensures the actor's role outranks (or equals, for SUPER_ADMIN)
   * the role they are attempting to assign — prevents privilege
   * escalation (e.g. an ADMIN creating another SUPER_ADMIN).
   */
  assertCanAssignRole(actor, targetRole) {
    if (actor.role === ROLES.SUPER_ADMIN) return;

    if (ROLE_HIERARCHY[targetRole] >= ROLE_HIERARCHY[actor.role]) {
      throw ApiError.forbidden(
        `You do not have permission to assign the role "${targetRole}"`
      );
    }
  }

  /**
   * Ensures the actor outranks the target user, preventing
   * lower-privileged roles from modifying equal/higher-privileged
   * accounts (except SUPER_ADMIN, which can modify anyone).
   */
  assertCanModifyTarget(actor, targetUser) {
    if (actor.role === ROLES.SUPER_ADMIN) return;

    if (ROLE_HIERARCHY[targetUser.role] >= ROLE_HIERARCHY[actor.role]) {
      throw ApiError.forbidden('You do not have permission to modify this user');
    }
  }
}

module.exports = new UserService();
