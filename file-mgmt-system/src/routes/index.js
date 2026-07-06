/**
 * index.js (routes)
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Aggregates every feature router under one Express Router, which app.js
 *   mounts once at the `/api` prefix. This keeps app.js clean and gives a
 *   single place to see the full route map.
 *
 * Final route prefixes:
 *   /api/auth           -> auth.routes.js
 *   /api                -> file.routes.js (exposes /upload/* and /files/*)
 *   /api/audit          -> audit.routes.js
 *   /api/login-history  -> loginHistory.routes.js
 *   /api/api-logs       -> apiLog.routes.js
 *
 * Connects with:
 *   - app.js: `app.use('/api', require('./routes'))`
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/', require('./file.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/login-history', require('./loginHistory.routes'));
router.use('/api-logs', require('./apiLog.routes'));

module.exports = router;
