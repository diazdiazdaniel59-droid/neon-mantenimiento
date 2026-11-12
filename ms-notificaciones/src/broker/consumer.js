'use strict';

// =============================================================================
// NEON :: ms-notificaciones - Consumidor de eventos (RabbitMQ / amqplib)
// Declara el exchange, una cola durable ligada con el patron configurado y
// procesa cada evento. Ante caidas del broker se reconecta con reintentos.
// Guarda las notificaciones en memoria para exposición vía HTTP.
// =============================================================================

const amqp = require('amqplib');
const { config } = require('../config');
const { logger } = require('../utils/logger');
const { buildNotification } = require('../notifications/templates');
const mailer = require('../notifications/mailer');
const { add } = require('../notifications/store');

let connection = null;
let channel = null;
let reconnectTimer = null;
let stopping = false;

async function handleMessage(msg) {
  if (!msg) return;
  const routingKey = msg.fields && msg.fields.routingKey;

  try {
    const event = JSON.parse(msg.content.toString());
    const notification = buildNotification(event);

    // Guardar en memoria para el endpoint HTTP
    const stored = add({ event: event.event, routingKey, ...notification });
    logger.debug('Notificación almacenada en memoria', { id: stored.id });

    await mailer.notify(notification);
    channel.ack(msg);
  } catch (err) {
    // Mensaje invalido o fallo al notificar: se descarta (sin requeue) para
    // evitar bucles de envenenamiento; queda registrado en el log.
    logger.error('Fallo al procesar el mensaje', { error: err.message, routingKey });
    channel.nack(msg, false, false);
  }
}

function scheduleReconnect() {
  if (stopping || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWithRetry();
  }, config.rabbit.reconnectMs);
}

async function connectWithRetry() {
  try {
    connection = await amqp.connect(config.rabbit.url);
    connection.on('error', (err) => logger.error('Error en la conexion AMQP', { error: err.message }));
    connection.on('close', () => {
      channel = null;
      connection = null;
      if (!stopping) {
        logger.warn('Conexion AMQP cerrada: se intentara reconectar');
        scheduleReconnect();
      }
    });

    channel = await connection.createChannel();
    await channel.assertExchange(config.rabbit.exchange, config.rabbit.exchangeType, {
      durable: true,
    });
    await channel.assertQueue(config.rabbit.queue, { durable: true });
    await channel.bindQueue(config.rabbit.queue, config.rabbit.exchange, config.rabbit.routingKey);
    await channel.prefetch(config.rabbit.prefetch);
    await channel.consume(config.rabbit.queue, (msg) => handleMessage(msg));

    logger.info('Consumidor de eventos iniciado', {
      exchange: config.rabbit.exchange,
      queue: config.rabbit.queue,
      routingKey: config.rabbit.routingKey,
      transport: config.smtp.enabled ? 'smtp' : 'console',
    });
  } catch (err) {
    logger.error('No se pudo conectar al broker: reintentando', {
      error: err.message,
      retryMs: config.rabbit.reconnectMs,
    });
    scheduleReconnect();
  }
}

async function start() {
  stopping = false;
  await connectWithRetry();
}

async function stop() {
  stopping = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  try {
    if (channel) await channel.close();
  } catch (err) {
    logger.debug('Error al cerrar el canal', { error: err.message });
  }
  try {
    if (connection) await connection.close();
  } catch (err) {
    logger.debug('Error al cerrar la conexion', { error: err.message });
  }
}

module.exports = { start, stop };
