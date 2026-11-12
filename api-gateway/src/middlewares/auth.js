'use strict';

// =============================================================================
// NEON :: api-gateway - Barrera del borde: valida la ruta y, si no es publica,
// exige un JWT valido (defensa en profundidad; los servicios revalidan).
// =============================================================================

const { config } = require('../config');
const { HttpError } = require('../utils/httpError');
const { verifyToken } = require('../utils/jwt');
const { resolveRoute } = require('../routing');
const { logger } = require('../utils/logger');

// Extrae y valida el Bearer token; devuelve el usuario o null.
function extractUser(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  try {
    const payload = verifyToken(token);
    return { id: payload.sub, email: payload.email, rol: payload.rol };
  } catch {
    return null;
  }
}

function gate(req, res, next) {
  if (req.method === 'OPTIONS') return next();

  // Strip /api prefix if present (API gateway base path)
  const path = req.path.startsWith('/api/') ? req.path.slice(4) : req.path;

  logger.info('gate middleware', { originalPath: req.path, strippedPath: path, originalUrl: req.originalUrl });

  const route = resolveRoute(path, config.services);
  if (!route) {
    logger.info('Route not found', { path, services: Object.keys(config.services) });
    return next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
  }

  logger.info('Route resolved', { route });

  req.proxyRoute = route;

  if (route.public) {
    logger.info('Route is public, allowing');
    return next();
  }

  const user = extractUser(req);
  if (!user) return next(HttpError.unauthorized('Token de acceso requerido'));
  req.user = user;
  return next();
}

module.exports = { gate, extractUser };
