/**
 * src/routes/user.routes.js
 *
 * ARCHITECTURE DECISION:
 * Routes are pure configuration — they wire middleware and controllers
 * together.  No logic lives here.
 *
 * Middleware execution order per route:
 *   validate(schema) → Controller method
 *
 * All routes are prefixed with /users when mounted in index.routes.js.
 */

'use strict';

const express    = require('express');
const controller = require('../controllers/user.controller');
const validate   = require('../middlewares/validate.middleware');
const {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  userIdParamSchema,
} = require('../validators/user.validator');

const router = express.Router();

// ── Collection routes ─────────────────────────────────────────────────────────

router
  .route('/')
  .get(validate(listUsersSchema, 'query'), controller.listUsers)
  .post(validate(createUserSchema),        controller.createUser);

// ── Document routes ───────────────────────────────────────────────────────────

router
  .route('/:id')
  .get(   validate(userIdParamSchema, 'params'),                             controller.getUserById)
  .put(   validate(userIdParamSchema, 'params'), validate(updateUserSchema), controller.updateUser)
  .delete(validate(userIdParamSchema, 'params'),                             controller.deleteUser);

module.exports = router;
