'use strict';

const { Router } = require('express');
const controller = require('../controllers/usuarios.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// Todas las rutas de gestion de usuarios requieren autenticacion.
router.use(authenticate);

/**
 * @openapi
 * /usuarios:
 *   get:
 *     summary: Listar usuarios con paginación y filtros
 *     tags: [Usuarios]
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
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [admin, supervisor, tecnico]
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *     responses:
 *       '200':
 *         description: Lista paginada de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos (requiere admin o supervisor)
 */
router.get('/', authorize('admin', 'supervisor'), asyncHandler(controller.list));

/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Crear nuevo usuario (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       '201':
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Solo admin
 *       '409':
 *         description: Email ya registrado
 */
router.post('/', authorize('admin'), asyncHandler(controller.create));

/**
 * @openapi
 * /usuarios/tecnicos:
 *   get:
 *     summary: Listar técnicos activos para asignación a órdenes
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de técnicos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 *       '401':
 *         description: Token requerido
 */
router.get('/tecnicos', asyncHandler(controller.listTecnicos));

/**
 * @openapi
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
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
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '404':
 *         description: Usuario no encontrado
 */
router.get('/:id', asyncHandler(controller.getOne));

/**
 * @openapi
 * /usuarios/{id}:
 *   patch:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
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
 *               nombre:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [admin, supervisor, tecnico]
 *               activo:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Sin permisos
 *       '404':
 *         description: Usuario no encontrado
 */
router.patch('/:id', asyncHandler(controller.update));

/**
 * @openapi
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario (solo admin)
 *     tags: [Usuarios]
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
 *         description: Usuario eliminado
 *       '400':
 *         description: No puede eliminarse a sí mismo
 *       '401':
 *         description: Token requerido
 *       '403':
 *         description: Solo admin
 *       '404':
 *         description: Usuario no encontrado
 */
router.delete('/:id', authorize('admin'), asyncHandler(controller.remove));

module.exports = router;
