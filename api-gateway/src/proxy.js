'use strict';

// =============================================================================
// NEON :: api-gateway - Proxy inverso dinamico
// Reenvia peticiones al microservicio destino segun req.proxyRoute (establecido
// por el middleware gate). Los headers (incluido Authorization) se reenvian
// tal cual para que los servicios revaliden el JWT (defensa en profundidad).
// =============================================================================

const { createProxyMiddleware } = require('http-proxy-middleware');
const { config } = require('./config');

function buildProxy() {
  return createProxyMiddleware({
    target: 'http://localhost', // placeholder, overridden by router
    changeOrigin: true,
    timeout: config.proxyTimeout,
    proxyTimeout: config.proxyTimeout,
    router: (req) => req.proxyRoute?.target,
    pathRewrite: (path, req) => {
      const route = req.proxyRoute;
      if (!route) return path;

      let rewrittenPath = path;
      const prefix = route.prefix; // e.g., '/activos', '/ordenes', '/notificaciones'

      // Health endpoints: /{service}/health -> /health
      if (rewrittenPath === `${prefix}/health` || rewrittenPath === `${prefix}/health/`) {
        rewrittenPath = '/health';
      }
      // Swagger UI: /{service}/api-docs -> /api-docs (and subpaths)
      else if (rewrittenPath.startsWith(`${prefix}/api-docs`)) {
        rewrittenPath = rewrittenPath.replace(new RegExp(`^${prefix}/api-docs`), '/api-docs');
      }
      // Notificaciones: /notificaciones -> /notificaciones (ms-notificaciones handles both)
      // No rewrite needed since we added /notificaciones endpoint in ms-notificaciones

      return rewrittenPath;
    },
    on: {
      error: (err, req, res) => {
        const route = req.proxyRoute;
        const serviceName = route?.service || 'desconocido';
        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: { message: `Servicio ${serviceName} no disponible` } }));
        }
      },
    },
  });
}

module.exports = { buildProxy };
