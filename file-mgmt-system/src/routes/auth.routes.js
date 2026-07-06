/**
 * auth.routes.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Defines all /auth/* endpoints: register, login, logout, profile,
 *   password change. Applies Joi validation and the rate limiter to login.
 *
 * Connects with:
 *   - controllers/auth.controller.js for handlers.
 *   - middleware/validate.middleware.js + validators/auth.validator.js
 *   - middleware/auth.middleware.js protects logout/profile/password routes.
 *   - middleware/rateLimiter.middleware.js (authLimiter) throttles login.
 *   - routes/index.js mounts this router at /api/auth.
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require('../validators/auth.validator');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);

router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
