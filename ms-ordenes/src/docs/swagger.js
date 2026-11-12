'use strict';

/**
 * NEON :: ms-ordenes - Configuracion Swagger/OpenAPI 3.0
 * Documentacion disponible en GET /api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NEON - ms-ordenes API',
      version: '1.0.0',
      description: 'Microservicio de ordenes de mantenimiento (PostgreSQL + RabbitMQ)',
      contact: {
        name: 'Grupo 8 - Juan Luis De La Espriella & Daniel Díaz',
      },
      license: {
        name: 'Academic',
      },
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Desarrollo local',
      },
      {
        url: 'http://ms-ordenes:3003',
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
        Orden: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
            cliente_id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
            tipo: { type: 'string', enum: ['preventivo', 'correctivo', 'predictivo', 'mejora'], example: 'correctivo' },
            prioridad: { type: 'string', enum: ['baja', 'media', 'alta', 'urgente'], example: 'alta' },
            estado: { type: 'string', enum: ['abierta', 'en_proceso', 'en_espera', 'cerrada', 'cancelada'], example: 'abierta' },
            descripcion: { type: 'string', example: 'Fuga de agua en el baño principal' },
            tecnico_id: { type: 'string', format: 'uuid', nullable: true, example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' },
            fecha_solicitud: { type: 'string', format: 'date-time' },
            fecha_cierre: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        OrdenInput: {
          type: 'object',
          required: ['tipo', 'descripcion'],
          properties: {
            tipo: { type: 'string', enum: ['preventivo', 'correctivo', 'predictivo', 'mejora'], example: 'correctivo' },
            prioridad: { type: 'string', enum: ['baja', 'media', 'alta', 'urgente'], default: 'media' },
            descripcion: { type: 'string', minLength: 10, maxLength: 2000, example: 'Fuga de agua en el baño principal' },
            tecnico_id: { type: 'string', format: 'uuid' },
          },
        },
        OrdenUpdate: {
          type: 'object',
          properties: {
            tipo: { type: 'string', enum: ['preventivo', 'correctivo', 'predictivo', 'mejora'] },
            prioridad: { type: 'string', enum: ['baja', 'media', 'alta', 'urgente'] },
            estado: { type: 'string', enum: ['abierta', 'en_proceso', 'en_espera', 'cerrada', 'cancelada'] },
            descripcion: { type: 'string', minLength: 10, maxLength: 2000 },
            tecnico_id: { type: 'string', format: 'uuid' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/Orden' },
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Ordenes', description: 'Gestion de ordenes de mantenimiento' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
