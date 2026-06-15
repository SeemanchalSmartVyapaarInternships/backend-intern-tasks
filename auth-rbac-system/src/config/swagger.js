const swaggerJSDoc = require('swagger-jsdoc');
const config = require('./env');

/**
 * Swagger/OpenAPI configuration.
 * Documentation is generated from JSDoc annotations placed above
 * each route definition in src/routes/*.js.
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Enterprise Authentication & RBAC API',
    version: '1.0.0',
    description:
      'Production-ready Authentication & Role-Based Access Control (RBAC) system built with Node.js, Express, MongoDB, and JWT.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}${config.apiPrefix}`,
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c2e8f1b2c3d4e5f6789' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane.doe@example.com' },
          role: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'],
            example: 'EMPLOYEE',
          },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'integer' },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
