'use strict';

// =============================================================================
// NEON :: ms-inventario - Pool de conexiones PostgreSQL
// =============================================================================

const { Pool } = require('pg');
const { config } = require('../config');
const { logger } = require('../utils/logger');

const connection = config.db.connectionString
  ? { connectionString: config.db.connectionString }
  : {
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
    };

const pool = new Pool({
  ...connection,
  ...(config.db.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  max: config.db.poolMax,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  logger.error('Error inesperado en el pool de PostgreSQL', { error: err.message });
});

module.exports = { pool };
