'use strict';

// =============================================================================
// NEON :: api-gateway - Error HTTP tipado para el borde
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

  static badGateway(message = 'Servicio no disponible') {
    return new HttpError(502, message);
  }
}

module.exports = { HttpError };
