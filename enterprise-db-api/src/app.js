'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');

const sequelize    = require('./config/sequelize');
const errorHandler = require('./middlewares/errorHandler');
const AppError     = require('./middlewares/AppError');

// Route imports
const roleRoutes       = require('./routes/roleRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const userRoutes       = require('./routes/userRoutes');
const projectRoutes    = require('./routes/projectRoutes');
const taskRoutes       = require('./routes/taskRoutes');

const app = express();

// ─── Security & Utility Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/roles',       roleRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/projects',    projectRoutes);
app.use('/api/tasks',       taskRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Database Connection & Server Start ───────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`📋 Health: http://localhost:${PORT}/health`);
      console.log(`📦 API Base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Unable to connect to database:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
