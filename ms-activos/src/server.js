'use strict';

// =============================================================================
// NEON :: ms-activos - Punto de arranque
// =============================================================================

const { config } = require('./config');
const { logger } = require('./utils/logger');
const { connectWithRetry, disconnect } = require('./db/connect');
const { Activo } = require('./models/activo.model');
const { createApp } = require('./app');

async function seedActivos() {
  const count = await Activo.countDocuments();
  if (count > 0) return;

  const equipos = [
    {
      codigo: 'CMP-001',
      nombre: 'Compresor Industrial Atlas Copco GA 37 VSD+',
      tipo: 'maquinaria',
      marca: 'Atlas Copco',
      modelo: 'GA 37 VSD+',
      numero_serie: 'AC-2024-001234',
      ubicacion: 'Planta 1 - Sala de Compresores',
      criticidad: 'alta',
      estado: 'operativo',
      fecha_adquisicion: new Date('2024-01-15'),
      notas: 'Mantenimiento preventivo cada 4000 horas. Filtro de aceite: cada 2000h',
    },
    {
      codigo: 'HVAC-002',
      nombre: 'Enfriadora de Agua Carrier 30XW',
      tipo: 'maquinaria',
      marca: 'Carrier',
      modelo: '30XW 250',
      numero_serie: 'CAR-2023-05678',
      ubicacion: 'Techo Planta 2 - Centro de Datos',
      criticidad: 'alta',
      estado: 'operativo',
      fecha_adquisicion: new Date('2023-11-20'),
      notas: 'Refrigerante R-134a. Revisión trimestral de tuberías y válvulas',
    },
    {
      codigo: 'ELEC-003',
      nombre: 'Transformador Seco 500 kVA Schneider Electric',
      tipo: 'equipo',
      marca: 'Schneider Electric',
      modelo: 'Trihal 500',
      numero_serie: 'SE-2024-009876',
      ubicacion: 'Subestación Eléctrica Principal',
      criticidad: 'alta',
      estado: 'operativo',
      fecha_adquisicion: new Date('2024-03-10'),
      notas: 'Clase F, refrigeración AN. Inspección termográfica anual',
    },
    {
      codigo: 'COMP-004',
      nombre: 'Servidor Rack Dell PowerEdge R760',
      tipo: 'equipo',
      marca: 'Dell',
      modelo: 'PowerEdge R760',
      numero_serie: 'DELL-2024-SRV001',
      ubicacion: 'CPD - Rack 42U Posición 12-14',
      criticidad: 'media',
      estado: 'operativo',
      fecha_adquisicion: new Date('2024-02-28'),
      notas: '2x Intel Xeon Silver 4410Y, 128GB RAM, 2x 960GB SSD RAID1. Garantía ProSupport 5 años',
    },
  ];

  await Activo.insertMany(equipos);
  logger.info('Datos semilla de activos insertados', { count: equipos.length });
}

async function bootstrap() {
  logger.info('Iniciando ms-activos', { env: config.env, port: config.port });

  await connectWithRetry();
  await Activo.init();

  await seedActivos();

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`ms-activos escuchando en el puerto ${config.port}`);
  });

  const shutdown = (signal) => {
    logger.info(`Senal ${signal} recibida: cerrando servidor`);
    server.close(() => {
      disconnect()
        .then(() => logger.info('Cierre completado'))
        .catch((err) => logger.error('Error al cerrar MongoDB', { error: err.message }))
        .finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fallo al iniciar ms-activos', { error: err.message });
  process.exit(1);
});
