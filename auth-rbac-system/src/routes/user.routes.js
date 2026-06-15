const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../config/roles');
const {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} = require('../validators/user.validator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Profile
 *     description: Current authenticated user's profile
 *   - name: Users
 *     description: User management (Admin/Manager operations)
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticate, userController.getMyProfile);

/**
 * @swagger
 * /profile:
 *   patch:
 *     summary: Update the currently authenticated user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Jane A. Doe" }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  userController.updateMyProfile
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (paginated)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Forbidden - insufficient role
 */
router.get(
  '/users',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(listUsersQuerySchema, 'query'),
  userController.getUsers
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string, example: "John Smith" }
 *               email: { type: string, example: "john.smith@example.com" }
 *               password: { type: string, example: "Passw0rd!23" }
 *               role: { type: string, enum: [SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE], example: "EMPLOYEE" }
 *               isActive: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: User created successfully
 *       403:
 *         description: Forbidden - cannot assign this role
 *       409:
 *         description: Email already exists
 */
router.post(
  '/users',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(createUserSchema),
  userController.createUser
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get(
  '/users/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(userIdParamSchema, 'params'),
  userController.getUserById
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update an existing user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               role: { type: string, enum: [SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE] }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Forbidden - insufficient privileges
 *       404:
 *         description: User not found
 */
router.patch(
  '/users/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete your own account
 *       403:
 *         description: Forbidden - insufficient privileges
 *       404:
 *         description: User not found
 */
router.delete(
  '/users/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(userIdParamSchema, 'params'),
  userController.deleteUser
);

module.exports = router;
