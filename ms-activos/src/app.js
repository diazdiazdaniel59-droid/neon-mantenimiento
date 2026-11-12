'use strict';

// =============================================================================
// NEON :: ms-activos - Composicion de la aplicacion Express
// =============================================================================

const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const { config } = require('./config');
const { logger } = require('./utils/logger');
const activosRoutes = require('./routes/activos.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const { swaggerSpec } = require('./docs/swagger');

function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(express.json({ limit: '1mb' }));

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

  // Healthcheck: MongoDB disponible cuando readyState === 1 (connected).
  app.get('/health', (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
      status: connected ? 'ok' : 'degraded',
      service: config.serviceName,
      db: connected ? 'up' : 'down',
    });
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NEON - ms-activos API Docs',
  }));

  app.use('/activos', activosRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
