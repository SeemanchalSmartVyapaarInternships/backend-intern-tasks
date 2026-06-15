/**
 * src/routes/index.js
 *
 * ARCHITECTURE DECISION:
 * A single index mounts every route module onto the versioned prefix.
 * Adding a new resource requires only two lines here — nothing in app.js.
 *
 * URL structure:
 *   /api/v1/health/live
 *   /api/v1/health/ready
 *   /api/v1/users
 *   /api/v1/users/:id
 *   ... future modules here
 */

'use strict';

const express      = require('express');
const healthRoutes = require('./health.routes');
const userRoutes   = require('./user.routes');
// import future route modules here ↓
// const postRoutes   = require('./post.routes');

const router = express.Router();

// ── Mount route modules ───────────────────────────────────────────────────────
router.use('/health', healthRoutes);
router.use('/users',  userRoutes);
// router.use('/posts',  postRoutes);

module.exports = router;
