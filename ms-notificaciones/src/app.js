'use strict';

// =============================================================================
// NEON :: ms-notificaciones - Composición de la aplicación Express
// Expone GET /api/notificaciones (historial últimas 50) y GET /health
// =============================================================================

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { config } = require('./config');
const { logger } = require('./utils/logger');
const { getAll } = require('./notifications/store');
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

  // Healthcheck: usado por docker-compose y API Gateway
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: config.serviceName });
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NEON - ms-notificaciones API Docs',
  }));

  // Endpoint para historial de notificaciones (campana en frontend)
  // Expone tanto /api/notificaciones (nativo) como /notificaciones (via API Gateway sin path rewrite)
  const notificacionesHandler = (req, res) => {
    const items = getAll();
    res.json({ items, total: items.length });
  };
  app.get('/api/notificaciones', notificacionesHandler);
  app.get('/notificaciones', notificacionesHandler);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };