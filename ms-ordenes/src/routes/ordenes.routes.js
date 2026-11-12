'use strict';

const { Router } = require('express');
const controller = require('../controllers/ordenes.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// Todas las rutas requieren autenticacion
router.use(authenticate);

// POST /ordenes/:id/repuestos - Registrar consumo de repuesto (tecnico asignado, admin, supervisor)
router.post('/:id/repuestos', authorize('admin', 'supervisor', 'tecnico'), asyncHandler(controller.agregarRepuesto));

// GET /ordenes/:id/repuestos - Listar repuestos consumidos (quien puede ver la orden)
router.get('/:id/repuestos', asyncHandler(controller.listarRepuestos));

/**
 * @openapi
 * /ordenes:
 *   post:
 *     summary: Crear una orden de mantenimiento
 *     tags: [Ordenes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, descripcion]
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [preventivo, correctivo, predictivo, mejora]
 *               prioridad:
 *                 type: string
 *                 enum: [baja, media, alta, urgente]
 *               descripcion:
 *                 type: string
 *               tecnico_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       '201':
 *         description: Orden creada
 *       '400':
 *         description: Datos invalidos
 *       '401':
 *         description: Token requerido
 */
router.post('/', authenticate, asyncHandler(controller.create));

/**
 * @openapi
 * /ordenes:
 *   get:
 *     summary: Listar ordenes con paginacion y filtros (admin, supervisor)
 *     tags: [Ordenes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista paginada de ordenes
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 */
router.get('/', authorize('admin', 'supervisor'), asyncHandler(controller.list));

/**
 * @openapi
 * /ordenes/mis-ordenes:
 *   get:
 *     summary: Listar mis propias ordenes (cliente, tecnico, admin, supervisor)
 *     tags: [Ordenes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de ordenes del usuario autenticado
 *       '401':
 *         description: Token requerido
 */
router.get('/mis-ordenes', asyncHandler(controller.misOrdenes));

/**
 * @openapi
 * /ordenes/{id}:
 *   get:
 *     summary: Obtener orden por ID
 *     tags: [Ordenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Orden encontrada
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '404':
 *         description: Orden no encontrada
 */
router.get('/:id', asyncHandler(controller.getOne));

/**
 * @openapi
 * /ordenes/{id}:
 *   patch:
 *     summary: Actualizar orden (admin/supervisor cualquier campo, tecnico asignada, cliente cancelar propia)
 *     tags: [Ordenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo: { type: string, enum: [preventivo, correctivo, predictivo, mejora] }
 *               prioridad: { type: string, enum: [baja, media, alta, urgente] }
 *               estado: { type: string, enum: [abierta, en_proceso, en_espera, cerrada, cancelada] }
 *               descripcion: { type: string }
 *               tecnico_id: { type: string, format: uuid }
 *     responses:
 *       '200':
 *         description: Orden actualizada
 *       '400':
 *         description: Datos invalidos
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '404':
 *         description: Orden no encontrada
 */
router.patch('/:id', asyncHandler(controller.update));

/**
 * @openapi
 * /ordenes/{id}:
 *   delete:
 *     summary: Cancelar orden (admin cualquier, cliente propia si esta abierta)
 *     tags: [Ordenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Orden cancelada
 *       '400':
 *         description: No se puede cancelar
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '404':
 *         description: Orden no encontrada
 */
router.delete('/:id', asyncHandler(controller.cancelar));

module.exports = router;
