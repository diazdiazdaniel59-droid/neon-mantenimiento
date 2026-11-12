'use strict';

// =============================================================================
// NEON :: ms-notificaciones - Configuracion centralizada (12-Factor App)
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
  serviceName: 'ms-notificaciones',
  port: toInt(process.env.PORT, 3005),

  rabbit: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'neon_events',
    exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || 'topic',
    queue: process.env.NOTIF_QUEUE || 'neon_notificaciones_queue',
    routingKey: process.env.NOTIF_ROUTING_KEY || 'orden.#',
    prefetch: toInt(process.env.NOTIF_PREFETCH, 1),
    reconnectMs: toInt(process.env.NOTIF_RECONNECT_MS, 5000),
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: toInt(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'neon@localhost',
    to: process.env.NOTIF_TO_EMAIL || process.env.SMTP_FROM || 'neon@localhost',
  },
};

// Sin SMTP_HOST configurado, el worker usa el transporte de consola.
config.smtp.enabled = config.smtp.host !== '';

module.exports = { config };
