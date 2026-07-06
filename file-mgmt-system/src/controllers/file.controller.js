/**
 * file.controller.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   HTTP layer for all file-management endpoints. Each upload handler is
 *   thin because middleware/upload.middleware.js already validated the
 *   file's type/size and put it on req.file — the controller just calls
 *   services/file.service.js and logs the audit event.
 *
 * Connects with:
 *   - routes/file.routes.js maps endpoints to these handlers, with
 *     upload.middleware.js running first for the three upload routes.
 *   - services/file.service.js for business logic.
 *   - services/audit.service.js for the audit trail.
 * ----------------------------------------------------------------------------
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const fileService = require('../services/file.service');
const { recordAudit } = require('../services/audit.service');
const { getClientIp } = require('../utils/deviceParser');

const CATEGORY_TO_ACTION = {
  'profile-image': 'PROFILE_IMAGE_UPLOAD',
  resume: 'RESUME_UPLOAD',
  'project-document': 'PROJECT_DOCUMENT_UPLOAD',
};

/** Shared handler for the three upload endpoints (category is fixed per-route). */
function makeUploadHandler(fileCategory) {
  return asyncHandler(async (req, res) => {
    const file = await fileService.uploadFile({
      userId: req.user.id,
      fileCategory,
      file: req.file,
    });

    await recordAudit({
      userId: req.user.id,
      action: CATEGORY_TO_ACTION[fileCategory],
      module: 'FILE',
      description: `Uploaded ${fileCategory}: ${file.original_file_name}`,
      httpMethod: req.method,
      endpoint: req.originalUrl,
      ipAddress: getClientIp(req),
      status: 'SUCCESS',
    });

    res.status(201).json(new ApiResponse(201, 'File uploaded successfully', file));
  });
}

/** POST /upload/profile */
const uploadProfileImage = makeUploadHandler('profile-image');
/** POST /upload/resume */
const uploadResume = makeUploadHandler('resume');
/** POST /upload/project */
const uploadProjectDocument = makeUploadHandler('project-document');

/** GET /files (protected — lists own files, or all files if admin) */
const listFiles = asyncHandler(async (req, res) => {
  const { fileCategory, limit, offset } = req.query;
  const isAdmin = req.user.role === 'admin';

  const { rows, total } = await fileService.listUserFiles({
    userId: req.user.id,
    isAdmin,
    fileCategory,
    limit,
    offset,
  });

  res.status(200).json(
    new ApiResponse(200, 'Files fetched successfully', {
      files: rows,
      total,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    })
  );
});

/** GET /files/:id (protected — view a single file's metadata) */
const getFile = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const file = await fileService.getFileById(req.params.id, req.user.id, isAdmin);
  res.status(200).json(new ApiResponse(200, 'File fetched successfully', file));
});

/** GET /files/:id/download (protected — redirects to the Cloudinary URL) */
const downloadFile = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const file = await fileService.getFileById(req.params.id, req.user.id, isAdmin);

  await recordAudit({
    userId: req.user.id,
    action: 'FILE_DOWNLOAD',
    module: 'FILE',
    description: `Downloaded file: ${file.original_file_name}`,
    httpMethod: req.method,
    endpoint: req.originalUrl,
    ipAddress: getClientIp(req),
    status: 'SUCCESS',
  });

  // Cloudinary URLs are already publicly servable over HTTPS, so redirecting
  // is the simplest, most efficient way to hand off the download without
  // proxying the file bytes through our own server.
  res.redirect(file.cloudinary_url);
});

/** DELETE /files/:id (protected) */
const deleteFile = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const file = await fileService.deleteFile(req.params.id, req.user.id, isAdmin);

  await recordAudit({
    userId: req.user.id,
    action: 'FILE_DELETE',
    module: 'FILE',
    description: `Deleted file: ${file.original_file_name}`,
    httpMethod: req.method,
    endpoint: req.originalUrl,
    ipAddress: getClientIp(req),
    status: 'SUCCESS',
  });

  res.status(200).json(new ApiResponse(200, 'File deleted successfully'));
});

module.exports = {
  uploadProfileImage,
  uploadResume,
  uploadProjectDocument,
  listFiles,
  getFile,
  downloadFile,
  deleteFile,
};
