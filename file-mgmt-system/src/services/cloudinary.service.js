/**
 * cloudinary.service.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Wraps all Cloudinary SDK calls (upload, delete) behind a small promise-
 *   based API. This is the ONLY module that talks to Cloudinary directly —
 *   controllers/services never call the SDK themselves, which keeps the
 *   third-party dependency isolated and swappable.
 *
 * Connects with:
 *   - config/cloudinary.js supplies the configured SDK instance.
 *   - services/file.service.js calls uploadToCloudinary/deleteFromCloudinary.
 *
 * Upload strategy:
 *   Multer is configured (middleware/upload.middleware.js) with memoryStorage,
 *   so `file.buffer` is available in-process. We stream that buffer to
 *   Cloudinary via upload_stream — no temp file is ever written to disk,
 *   which avoids leftover-file cleanup issues and is faster.
 * ----------------------------------------------------------------------------
 */

const cloudinary = require('../config/cloudinary');

const FOLDER_MAP = {
  'profile-image': 'profile-images',
  resume: 'resumes',
  'project-document': 'project-documents',
};

/**
 * uploadToCloudinary
 * @param {Buffer} fileBuffer - raw file bytes from Multer memory storage
 * @param {string} fileCategory - one of 'profile-image' | 'resume' | 'project-document'
 * @param {string} originalFileName - used to build a readable public_id
 * @returns {Promise<{url: string, publicId: string, bytes: number, format: string}>}
 */
function uploadToCloudinary(fileBuffer, fileCategory, originalFileName) {
  const folder = FOLDER_MAP[fileCategory];
  const safeName = originalFileName
    .replace(/\.[^/.]+$/, '') // strip extension
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${safeName}_${Date.now()}`,
        resource_type: 'auto', // handles images + raw docs (pdf/docx) correctly
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

/**
 * deleteFromCloudinary
 * @param {string} publicId - Cloudinary public_id stored on the file row
 * @param {string} resourceType - 'image' | 'raw' (raw for pdf/docx etc.)
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { uploadToCloudinary, deleteFromCloudinary, FOLDER_MAP };
