'use strict';

// =============================================================================
// NEON :: ms-inventario - Middlewares de cierre: 404 y manejo central de errores
// Traduce los errores de PostgreSQL a respuestas HTTP coherentes.
// =============================================================================

const { logger } = require('../utils/logger');
const { HttpError } = require('../utils/httpError');

function notFoundHandler(req, res) {
  res.status(404).json({
    error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` },
  });
}

function normalize(err) {
  if (err.code === '23505') {
    return HttpError.conflict('Ya existe un registro con esos datos', [{ field: 'unique' }]);
  }
  if (err.code === '23514') {
    return HttpError.badRequest('Uno de los valores no cumple las restricciones permitidas');
  }
  if (err.code === '23503') {
    return HttpError.badRequest('La referencia indicada no existe');
  }
  if (err.code === '22P02') {
    return HttpError.badRequest('Formato de dato invalido');
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
