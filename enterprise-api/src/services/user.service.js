/**
 * src/services/user.service.js
 *
 * ARCHITECTURE DECISION:
 * The Service layer owns ALL business logic.  It knows nothing about HTTP
 * (no req/res).  This makes it:
 *   • Testable without an HTTP server
 *   • Reusable from CLI scripts, workers, other services
 *
 * In a real application this layer would interact with your database via a
 * Repository / ORM.  Here we use an in-memory store so the project runs
 * out of the box without a DB.  Swapping in a real DB only requires
 * editing this file — nothing else changes.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const AppError        = require('../utils/AppError');
const logger          = require('../utils/logger');

// ── In-memory data store (replace with DB calls in production) ────────────────
let users = [
  {
    id:        'a1b2c3d4-0000-4000-8000-000000000001',
    name:      'Alice Admin',
    email:     'alice@example.com',
    password:  '$2b$12$hashedpassword1',   // never returned to client
    role:      'admin',
    isActive:  true,
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
  {
    id:        'a1b2c3d4-0000-4000-8000-000000000002',
    name:      'Bob User',
    email:     'bob@example.com',
    password:  '$2b$12$hashedpassword2',
    role:      'user',
    isActive:  true,
    createdAt: new Date('2024-02-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-02-01T00:00:00Z').toISOString(),
  },
];

// ── Private helper ────────────────────────────────────────────────────────────

/** Strip sensitive fields before returning to the controller */
function sanitize(user) {
  const { password: _pw, ...safe } = user; // eslint-disable-line no-unused-vars
  return safe;
}

// ── Service methods ───────────────────────────────────────────────────────────

class UserService {
  /**
   * List users with optional search, filter, sort, and pagination.
   */
  async listUsers({ page = 1, limit = 10, role, search, sortBy = 'createdAt', order = 'desc' } = {}) {
    logger.debug('UserService.listUsers', { page, limit, role, search, sortBy, order });

    let result = [...users];

    // Filter by role
    if (role) result = result.filter((u) => u.role === role);

    // Search by name or email (case-insensitive)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      const cmp  = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return order === 'asc' ? cmp : -cmp;
    });

    const totalItems = result.length;

    // Paginate
    const start   = (page - 1) * limit;
    const paginated = result.slice(start, start + limit).map(sanitize);

    return { users: paginated, totalItems };
  }

  /**
   * Get a single user by ID — throws 404 if not found.
   */
  async getUserById(id) {
    logger.debug('UserService.getUserById', { id });

    const user = users.find((u) => u.id === id);
    if (!user) throw AppError.notFound(`User with ID ${id} not found`);

    return sanitize(user);
  }

  /**
   * Create a new user — throws 409 if email already exists.
   */
  async createUser(data) {
    logger.debug('UserService.createUser', { email: data.email });

    const existing = users.find((u) => u.email === data.email.toLowerCase());
    if (existing) throw AppError.conflict(`Email already registered: ${data.email}`);

    // In production: hash the password here with bcrypt
    // const hashed = await bcrypt.hash(data.password, config.bcryptSaltRounds);

    const now  = new Date().toISOString();
    const user = {
      id:        uuidv4(),
      name:      data.name,
      email:     data.email.toLowerCase(),
      password:  `[hashed]${data.password}`, // placeholder
      role:      data.role || 'user',
      isActive:  true,
      createdAt: now,
      updatedAt: now,
    };

    users.push(user);
    logger.info('User created', { userId: user.id, email: user.email });

    return sanitize(user);
  }

  /**
   * Update a user by ID — throws 404 if not found, 409 on email conflict.
   */
  async updateUser(id, data) {
    logger.debug('UserService.updateUser', { id });

    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw AppError.notFound(`User with ID ${id} not found`);

    // Check email uniqueness if email is being changed
    if (data.email) {
      const emailLower = data.email.toLowerCase();
      const conflict   = users.find((u) => u.email === emailLower && u.id !== id);
      if (conflict) throw AppError.conflict(`Email already in use: ${data.email}`);
      data.email = emailLower;
    }

    users[index] = {
      ...users[index],
      ...data,
      id,                             // id is immutable
      updatedAt: new Date().toISOString(),
    };

    logger.info('User updated', { userId: id });
    return sanitize(users[index]);
  }

  /**
   * Delete a user by ID — throws 404 if not found.
   */
  async deleteUser(id) {
    logger.debug('UserService.deleteUser', { id });

    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw AppError.notFound(`User with ID ${id} not found`);

    users.splice(index, 1);
    logger.info('User deleted', { userId: id });
  }
}

module.exports = new UserService(); // export singleton
