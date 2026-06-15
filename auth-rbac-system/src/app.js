const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const requestLogger = require('./middleware/logger.middleware');
const { generalLimiter } = require('./middleware/rateLimiter.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------
app.use(helmet()); // sets secure HTTP headers
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true, // allow cookies to be sent cross-origin
  })
);

// ---------------------------------------------------------------------------
// Body parsing & sanitization
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '10kb' })); // limit body size to mitigate DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . from req.body/query/params (NoSQL injection protection)
app.use(xss()); // sanitizes user input from malicious HTML/JS (XSS protection)

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
app.use(requestLogger);

// ---------------------------------------------------------------------------
// Rate limiting (applied to all /api routes)
// ---------------------------------------------------------------------------
app.use(config.apiPrefix, generalLimiter);

// ---------------------------------------------------------------------------
// API documentation (Swagger UI)
// ---------------------------------------------------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use(config.apiPrefix, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Enterprise Authentication & RBAC API',
    docs: '/api-docs',
    health: `${config.apiPrefix}/health`,
  });
});

// ---------------------------------------------------------------------------
// Error handling (must be last)
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
