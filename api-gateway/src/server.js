'use strict';

// =============================================================================
// NEON :: api-gateway - Punto de arranque
// =============================================================================

const { config } = require('./config');
const { logger } = require('./utils/logger');
const { createApp } = require('./app');

function bootstrap() {
  logger.info('Iniciando api-gateway', { env: config.env, port: config.port });

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`api-gateway escuchando en el puerto ${config.port}`);
    logger.info('Rutas: /auth,/usuarios -> usuarios | /activos | /ordenes | /inventario');
  });

  const shutdown = (signal) => {
    logger.info(`Senal ${signal} recibida: cerrando servidor`);
    server.close(() => {
      logger.info('Cierre completado');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
