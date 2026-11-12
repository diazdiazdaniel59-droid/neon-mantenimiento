'use strict';

// =============================================================================
// NEON :: ms-ordenes - Publicador de eventos a RabbitMQ (amqplib)
// Conexion perezosa y reconexion ante caidas del broker. Declara el exchange
// topic `neon_events` (durable) una unica vez por conexion.
// =============================================================================

const amqp = require('amqplib');
const { config } = require('../config');
const { logger } = require('../utils/logger');

let connection = null;
let channel = null;
let connecting = null;

async function createChannel() {
  const conn = await amqp.connect(config.rabbit.url);

  conn.on('error', (err) => logger.error('Error en la conexion AMQP', { error: err.message }));
  conn.on('close', () => {
    logger.warn('Conexion AMQP cerrada');
    connection = null;
    channel = null;
  });

  const ch = await conn.createChannel();
  ch.on('error', (err) => logger.error('Error en el canal AMQP', { error: err.message }));
  ch.on('close', () => {
    channel = null;
  });

  await ch.assertExchange(config.rabbit.exchange, config.rabbit.exchangeType, { durable: true });

  connection = conn;
  channel = ch;
  logger.info('Conectado a RabbitMQ', { exchange: config.rabbit.exchange });
  return ch;
}

async function ensureChannel() {
  if (channel) return channel;
  if (!connecting) {
    connecting = createChannel().finally(() => {
      connecting = null;
    });
  }
  return connecting;
}

// Publica un evento persistente (JSON) con la routing key indicada.
async function publish(routingKey, payload) {
  const ch = await ensureChannel();
  const buffer = Buffer.from(JSON.stringify(payload));
  ch.publish(config.rabbit.exchange, routingKey, buffer, {
    persistent: true,
    contentType: 'application/json',
    timestamp: Date.now(),
  });
  logger.debug('Evento publicado', { routingKey });
}

function isReady() {
  return Boolean(channel);
}

async function close() {
  try {
    if (channel) await channel.close();
  } catch {
    // canal ya cerrado
  }
  try {
    if (connection) await connection.close();
  } catch {
    // conexion ya cerrada
  }
  channel = null;
  connection = null;
}

module.exports = { publish, isReady, close };
