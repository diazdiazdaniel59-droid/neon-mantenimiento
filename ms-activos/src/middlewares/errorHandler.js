'use strict';

// =============================================================================
// NEON :: ms-activos - Middlewares de cierre: 404 y manejo central de errores
// Traduce los errores de Mongoose a respuestas HTTP coherentes.
// =============================================================================

const { logger } = require('../utils/logger');
const { HttpError } = require('../utils/httpError');

function notFoundHandler(req, res) {
  res.status(404).json({
    error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` },
  });
}

function normalize(err) {
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return HttpError.badRequest('Datos invalidos', details);
  }
  if (err.name === 'CastError') {
    return HttpError.badRequest(`El campo '${err.path}' es invalido`);
  }
  if (err.code === 11000) {
    return HttpError.conflict('Ya existe un activo con ese codigo', [{ field: 'codigo' }]);
  }
  return err;
}

// Express exige 4 argumentos para reconocerlo como manejador de errores.
// eslint-disable-next-line no-unused-vars
function errorHandler(rawErr, req, res, next) {
  const err = normalize(rawErr);
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
