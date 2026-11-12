'use strict';

// =============================================================================
// NEON :: ms-notificaciones - Punto de arranque
// Inicia el consumidor RabbitMQ y el servidor HTTP (puerto 3005).
// =============================================================================

const { config } = require('./config');
const { logger } = require('./utils/logger');
const consumer = require('./broker/consumer');
const { createApp } = require('./app');

async function bootstrap() {
  logger.info('Iniciando ms-notificaciones', { env: config.env, port: config.port });

  // Iniciar consumidor RabbitMQ (no bloquea si el broker no está listo)
  consumer.start().catch((err) => {
    logger.error('Error al iniciar consumidor RabbitMQ', { error: err.message });
  });

  // Iniciar servidor HTTP
  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`ms-notificaciones HTTP escuchando en el puerto ${config.port}`);
  });

  const shutdown = (signal) => {
    logger.info(`Senal ${signal} recibida: cerrando servidor`);
    server.close(() => {
      consumer.stop()
        .then(() => logger.info('Cierre completado'))
        .catch((err) => logger.error('Error al cerrar consumidor', { error: err.message }))
        .finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fallo al iniciar ms-notificaciones', { error: err.message });
  process.exit(1);
});