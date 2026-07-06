/**
 * apiLog.routes.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Defines GET /api-logs, restricted to admins.
 *
 * Connects with:
 *   - controllers/apiLog.controller.js
 *   - middleware/auth.middleware.js + middleware/role.middleware.js
 *   - routes/index.js mounts this at /api/api-logs.
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const { getApiLogs } = require('../controllers/apiLog.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.get('/', authenticate, authorize('admin'), getApiLogs);

module.exports = router;
