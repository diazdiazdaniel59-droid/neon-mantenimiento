'use strict';

// =============================================================================
// NEON :: ms-usuarios - Error HTTP tipado usado por controladores y servicios
// Los errores 4xx se exponen al cliente; los 5xx se enmascaran en el handler.
// =============================================================================

class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message = 'Solicitud invalida', details) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'No autenticado') {
    return new HttpError(401, message);
  }

  static forbidden(message = 'Acceso denegado') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new HttpError(404, message);
  }

  static conflict(message = 'Conflicto con un recurso existente', details) {
    return new HttpError(409, message, details);
  }
}

module.exports = { HttpError };
