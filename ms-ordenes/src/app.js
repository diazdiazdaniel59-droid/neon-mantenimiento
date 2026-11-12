'use strict';

// =============================================================================
// NEON :: ms-ordenes - Composicion de la aplicacion Express
// =============================================================================

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { config } = require('./config');
const { pool } = require('./db/pool');
const { logger } = require('./utils/logger');
const ordenesRoutes = require('./routes/ordenes.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const { swaggerSpec } = require('./docs/swagger');

function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(express.json({ limit: '1mb' }));

  // Traza de peticiones (nivel debug).
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.debug('request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Date.now() - start,
      });
    });
    next();
  });

  // Healthcheck: consumido por docker-compose y por el API Gateway.
  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', service: config.serviceName, db: 'up' });
    } catch (err) {
      logger.error('Healthcheck con base de datos no disponible', { error: err.message });
      res.status(503).json({ status: 'degraded', service: config.serviceName, db: 'down' });
    }
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NEON - ms-ordenes API Docs',
  }));

  app.locals.maxPageSize = config.maxPageSize;

  app.use('/ordenes', ordenesRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
