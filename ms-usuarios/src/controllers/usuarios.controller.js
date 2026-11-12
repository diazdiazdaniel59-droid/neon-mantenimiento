'use strict';

// =============================================================================
// NEON :: ms-usuarios - Controlador de gestion de usuarios
//   GET    /usuarios        (admin, supervisor)
//   POST   /usuarios        (admin)
//   GET    /usuarios/:id    (admin, supervisor o el propio usuario)
//   PATCH  /usuarios/:id    (admin o el propio usuario)
//   DELETE /usuarios/:id    (admin)
// =============================================================================

const usuariosService = require('../services/usuarios.service');
const { HttpError } = require('../utils/httpError');
const { config } = require('../config');
const { requiredString, email, password, rol, boolean, uuid } = require('../utils/validators');

function isManagement(rol_) {
  return rol_ === 'admin' || rol_ === 'supervisor';
}

async function list(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), config.maxPageSize);

  const search = req.query.search ? String(req.query.search).trim() : undefined;
  const rolFilter = req.query.rol ? rol(req.query.rol) : undefined;
  const activo = req.query.activo === undefined ? undefined : String(req.query.activo).toLowerCase() === 'true';

  const result = await usuariosService.list({ page, limit, search, rol: rolFilter, activo });
  res.json(result);
}

async function getOne(req, res) {
  const id = uuid(req.params.id, 'id');
  if (req.user.id !== id && !isManagement(req.user.rol)) {
    throw HttpError.forbidden('No tiene permiso para ver este usuario');
  }

  const usuario = await usuariosService.findById(id);
  if (!usuario) throw HttpError.notFound('Usuario no encontrado');
  res.json({ usuario });
}

async function create(req, res) {
  const nombre = requiredString(req.body.nombre, 'nombre', { min: 2, max: 120 });
  const correo = email(req.body.email);
  const clave = password(req.body.password);
  const rolValue = rol(req.body.rol, { required: false }) || 'tecnico';

  const usuario = await usuariosService.createUsuario({ nombre, email: correo, password: clave, rol: rolValue });
  res.status(201).json({ usuario });
}

async function update(req, res) {
  const id = uuid(req.params.id, 'id');
  const isSelf = req.user.id === id;
  const isAdmin = req.user.rol === 'admin';

  if (!isSelf && !isAdmin) {
    throw HttpError.forbidden('No tiene permiso para modificar este usuario');
  }

  const patch = {};
  if (req.body.nombre !== undefined) {
    patch.nombre = requiredString(req.body.nombre, 'nombre', { min: 2, max: 120 });
  }
  if (req.body.password !== undefined) {
    patch.password = password(req.body.password);
  }
  if (req.body.rol !== undefined) {
    if (!isAdmin) throw HttpError.forbidden('Solo un administrador puede cambiar el rol');
    patch.rol = rol(req.body.rol);
  }
  if (req.body.activo !== undefined) {
    if (!isAdmin) throw HttpError.forbidden('Solo un administrador puede cambiar el estado');
    patch.activo = boolean(req.body.activo, 'activo');
  }

  const usuario = await usuariosService.updateUsuario(id, patch);
  if (!usuario) throw HttpError.notFound('Usuario no encontrado');
  res.json({ usuario });
}

async function remove(req, res) {
  const id = uuid(req.params.id, 'id');
  if (req.user.id === id) throw HttpError.badRequest('No puede eliminar su propio usuario');

  const eliminado = await usuariosService.remove(id);
  if (!eliminado) throw HttpError.notFound('Usuario no encontrado');
  res.status(204).send();
}

async function listTecnicos(req, res) {
  const tecnicos = await usuariosService.listTecnicos();
  res.json({ items: tecnicos });
}

module.exports = { list, getOne, create, update, remove, listTecnicos };
