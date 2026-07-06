/**
 * loginHistory.routes.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Defines GET /login-history, restricted to admins.
 *
 * Connects with:
 *   - controllers/loginHistory.controller.js
 *   - middleware/auth.middleware.js + middleware/role.middleware.js
 *   - routes/index.js mounts this at /api/login-history.
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const { getLoginHistory } = require('../controllers/loginHistory.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.get('/', authenticate, authorize('admin'), getLoginHistory);

module.exports = router;
