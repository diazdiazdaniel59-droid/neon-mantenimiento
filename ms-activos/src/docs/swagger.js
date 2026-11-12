'use strict';

/**
 * NEON :: ms-activos - Configuración Swagger/OpenAPI 3.0
 * Documentación disponible en GET /api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NEON - ms-activos API',
      version: '1.0.0',
      description: 'Microservicio de catálogo de activos/equipos industriales (MongoDB + Mongoose)',
      contact: {
        name: 'Grupo 8 - Juan Luis De La Espriella & Daniel Díaz',
      },
      license: {
        name: 'Academic',
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Desarrollo local',
      },
      {
        url: 'http://ms-activos:3002',
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
        Activo: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            codigo: { type: 'string', example: 'EQP-001' },
            nombre: { type: 'string', example: 'Compresor Industrial Atlas Copco' },
            tipo: { type: 'string', enum: ['maquinaria', 'electrico', 'hvac', 'computo', 'otro'], example: 'maquinaria' },
            marca: { type: 'string', example: 'Atlas Copco' },
            modelo: { type: 'string', example: 'GA 37 VSD+' },
            numero_serie: { type: 'string', example: 'AC-2024-001234' },
            ubicacion: { type: 'string', example: 'Planta 1 - Sala de Compresores' },
            criticidad: { type: 'string', enum: ['baja', 'media', 'alta'], example: 'alta' },
            estado: { type: 'string', enum: ['operativo', 'en_mantenimiento', 'fuera_servicio', 'dado_baja'], example: 'operativo' },
            fecha_adquisicion: { type: 'string', format: 'date', example: '2024-01-15' },
            notas: { type: 'string', example: 'Mantenimiento preventivo cada 4000 horas' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ActivoInput: {
          type: 'object',
          required: ['codigo', 'nombre'],
          properties: {
            codigo: { type: 'string', minLength: 2, maxLength: 60 },
            nombre: { type: 'string', minLength: 2, maxLength: 160 },
            marca: { type: 'string', maxLength: 80 },
            modelo: { type: 'string', maxLength: 80 },
            numero_serie: { type: 'string', maxLength: 80 },
            ubicacion: { type: 'string', maxLength: 160 },
            tipo: { type: 'string', enum: ['maquinaria', 'electrico', 'hvac', 'computo', 'otro'], default: 'equipo' },
            criticidad: { type: 'string', enum: ['baja', 'media', 'alta'], default: 'media' },
            estado: { type: 'string', enum: ['operativo', 'en_mantenimiento', 'fuera_servicio', 'dado_baja'], default: 'operativo' },
            fecha_adquisicion: { type: 'string', format: 'date' },
            notas: { type: 'string', maxLength: 1000 },
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
              items: { $ref: '#/components/schemas/Activo' },
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
      { name: 'Activos', description: 'Catálogo de activos/equipos industriales' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };