'use strict';

// =============================================================================
// NEON :: api-gateway - Resolucion de rutas a microservicios
// Mapea prefijos de ruta a la URL base de cada microservicio.
// Rutas publicas (sin JWT): registro y login de auth.
// =============================================================================

const PUBLIC_AUTH_ROUTES = ['/auth/register', '/auth/login'];
const PUBLIC_SUFFIXES = ['/health', '/api-docs'];

const ROUTE_MAP = [
  { prefix: '/auth', service: 'usuarios', public: PUBLIC_AUTH_ROUTES },
  { prefix: '/usuarios', service: 'usuarios' },
  { prefix: '/ordenes', service: 'ordenes' },
  { prefix: '/inventario', service: 'inventario' },
  { prefix: '/activos', service: 'activos' },
  { prefix: '/notificaciones', service: 'notificaciones' },
];

function resolveRoute(path, services) {
  // Normaliza barras finales (/activos/ -> /activos) antes de comparar.
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;

  // path ya viene con el prefijo /api/ removido por el middleware gate
  for (const route of ROUTE_MAP) {
    const matches =
      normalized === route.prefix || normalized.startsWith(route.prefix + '/');
    if (matches) {
      const isPublicAuth = Boolean(route.public && route.public.includes(normalized));
      const isPublicSuffix = PUBLIC_SUFFIXES.some(
        (suffix) =>
          normalized === `${route.prefix}${suffix}` ||
          normalized.startsWith(`${route.prefix}${suffix}/`)
      );
      return {
        service: route.service,
        target: services[route.service],
        public: isPublicAuth || isPublicSuffix,
        path: normalized,
        prefix: route.prefix, // para path rewrite en proxy
      };
    }
  }
  return null;
}

module.exports = { resolveRoute, PUBLIC_AUTH_ROUTES };
