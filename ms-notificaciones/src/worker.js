'use strict';

// =============================================================================
// NEON :: ms-notificaciones - Punto de arranque del worker
// No expone HTTP: consume la cola de eventos de ordenes de forma continua.
// =============================================================================

const { config } = require('./config');
const { logger } = require('./utils/logger');
const consumer = require('./broker/consumer');

async function bootstrap() {
  logger.info('Iniciando ms-notificaciones (worker)', {
    env: config.env,
    transport: config.smtp.enabled ? 'smtp' : 'console',
  });

  await consumer.start();

  const shutdown = async (signal) => {
    logger.info(`Senal ${signal} recibida: deteniendo consumidor`);
    // Red de seguridad: si el cierre se cuelga, forzar la salida.
    setTimeout(() => process.exit(1), 10000).unref();
    await consumer.stop();
    logger.info('Cierre completado');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fallo al iniciar ms-notificaciones', { error: err.message });
  process.exit(1);
});
