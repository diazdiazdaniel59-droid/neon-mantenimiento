'use strict';

// =============================================================================
// NEON :: api-gateway - Middlewares de cierre: 404 y manejo central de errores
// =============================================================================

const { logger } = require('../utils/logger');

function notFoundHandler(req, res) {
  res.status(404).json({
    error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` },
  });
}

// Express exige 4 argumentos para reconocerlo como manejador de errores.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const isServerError = status >= 500;

  if (isServerError) {
    logger.error(err.message, { stack: err.stack, path: req.originalUrl, method: req.method });
  } else {
    logger.warn(err.message, { status, path: req.originalUrl, method: req.method });
  }

  const body = { error: { message: isServerError ? 'Error interno del servidor' : err.message } };
  if (err.details) body.error.details = err.details;

  res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
