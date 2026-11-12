'use strict';

/**
 * NEON :: ms-usuarios - Configuración Swagger/OpenAPI 3.0
 * Documentación disponible en GET /api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NEON - ms-usuarios API',
      version: '1.0.0',
      description: 'Microservicio de autenticación y gestión de usuarios (JWT + PostgreSQL)',
      contact: {
        name: 'Grupo 8 - Juan Luis De La Espriella & Daniel Díaz',
      },
      license: {
        name: 'Academic',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Desarrollo local',
      },
      {
        url: 'http://ms-usuarios:3001',
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
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
            nombre: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@neon.local' },
            rol: { type: 'string', enum: ['admin', 'supervisor', 'tecnico'], example: 'tecnico' },
            activo: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        UsuarioInput: {
          type: 'object',
          required: ['nombre', 'email', 'password'],
          properties: {
            nombre: { type: 'string', minLength: 2, maxLength: 120 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8, maxLength: 100 },
            rol: { type: 'string', enum: ['admin', 'supervisor', 'tecnico'], default: 'tecnico' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            tokenType: { type: 'string', example: 'Bearer' },
            usuario: { $ref: '#/components/schemas/Usuario' },
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
              items: { $ref: '#/components/schemas/Usuario' },
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
      { name: 'Auth', description: 'Autenticación y registro' },
      { name: 'Usuarios', description: 'Gestión de usuarios' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };