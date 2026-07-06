/**
 * cloudinary.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Configures the Cloudinary SDK once, using credentials from environment
 *   variables. Exported instance is used by services/cloudinary.service.js
 *   to perform uploads/deletes — no other file talks to Cloudinary directly.
 *
 * Connects with:
 *   - services/cloudinary.service.js (the only consumer of this module)
 * ----------------------------------------------------------------------------
 */

const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;
