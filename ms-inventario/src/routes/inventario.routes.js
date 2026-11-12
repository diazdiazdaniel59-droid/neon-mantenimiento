'use strict';

const { Router } = require('express');
const controller = require('../controllers/inventario.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// Todas las rutas requieren autenticacion
router.use(authenticate);

/**
 * @openapi
 * /inventario/catalogo:
 *   get:
 *     summary: Ver catalogo de items disponibles (cliente, tecnico, admin, supervisor)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: tipo
 *         schema: { type: string, enum: [repuesto, herramienta, insumo, servicio] }
 *       - in: query
 *         name: stockBajo
 *         schema: { type: boolean }
 *     responses:
 *       '200':
 *         description: Catalogo de items
 *       '401':
 *         description: Token requerido
 */
router.get('/catalogo', asyncHandler(controller.catalogo));

/**
 * @openapi
 * /inventario:
 *   get:
 *     summary: Listar items con paginacion y filtros (admin, supervisor)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista paginada de items
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 */
router.get('/', authorize('admin', 'supervisor'), asyncHandler(controller.list));

/**
 * @openapi
 * /inventario:
 *   post:
 *     summary: Crear nuevo item de inventario (admin, supervisor)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sku, nombre, tipo, unidad, precio_unitario]
 *             properties:
 *               sku: { type: string, example: 'REP-001' }
 *               nombre: { type: string, example: 'Filtro de aceite' }
 *               tipo: { type: string, enum: [repuesto, herramienta, insumo, servicio] }
 *               unidad: { type: string, enum: [pieza, litro, metro, kg, caja, rollo, juego] }
 *               precio_unitario: { type: number, example: 15.50 }
 *               stock_actual: { type: integer, example: 10 }
 *               stock_minimo: { type: integer, example: 2 }
 *     responses:
 *       '201':
 *         description: Item creado
 *       '400':
 *         description: Datos invalidos
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '409':
 *         description: SKU ya existe
 */
router.post('/', authorize('admin', 'supervisor'), asyncHandler(controller.create));

/**
 * @openapi
 * /inventario/{id}:
 *   get:
 *     summary: Obtener item por ID (cliente, tecnico, admin, supervisor)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200':
 *         description: Item encontrado
 *       '401':
 *         description: Token requerido
 *       '404':
 *         description: Item no encontrado
 */
router.get('/:id', asyncHandler(controller.getOne));

/**
 * @openapi
 * /inventario/{id}:
 *   patch:
 *     summary: Actualizar item (admin, supervisor)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200':
 *         description: Item actualizado
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '404':
 *         description: Item no encontrado
 */
router.patch('/:id', authorize('admin', 'supervisor'), asyncHandler(controller.update));

/**
 * @openapi
 * /inventario/{id}:
 *   delete:
 *     summary: Desactivar item (admin)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '204':
 *         description: Item desactivado
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '404':
 *         description: Item no encontrado
 */
router.delete('/:id', authorize('admin'), asyncHandler(controller.remove));

/**
 * @openapi
 * /inventario/{id}/stock:
 *   post:
 *     summary: Ajustar stock de un item (admin, supervisor)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo_movimiento, cantidad]
 *             properties:
 *               tipo_movimiento: { type: string, enum: [entrada, salida, ajuste] }
 *               cantidad: { type: integer, example: 5 }
 *               motivo: { type: string, example: 'Recepcion de proveedor' }
 *     responses:
 *       '200':
 *         description: Stock ajustado
 *       '400':
 *         description: Datos invalidos o stock insuficiente
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '404':
 *         description: Item no encontrado
 */
router.post('/:id/stock', authorize('admin', 'supervisor'), asyncHandler(controller.ajustarStock));

/**
 * @openapi
 * /inventario/{id}/movimientos:
 *   get:
 *     summary: Historial de movimientos de un item (admin, supervisor)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200':
 *         description: Lista de movimientos
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '404':
 *         description: Item no encontrado
 */
router.get('/:id/movimientos', authorize('admin', 'supervisor'), asyncHandler(controller.listMovimientos));

module.exports = router;
