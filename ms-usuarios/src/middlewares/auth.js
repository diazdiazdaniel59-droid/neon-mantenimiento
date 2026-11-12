'use strict';

// =============================================================================
// NEON :: ms-usuarios - Autenticacion (Bearer JWT) y autorizacion por rol
// El servicio valida el token por si mismo (defensa en profundidad), aunque el
// API Gateway tambien lo verifique en el borde.
// =============================================================================

const { HttpError } = require('../utils/httpError');
const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (!token || scheme.toLowerCase() !== 'bearer') {
    return next(HttpError.unauthorized('Token de acceso requerido'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, rol: payload.rol };
    return next();
  } catch {
    return next(HttpError.unauthorized('Token invalido o expirado'));
  }
}

function authorize(...roles) {
  return function authorizeMiddleware(req, res, next) {
    if (!req.user) return next(HttpError.unauthorized());
    if (roles.length && !roles.includes(req.user.rol)) {
      return next(HttpError.forbidden('No tiene permisos suficientes para esta operacion'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
