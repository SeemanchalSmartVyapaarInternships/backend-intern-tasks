/**
 * file.validator.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Joi schema for the GET /files query string (pagination + category
 *   filter). File *content* validation (type/size) happens in
 *   middleware/upload.middleware.js because that's driven by Multer's
 *   fileFilter, not a JSON body.
 *
 * Connects with:
 *   - routes/file.routes.js
 * ----------------------------------------------------------------------------
 */

const Joi = require('joi');

const listFilesQuerySchema = Joi.object({
  fileCategory: Joi.string()
    .valid('profile-image', 'resume', 'project-document')
    .optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

module.exports = { listFilesQuerySchema };
