'use strict';

// =============================================================================
// NEON :: ms-ordenes - Logger estructurado (JSON) con niveles configurables
// =============================================================================

const { config } = require('../config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[config.logLevel] !== undefined ? LEVELS[config.logLevel] : LEVELS.info;

function emit(level, message, meta) {
  if (LEVELS[level] > threshold) return;
  const entry = {
    time: new Date().toISOString(),
    level,
    service: config.serviceName,
    message,
  };
  if (meta !== undefined) entry.meta = meta;
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(`${JSON.stringify(entry)}\n`);
}

const logger = {
  error: (message, meta) => emit('error', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  info: (message, meta) => emit('info', message, meta),
  debug: (message, meta) => emit('debug', message, meta),
};

module.exports = { logger };
