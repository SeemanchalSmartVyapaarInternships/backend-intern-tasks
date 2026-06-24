'use strict';

/**
 * Sends a consistent success envelope for every API response.
 *
 * @param {object} res        - Express response object
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message    - Human-readable message
 * @param {*}      data       - Payload (object, array, or null)
 * @param {object} meta       - Optional pagination / extra metadata
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess };
