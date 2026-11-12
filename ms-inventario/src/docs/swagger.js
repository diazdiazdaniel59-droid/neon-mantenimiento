'use strict';

/**
 * NEON :: ms-inventario - Configuracion Swagger/OpenAPI 3.0
 * Documentacion disponible en GET /api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NEON - ms-inventario API',
      version: '1.0.0',
      description: 'Microservicio de inventario: repuestos, existencias y movimientos (PostgreSQL)',
      contact: {
        name: 'Grupo 8 - Juan Luis De La Espriella & Daniel Díaz',
      },
      license: {
        name: 'Academic',
      },
    },
    servers: [
      {
        url: 'http://localhost:3004',
        description: 'Desarrollo local',
      },
      {
        url: 'http://ms-inventario:3004',
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
        Item: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
            sku: { type: 'string', example: 'REP-001' },
            nombre: { type: 'string', example: 'Filtro de aceite' },
            descripcion: { type: 'string', example: 'Filtro de aceite para motor 2.0L' },
            tipo: { type: 'string', enum: ['repuesto', 'herramienta', 'insumo', 'servicio'], example: 'repuesto' },
            unidad: { type: 'string', enum: ['pieza', 'litro', 'metro', 'kg', 'caja', 'rollo', 'juego'], example: 'pieza' },
            precio_unitario: { type: 'number', format: 'double', example: 15.50 },
            stock_actual: { type: 'integer', example: 10 },
            stock_minimo: { type: 'integer', example: 2 },
            activo: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        ItemInput: {
          type: 'object',
          required: ['sku', 'nombre', 'tipo', 'unidad', 'precio_unitario'],
          properties: {
            sku: { type: 'string', minLength: 1, maxLength: 50, example: 'REP-001' },
            nombre: { type: 'string', minLength: 2, maxLength: 160, example: 'Filtro de aceite' },
            descripcion: { type: 'string', maxLength: 1000 },
            tipo: { type: 'string', enum: ['repuesto', 'herramienta', 'insumo', 'servicio'] },
            unidad: { type: 'string', enum: ['pieza', 'litro', 'metro', 'kg', 'caja', 'rollo', 'juego'] },
            precio_unitario: { type: 'number', minimum: 0, example: 15.50 },
            stock_actual: { type: 'integer', minimum: 0, default: 0 },
            stock_minimo: { type: 'integer', minimum: 0, default: 0 },
          },
        },
        ItemUpdate: {
          type: 'object',
          properties: {
            nombre: { type: 'string', minLength: 2, maxLength: 160 },
            descripcion: { type: 'string', maxLength: 1000 },
            tipo: { type: 'string', enum: ['repuesto', 'herramienta', 'insumo', 'servicio'] },
            unidad: { type: 'string', enum: ['pieza', 'litro', 'metro', 'kg', 'caja', 'rollo', 'juego'] },
            precio_unitario: { type: 'number', minimum: 0 },
            stock_minimo: { type: 'integer', minimum: 0 },
            activo: { type: 'boolean' },
          },
        },
        StockAdjustment: {
          type: 'object',
          required: ['tipo_movimiento', 'cantidad'],
          properties: {
            tipo_movimiento: { type: 'string', enum: ['entrada', 'salida', 'ajuste'], example: 'entrada' },
            cantidad: { type: 'integer', minimum: 1, example: 5 },
            motivo: { type: 'string', maxLength: 200, example: 'Recepcion de proveedor' },
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
              items: { $ref: '#/components/schemas/Item' },
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
      { name: 'Inventario', description: 'Gestion de repuestos, herramientas e insumos' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
