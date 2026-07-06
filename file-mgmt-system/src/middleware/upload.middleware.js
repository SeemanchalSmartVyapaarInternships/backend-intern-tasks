/**
 * upload.middleware.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Configures Multer with in-memory storage (so file bytes are available as
 *   a Buffer for streaming straight to Cloudinary — no temp files on disk)
 *   plus per-category file-type and file-size validation.
 *
 * Connects with:
 *   - routes/file.routes.js applies the correct exported middleware
 *     (uploadProfileImage / uploadResume / uploadProjectDocument) per route.
 *   - services/file.service.js consumes req.file.buffer after this runs.
 *
 * Validation strategy:
 *   - fileFilter rejects disallowed MIME types before the file is even
 *     buffered into memory.
 *   - limits.fileSize caps size per category (values from .env), and Multer
 *     itself aborts the upload stream once the limit is exceeded rather than
 *     buffering an oversized file first.
 * ----------------------------------------------------------------------------
 */

const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = {
  'profile-image': ['image/jpeg', 'image/png', 'image/webp'],
  resume: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  'project-document': [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
};

const MAX_SIZE = {
  'profile-image': Number(process.env.MAX_FILE_SIZE_PROFILE_IMAGE) || 2 * 1024 * 1024,
  resume: Number(process.env.MAX_FILE_SIZE_RESUME) || 5 * 1024 * 1024,
  'project-document': Number(process.env.MAX_FILE_SIZE_PROJECT_DOCUMENT) || 10 * 1024 * 1024,
};

/**
 * buildUploader
 * @param {'profile-image'|'resume'|'project-document'} category
 * @returns Express middleware (single-file upload under form field "file")
 */
function buildUploader(category) {
  const uploader = multer({
    storage,
    limits: { fileSize: MAX_SIZE[category] },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME_TYPES[category].includes(file.mimetype)) {
        return cb(
          new ApiError(
            400,
            `Invalid file type for ${category}. Allowed: ${ALLOWED_MIME_TYPES[category].join(', ')}`
          )
        );
      }
      cb(null, true);
    },
  }).single('file');

  // Wrap so Multer's own errors (e.g. LIMIT_FILE_SIZE) become ApiError instances
  // consumable by the central error handler, instead of raw Multer errors.
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ApiError(400, `File exceeds maximum allowed size for ${category}`)
          );
        }
        return next(new ApiError(400, err.message));
      }
      if (err) return next(err);
      if (!req.file) return next(new ApiError(400, 'No file was uploaded'));
      next();
    });
  };
}

module.exports = {
  uploadProfileImage: buildUploader('profile-image'),
  uploadResume: buildUploader('resume'),
  uploadProjectDocument: buildUploader('project-document'),
};
