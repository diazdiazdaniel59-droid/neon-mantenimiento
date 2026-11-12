'use strict';

const { Router } = require('express');
const controller = require('../controllers/activos.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// Todas las rutas de activos requieren autenticacion (defensa en profundidad).
router.use(authenticate);

/**
 * @openapi
 * /activos:
 *   get:
 *     summary: Listar activos con paginación y filtros
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [maquinaria, electrico, hvac, computo, otro]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [operativo, en_mantenimiento, fuera_servicio, dado_baja]
 *       - in: query
 *         name: criticidad
 *         schema:
 *           type: string
 *           enum: [baja, media, alta]
 *     responses:
 *       '200':
 *         description: Lista paginada de activos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       '401':
 *         description: Token requerido
 */
router.get('/', asyncHandler(controller.list));

/**
 * @openapi
 * /activos:
 *   post:
 *     summary: Crear nuevo activo (admin, supervisor)
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivoInput'
 *     responses:
 *       '201':
 *         description: Activo creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activo:
 *                   $ref: '#/components/schemas/Activo'
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Solo admin o supervisor
 *       '409':
 *         description: Código duplicado
 */
router.post('/', authorize('admin', 'supervisor'), asyncHandler(controller.create));

/**
 * @openapi
 * /activos/{id}:
 *   get:
 *     summary: Obtener activo por ID
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Activo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activo:
 *                   $ref: '#/components/schemas/Activo'
 *       '401':
 *         description: Token requerido
 *       '404':
 *         description: Activo no encontrado
 */
router.get('/:id', asyncHandler(controller.getOne));

/**
 * @openapi
 * /activos/{id}:
 *   patch:
 *     summary: Actualizar activo (admin, supervisor)
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivoInput'
 *     responses:
 *       '200':
 *         description: Activo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activo:
 *                   $ref: '#/components/schemas/Activo'
 *       '400':
 *         description: Datos inválidos o sin campos
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Solo admin o supervisor
 *       '404':
 *         description: Activo no encontrado
 */
router.patch('/:id', authorize('admin', 'supervisor'), asyncHandler(controller.update));

/**
 * @openapi
 * /activos/{id}:
 *   delete:
 *     summary: Eliminar activo (solo admin)
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Activo eliminado
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Solo admin
 *       '404':
 *         description: Activo no encontrado
 */
router.delete('/:id', authorize('admin'), asyncHandler(controller.remove));

module.exports = router;
