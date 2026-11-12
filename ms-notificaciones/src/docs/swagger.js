'use strict';

/**
 * NEON :: ms-notificaciones - Configuración Swagger/OpenAPI 3.0
 * Documentación disponible en GET /api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NEON - ms-notificaciones API',
      version: '1.0.0',
      description: 'Worker de notificaciones: consume eventos de RabbitMQ y expone historial via HTTP',
      contact: {
        name: 'Grupo 8 - Juan Luis De La Espriella & Daniel Díaz',
      },
      license: {
        name: 'Academic',
      },
    },
    servers: [
      {
        url: 'http://localhost:3005',
        description: 'Desarrollo local',
      },
      {
        url: 'http://ms-notificaciones:3005',
        description: 'Docker interno',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Notificacion: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'notif-1702945200000-abc123' },
            timestamp: { type: 'string', format: 'date-time', example: '2024-12-18T14:20:00.000Z' },
            event: { type: 'string', enum: ['ORDEN_CREADA', 'REPUESTO_ASIGNADO', 'ORDEN_CERRADA', 'desconocido'] },
            routingKey: { type: 'string', example: 'orden.creada' },
            subject: { type: 'string', example: '[NEON] Nueva orden creada: Compresor Industrial' },
            text: { type: 'string', example: 'Se registro una nueva orden de mantenimiento...\n\nOrden: 123...' },
            ordenId: { type: 'string', format: 'uuid' },
            codigoOrden: { type: 'string', example: 'ORD-20241219-0001' },
            activoId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            activoNombre: { type: 'string', example: 'Compresor Industrial Atlas Copco' },
            titulo: { type: 'string', example: 'Ruido anormal en compresor' },
            tipo: { type: 'string', enum: ['CORRECTIVO', 'PREVENTIVO'] },
            prioridad: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'] },
            estado: { type: 'string', enum: ['ABIERTA', 'EN_PROCESO', 'CERRADA'] },
            tecnicoId: { type: 'string', format: 'uuid' },
            tecnicoNombre: { type: 'string', example: 'Juan Técnico' },
            descripcionFalla: { type: 'string' },
            diagnosticoTecnico: { type: 'string' },
            costoRepuestos: { type: 'number', format: 'decimal' },
            fechaCierre: { type: 'string', format: 'date-time' },
            repuestoId: { type: 'string', format: 'uuid' },
            nombreRepuesto: { type: 'string', example: 'Filtro de Aceite' },
            cantidad: { type: 'integer' },
            precioUnitario: { type: 'number', format: 'decimal' },
            subtotal: { type: 'number', format: 'decimal' },
            costoTotalRepuestos: { type: 'number', format: 'decimal' },
          },
        },
        NotificacionesResponse: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/Notificacion' },
            },
            total: { type: 'integer', example: 15 },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'ms-notificaciones' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Notificaciones', description: 'Historial de alertas consumidas de RabbitMQ' },
      { name: 'Health', description: 'Estado del servicio' },
    ],
  },
  apis: ['./src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };