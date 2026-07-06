/**
 * file.routes.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Defines all file-management endpoints. Every route requires
 *   authentication. Upload routes additionally run the category-specific
 *   Multer middleware before the controller.
 *
 * Connects with:
 *   - controllers/file.controller.js for handlers.
 *   - middleware/upload.middleware.js for Multer + validation.
 *   - middleware/auth.middleware.js protects every route here.
 *   - routes/index.js mounts this router (upload routes at /api/upload/*,
 *     file routes at /api/files/*).
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const fileController = require('../controllers/file.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { listFilesQuerySchema } = require('../validators/file.validator');
const {
  uploadProfileImage,
  uploadResume,
  uploadProjectDocument,
} = require('../middleware/upload.middleware');

// Upload endpoints — mounted under /api/upload
router.post('/upload/profile', authenticate, uploadProfileImage, fileController.uploadProfileImage);
router.post('/upload/resume', authenticate, uploadResume, fileController.uploadResume);
router.post('/upload/project', authenticate, uploadProjectDocument, fileController.uploadProjectDocument);

// File management endpoints — mounted under /api/files
router.get('/files', authenticate, validate(listFilesQuerySchema, 'query'), fileController.listFiles);
router.get('/files/:id', authenticate, fileController.getFile);
router.get('/files/:id/download', authenticate, fileController.downloadFile);
router.delete('/files/:id', authenticate, fileController.deleteFile);

module.exports = router;
