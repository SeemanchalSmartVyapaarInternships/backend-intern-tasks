/**
 * file.model.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Data-access layer for the `files` table (uploaded profile images,
 *   resumes, project documents). Deletion is a soft delete (is_deleted flag)
 *   so file-upload-history reporting can still see historical uploads.
 *
 * Connects with:
 *   - services/file.service.js is the only caller.
 * ----------------------------------------------------------------------------
 */

const { pool } = require('../config/db');

/** Insert a new file metadata row after a successful Cloudinary upload. */
async function createFile({
  userId,
  fileCategory,
  originalFileName,
  storedFileName,
  fileType,
  mimeType,
  fileSize,
  cloudinaryUrl,
  cloudinaryPublicId,
}) {
  const [result] = await pool.query(
    `INSERT INTO files
      (user_id, file_category, original_file_name, stored_file_name, file_type,
       mime_type, file_size, cloudinary_url, cloudinary_public_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId, fileCategory, originalFileName, storedFileName, fileType,
      mimeType, fileSize, cloudinaryUrl, cloudinaryPublicId,
    ]
  );
  return result.insertId;
}

/** Fetch a single non-deleted file by id. */
async function findFileById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM files WHERE id = ? AND is_deleted = 0 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * List a user's files, optionally filtered by category, paginated.
 * Admins (handled at the service layer) may pass userId = null to see all.
 */
async function listFiles({ userId, fileCategory, limit = 20, offset = 0 }) {
  const conditions = ['is_deleted = 0'];
  const params = [];

  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }
  if (fileCategory) {
    conditions.push('file_category = ?');
    params.push(fileCategory);
  }

  const whereClause = conditions.join(' AND ');

  const [rows] = await pool.query(
    `SELECT * FROM files WHERE ${whereClause}
     ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM files WHERE ${whereClause}`,
    params
  );

  return { rows, total: countRows[0].total };
}

/** Soft-delete a file row. */
async function softDeleteFile(id) {
  await pool.query(`UPDATE files SET is_deleted = 1 WHERE id = ?`, [id]);
}

module.exports = { createFile, findFileById, listFiles, softDeleteFile };
