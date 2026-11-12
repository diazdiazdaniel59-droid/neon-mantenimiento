'use strict';

// =============================================================================
// NEON :: api-gateway - Configuracion centralizada (12-Factor App)
// Toda la configuracion proviene del entorno. Los valores por defecto son SOLO
// fallbacks de desarrollo local; en produccion deben sobreescribirse.
// =============================================================================

const path = require('path');
const fs = require('fs');

// Carga .env del directorio actual (ejecucion local) y, si existe, el .env del
// raiz del monorepo. No sobreescribe variables ya presentes en el entorno.
// Dentro de Docker la configuracion la inyecta docker-compose (no hay .env).
require('dotenv').config();

const monorepoEnv = path.resolve(__dirname, '..', '..', '..', '.env');
if (fs.existsSync(monorepoEnv)) {
  require('dotenv').config({ path: monorepoEnv });
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function serviceUrl(value, fallback) {
  const raw = (value || fallback).trim().replace(/\/+$/, '');
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  port: toInt(process.env.PORT, 3000),
  serviceName: 'api-gateway',

  jwt: {
    secret: process.env.JWT_SECRET || 'neon_dev_secret_cambiar_en_produccion',
    issuer: process.env.JWT_ISSUER || 'neon',
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',
  proxyTimeout: toInt(process.env.PROXY_TIMEOUT_MS, 15000),

  services: {
    usuarios: serviceUrl(process.env.USERS_SERVICE_URL, 'http://localhost:3001'),
    activos: serviceUrl(process.env.ACTIVOS_SERVICE_URL, 'http://localhost:3002'),
    ordenes: serviceUrl(process.env.ORDENES_SERVICE_URL, 'http://localhost:3003'),
    inventario: serviceUrl(process.env.INVENTARIO_SERVICE_URL, 'http://localhost:3004'),
    notificaciones: serviceUrl(process.env.NOTIFICACIONES_SERVICE_URL, 'http://localhost:3005'),
  },
};

module.exports = { config };
