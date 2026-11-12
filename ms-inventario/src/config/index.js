'use strict';

// =============================================================================
// NEON :: ms-inventario - Configuracion centralizada (12-Factor App)
// =============================================================================

const path = require('path');
const fs = require('fs');

require('dotenv').config();

const monorepoEnv = path.resolve(__dirname, '..', '..', '..', '.env');
if (fs.existsSync(monorepoEnv)) {
  require('dotenv').config({ path: monorepoEnv });
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  port: toInt(process.env.PORT, 3004),
  serviceName: 'ms-inventario',
  maxPageSize: toInt(process.env.MAX_PAGE_SIZE, 100),

  db: {
    connectionString: process.env.DATABASE_URL || '',
    host: process.env.PGHOST || 'localhost',
    port: toInt(process.env.PGPORT, 5432),
    database: process.env.PGDATABASE || 'neon_inventario_db',
    user: process.env.PGUSER || 'neon_inventario_user',
    password: process.env.PGPASSWORD || 'neon_inventario_dev_pass',
    ssl: (process.env.PGSSLMODE || '').toLowerCase() === 'require',
    poolMax: toInt(process.env.PG_POOL_MAX, 10),
    idleTimeoutMillis: toInt(process.env.PG_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: toInt(process.env.PG_CONNECT_TIMEOUT_MS, 5000),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'neon_dev_secret_cambiar_en_produccion',
    issuer: process.env.JWT_ISSUER || 'neon',
  },
};

module.exports = { config };
