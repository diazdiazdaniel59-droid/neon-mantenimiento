'use strict';

// =============================================================================
// NEON :: ms-activos - Configuracion centralizada (12-Factor App)
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
  port: toInt(process.env.PORT, 3002),
  serviceName: 'ms-activos',
  maxPageSize: toInt(process.env.MAX_PAGE_SIZE, 100),

  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/neon_activos_db',
    connectRetries: toInt(process.env.MONGO_CONNECT_RETRIES, 10),
    connectDelayMs: toInt(process.env.MONGO_CONNECT_DELAY_MS, 3000),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'neon_dev_secret_cambiar_en_produccion',
    issuer: process.env.JWT_ISSUER || 'neon',
  },
};

module.exports = { config };
