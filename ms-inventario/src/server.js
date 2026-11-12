'use strict';

// =============================================================================
// NEON :: ms-inventario - Punto de arranque
// Verifica conexion, asegura el esquema, levanta el HTTP y gestiona el cierre.
// =============================================================================

const { config } = require('./config');
const { logger } = require('./utils/logger');
const { pool } = require('./db/pool');
const { ensureSchema } = require('./db/init');
const { createApp } = require('./app');

async function bootstrap() {
  logger.info('Iniciando ms-inventario', { env: config.env, port: config.port });

  await pool.query('SELECT 1');
  logger.info('Conexion a PostgreSQL establecida', { database: config.db.database });

  await ensureSchema();

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`ms-inventario escuchando en el puerto ${config.port}`);
  });

  const shutdown = (signal) => {
    logger.info(`Senal ${signal} recibida: cerrando servidor`);
    server.close(() => {
      pool
        .end()
        .then(() => logger.info('Cierre completado'))
        .catch((err) => logger.error('Error durante el cierre', { error: err.message }))
        .finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fallo al iniciar ms-inventario', { error: err.message });
  process.exit(1);
});
