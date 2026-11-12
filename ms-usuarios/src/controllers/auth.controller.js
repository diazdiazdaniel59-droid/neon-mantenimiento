'use strict';

// =============================================================================
// NEON :: ms-usuarios - Controlador de autenticacion
// POST /auth/register  -> auto-registro publico (rol 'tecnico')
// POST /auth/login     -> valida credenciales y emite el JWT
// GET  /auth/me        -> perfil del usuario autenticado
// =============================================================================

const bcrypt = require('bcryptjs');
const usuariosService = require('../services/usuarios.service');
const { signToken } = require('../utils/jwt');
const { HttpError } = require('../utils/httpError');
const { requiredString, email, password, rol } = require('../utils/validators');

// Roles que un usuario puede auto-asignarse al registrarse públicamente.
const ROLES_AUTORREGISTRO = ['cliente', 'tecnico'];

// Hash de referencia para igualar el tiempo de respuesta cuando el usuario no
// existe (evita enumeracion de cuentas por temporizacion).
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

async function register(req, res) {
  const nombre = requiredString(req.body.nombre, 'nombre', { min: 2, max: 120 });
  const correo = email(req.body.email);
  const clave = password(req.body.password);
  const rolValue = rol(req.body.rol, { required: false }) || 'tecnico';

  if (!ROLES_AUTORREGISTRO.includes(rolValue)) {
    throw HttpError.forbidden(
      `El rol '${rolValue}' no puede ser auto-asignado`,
      [{ field: 'rol', message: `valores permitidos: ${ROLES_AUTORREGISTRO.join(', ')}` }],
    );
  }

  const usuario = await usuariosService.createUsuario({
    nombre,
    email: correo,
    password: clave,
    rol: rolValue,
  });

  res.status(201).json({ usuario });
}

async function login(req, res) {
  const correo = email(req.body.email);
  const clave = typeof req.body.password === 'string' ? req.body.password : '';

  const usuario = await usuariosService.findByEmailWithHash(correo);
  const hash = usuario ? usuario.password_hash : DUMMY_HASH;
  const coincide = await bcrypt.compare(clave, hash);

  if (!usuario || !coincide || !usuario.activo) {
    throw HttpError.unauthorized('Credenciales invalidas');
  }

  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol });
  res.json({ token, tokenType: 'Bearer', usuario: usuariosService.toPublic(usuario) });
}

async function me(req, res) {
  const usuario = await usuariosService.findById(req.user.id);
  if (!usuario) throw HttpError.notFound('Usuario no encontrado');
  res.json({ usuario });
}

module.exports = { register, login, me };
