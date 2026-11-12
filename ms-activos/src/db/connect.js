'use strict';

// =============================================================================
// NEON :: ms-activos - Conexion a MongoDB (Mongoose) con reintentos
// =============================================================================

const mongoose = require('mongoose');
const { config } = require('../config');
const { logger } = require('../utils/logger');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry() {
  const { uri, connectRetries, connectDelayMs } = config.mongo;

  mongoose.connection.on('disconnected', () => logger.warn('MongoDB desconectado'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconectado'));

  for (let attempt = 1; attempt <= connectRetries; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      logger.info('Conexion a MongoDB establecida', { database: mongoose.connection.name });
      return;
    } catch (err) {
      logger.warn('Fallo al conectar a MongoDB, reintentando', { attempt, error: err.message });
      if (attempt === connectRetries) throw err;
      await delay(connectDelayMs);
    }
  }
}

async function disconnect() {
  await mongoose.connection.close();
}

module.exports = { connectWithRetry, disconnect };
