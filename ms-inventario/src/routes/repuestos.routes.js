'use strict';

const { Router } = require('express');
const controller = require('../controllers/repuestos.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// Todo el inventario requiere autenticacion (defensa en profundidad).
router.use(authenticate);

/**
 * @openapi
 * /inventario/descontar:
 *   post:
 *     summary: Descontar stock de un repuesto para una orden (crítico de negocio)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DescontarInput'
 *     responses:
 *       '200':
 *         description: Stock descontado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DescontarResponse'
 *       '400':
 *         description: Datos inválidos o stock insuficiente
 *       '401':
 *         description: Token requerido
 *       '404':
 *         description: Repuesto no encontrado
 *       '409':
 *         description: Stock insuficiente
 */
router.post('/descontar', authorize('admin', 'supervisor', 'tecnico'), asyncHandler(controller.descontarStock));

// Movimientos (listado global)
/**
 * @openapi
 * /inventario/movimientos:
 *   get:
 *     summary: Listar todos los movimientos con filtros
 *     tags: [Movimientos]
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
 *         name: repuesto_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [entrada, salida, ajuste]
 *       - in: query
 *         name: orden_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Lista paginada de movimientos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       '401':
 *         description: Token requerido
 */
router.get('/movimientos', asyncHandler(controller.listAllMovimientos));

// Repuestos
/**
 * @openapi
 * /inventario/repuestos:
 *   get:
 *     summary: Listar repuestos con paginación y filtros
 *     tags: [Inventario]
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
 *         name: categoria
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: low_stock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Lista paginada de repuestos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       '401':
 *         description: Token requerido
 */
router.get('/repuestos', asyncHandler(controller.listRepuestos));

/**
 * @openapi
 * /inventario/repuestos:
 *   post:
 *     summary: Crear nuevo repuesto (admin, supervisor)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RepuestoInput'
 *     responses:
 *       '201':
 *         description: Repuesto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 repuesto:
 *                   $ref: '#/components/schemas/Repuesto'
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Solo admin o supervisor
 *       '409':
 *         description: Código duplicado
 */
router.post('/repuestos', authorize('admin', 'supervisor'), asyncHandler(controller.createRepuesto));

/**
 * @openapi
 * /inventario/repuestos/{id}:
 *   get:
 *     summary: Obtener repuesto por ID
 *     tags: [Inventario]
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
 *         description: Repuesto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 repuesto:
 *                   $ref: '#/components/schemas/Repuesto'
 *       '401':
 *         description: Token requerido
 *       '404':
 *         description: Repuesto no encontrado
 */
router.get('/repuestos/:id', asyncHandler(controller.getRepuesto));

/**
 * @openapi
 * /inventario/repuestos/{id}:
 *   patch:
 *     summary: Actualizar repuesto (admin, supervisor) - NO modifica stock
 *     tags: [Inventario]
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
 *             $ref: '#/components/schemas/RepuestoInput'
 *     responses:
 *       '200':
 *         description: Repuesto actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 repuesto:
 *                   $ref: '#/components/schemas/Repuesto'
 *       '400':
 *         description: Datos inválidos o sin campos
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Solo admin o supervisor
 *       '404':
 *         description: Repuesto no encontrado
 */
router.patch(
  '/repuestos/:id',
  authorize('admin', 'supervisor'),
  asyncHandler(controller.updateRepuesto)
);

/**
 * @openapi
 * /inventario/repuestos/{id}:
 *   delete:
 *     summary: Eliminar repuesto (solo admin)
 *     tags: [Inventario]
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
 *       '204':
 *         description: Repuesto eliminado
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Solo admin
 *       '404':
 *         description: Repuesto no encontrado
 */
router.delete('/repuestos/:id', authorize('admin'), asyncHandler(controller.removeRepuesto));

// Movimientos de un repuesto (ajustan el stock)
/**
 * @openapi
 * /inventario/repuestos/{id}/movimientos:
 *   get:
 *     summary: Listar movimientos de un repuesto
 *     tags: [Movimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *     responses:
 *       '200':
 *         description: Lista paginada de movimientos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       '401':
 *         description: Token requerido
 *       '404':
 *         description: Repuesto no encontrado
 */
router.get('/repuestos/:id/movimientos', asyncHandler(controller.listMovimientos));

/**
 * @openapi
 * /inventario/repuestos/{id}/movimientos:
 *   post:
 *     summary: Registrar movimiento de stock (entrada/salida/ajuste)
 *     tags: [Movimientos]
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
 *             $ref: '#/components/schemas/MovimientoInput'
 *     responses:
 *       '201':
 *         description: Movimiento registrado y stock actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movimiento:
 *                   $ref: '#/components/schemas/Movimiento'
 *                 repuesto:
 *                   $ref: '#/components/schemas/Repuesto'
 *       '400':
 *         description: Datos inválidos o stock insuficiente (salida)
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Solo admin, supervisor o técnico
 *       '404':
 *         description: Repuesto no encontrado
 *       '409':
 *         description: Stock insuficiente para salida
 */
router.post(
  '/repuestos/:id/movimientos',
  authorize('admin', 'supervisor', 'tecnico'),
  asyncHandler(controller.createMovimiento)
);

module.exports = router;
