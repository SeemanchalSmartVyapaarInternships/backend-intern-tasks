const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Exits the process if the initial connection fails, since the
 * application cannot function without a database connection.
 */
const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(config.mongo.uri, {
      autoIndex: !config.isProduction,
    });

    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });
};

module.exports = connectDB;
