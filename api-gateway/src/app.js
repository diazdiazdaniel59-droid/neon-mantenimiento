'use strict';

// =============================================================================
// NEON :: api-gateway - Composicion de la aplicacion Express
// =============================================================================

const express = require('express');
const { config } = require('./config');
const { logger } = require('./utils/logger');
const { cors } = require('./middlewares/cors');
const { gate } = require('./middlewares/auth');
const { buildProxy } = require('./proxy');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(cors);

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

  // Healthcheck local del Gateway (consumido por docker-compose).
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: config.serviceName });
  });

  // Verificacion de ruta + JWT en el borde.
  app.use(gate);

  // Proxy unico: enruta a cada microservicio segun el prefijo.
  app.use(buildProxy());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
