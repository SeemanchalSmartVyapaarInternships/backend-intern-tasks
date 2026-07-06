/**
 * file.service.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Orchestrates file operations: uploads the buffer to Cloudinary, then
 *   persists metadata via file.model.js. Also enforces ownership checks
 *   (a non-admin user may only delete/view their own files) and resolves
 *   Cloudinary resource_type (image vs raw) per category.
 *
 * Connects with:
 *   - services/cloudinary.service.js for the actual cloud storage calls.
 *   - models/file.model.js for metadata persistence.
 *   - controllers/file.controller.js is the only caller.
 * ----------------------------------------------------------------------------
 */

const path = require('path');
const ApiError = require('../utils/ApiError');
const fileModel = require('../models/file.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('./cloudinary.service');

// profile-image -> Cloudinary 'image' resource; resumes/docs -> 'raw'
const RESOURCE_TYPE_MAP = {
  'profile-image': 'image',
  resume: 'raw',
  'project-document': 'raw',
};

/**
 * uploadFile
 * @param {object} params
 * @param {number} params.userId
 * @param {'profile-image'|'resume'|'project-document'} params.fileCategory
 * @param {Express.Multer.File} params.file - the Multer memory-storage file object
 */
async function uploadFile({ userId, fileCategory, file }) {
  const { url, publicId, bytes } = await uploadToCloudinary(
    file.buffer,
    fileCategory,
    file.originalname
  );

  const fileType = path.extname(file.originalname).replace('.', '').toLowerCase();

  const fileId = await fileModel.createFile({
    userId,
    fileCategory,
    originalFileName: file.originalname,
    storedFileName: publicId.split('/').pop(),
    fileType,
    mimeType: file.mimetype,
    fileSize: bytes || file.size,
    cloudinaryUrl: url,
    cloudinaryPublicId: publicId,
  });

  return fileModel.findFileById(fileId);
}

/** List files — scoped to the requesting user unless they're an admin. */
async function listUserFiles({ userId, isAdmin, fileCategory, limit, offset }) {
  return fileModel.listFiles({
    userId: isAdmin ? null : userId,
    fileCategory,
    limit,
    offset,
  });
}

/** Get one file, enforcing ownership unless the requester is an admin. */
async function getFileById(id, requestingUserId, isAdmin) {
  const file = await fileModel.findFileById(id);
  if (!file) throw new ApiError(404, 'File not found');
  if (!isAdmin && file.user_id !== requestingUserId) {
    throw new ApiError(403, 'You do not have permission to access this file');
  }
  return file;
}

/** Delete a file: removes it from Cloudinary, then soft-deletes the row. */
async function deleteFile(id, requestingUserId, isAdmin) {
  const file = await getFileById(id, requestingUserId, isAdmin);
  const resourceType = RESOURCE_TYPE_MAP[file.file_category] || 'image';

  await deleteFromCloudinary(file.cloudinary_public_id, resourceType);
  await fileModel.softDeleteFile(id);

  return file;
}

module.exports = { uploadFile, listUserFiles, getFileById, deleteFile };
