'use strict';

// =============================================================================
// NEON :: ms-usuarios - Configuracion centralizada (12-Factor App)
// Toda la configuracion proviene del entorno. Los valores por defecto son SOLO
// fallbacks de desarrollo local; en produccion deben sobreescribirse.
// =============================================================================

const path = require('path');
const fs = require('fs');

// Carga .env del directorio actual (ejecucion local) y, si existe, el .env del
// raiz del monorepo. No sobreescribe variables ya presentes en el entorno.
// Dentro de Docker la configuracion la inyecta docker-compose (no hay .env),
// por eso la segunda carga se condiciona a que el archivo exista.
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
  port: toInt(process.env.PORT, 3001),
  serviceName: 'ms-usuarios',
  maxPageSize: toInt(process.env.MAX_PAGE_SIZE, 100),

  db: {
    connectionString: process.env.DATABASE_URL || '',
    host: process.env.PGHOST || 'localhost',
    port: toInt(process.env.PGPORT, 5432),
    database: process.env.PGDATABASE || 'neon_usuarios_db',
    user: process.env.PGUSER || 'neon_usuarios_user',
    password: process.env.PGPASSWORD || 'neon_usuarios_dev_pass',
    ssl: (process.env.PGSSLMODE || '').toLowerCase() === 'require',
    poolMax: toInt(process.env.PG_POOL_MAX, 10),
    idleTimeoutMillis: toInt(process.env.PG_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: toInt(process.env.PG_CONNECT_TIMEOUT_MS, 5000),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'neon_dev_secret_cambiar_en_produccion',
    issuer: process.env.JWT_ISSUER || 'neon',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 10),

  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL || '',
    password: process.env.SEED_ADMIN_PASSWORD || '',
    nombre: process.env.SEED_ADMIN_NOMBRE || 'Administrador NEON',
  },
};

module.exports = { config };
