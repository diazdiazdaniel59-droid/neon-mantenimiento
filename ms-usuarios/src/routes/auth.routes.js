'use strict';

const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middlewares/auth');

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registro público de nuevo usuario (rol cliente o tecnico)
 *     tags: [Auth]
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
 *       '409':
 *         description: Email ya registrado
 */
router.post('/register', asyncHandler(controller.register));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Inicio de sesión - retorna JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       '200':
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       '401':
 *         description: Credenciales inválidas
 */
router.post('/login', asyncHandler(controller.login));

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Perfil del usuario autenticado (alias legacy)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *       '401':
 *         description: Token requerido o inválido
 *       '404':
 *         description: Usuario no encontrado
 */
router.get('/me', authenticate, asyncHandler(controller.me));

/**
 * @openapi
 * /auth/perfil:
 *   get:
 *     summary: Perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *       '401':
 *         description: Token requerido o inválido
 *       '404':
 *         description: Usuario no encontrado
 */
router.get('/perfil', authenticate, asyncHandler(controller.me));

module.exports = router;
