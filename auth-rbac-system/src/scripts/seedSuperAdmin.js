/**
 * Seed script: creates the initial SUPER_ADMIN account if one does
 * not already exist. Run with:
 *
 *   node src/scripts/seedSuperAdmin.js
 */
const connectDB = require('../config/db');
const config = require('../config/env');
const User = require('../models/User.model');
const { ROLES } = require('../config/roles');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ role: ROLES.SUPER_ADMIN });

  if (existing) {
    logger.info(`SUPER_ADMIN already exists: ${existing.email}`);
  } else {
    const superAdmin = await User.create({
      name: config.superAdmin.name,
      email: config.superAdmin.email,
      password: config.superAdmin.password,
      role: ROLES.SUPER_ADMIN,
      isActive: true,
    });
    logger.info(`SUPER_ADMIN created: ${superAdmin.email}`);
    logger.warn('Please log in and change the default SUPER_ADMIN password immediately.');
  }

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`);
  process.exit(1);
});
