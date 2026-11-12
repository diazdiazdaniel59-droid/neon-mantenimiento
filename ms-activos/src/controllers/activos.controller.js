'use strict';

// =============================================================================
// NEON :: ms-activos - Controlador de activos
//   GET    /activos        (cualquier usuario autenticado)
//   POST   /activos        (admin, supervisor)
//   GET    /activos/:id    (cualquier usuario autenticado)
//   PATCH  /activos/:id    (admin, supervisor)
//   DELETE /activos/:id    (admin)
// =============================================================================

const service = require('../services/activos.service');
const { HttpError } = require('../utils/httpError');
const { config } = require('../config');
const {
  TIPOS,
  CRITICIDADES,
  ESTADOS,
  requiredString,
  optionalString,
  oneOf,
  date,
} = require('../utils/validators');

function parsePage(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), config.maxPageSize);
  return { page, limit };
}

async function list(req, res) {
  const { page, limit } = parsePage(req.query);
  const search = req.query.search ? String(req.query.search).trim() : undefined;
  const tipo = req.query.tipo ? oneOf(req.query.tipo, TIPOS, 'tipo') : undefined;
  const estado = req.query.estado ? oneOf(req.query.estado, ESTADOS, 'estado') : undefined;
  const criticidad = req.query.criticidad
    ? oneOf(req.query.criticidad, CRITICIDADES, 'criticidad')
    : undefined;

  const result = await service.list({ page, limit, search, tipo, estado, criticidad });
  res.json(result);
}

async function getOne(req, res) {
  const activo = await service.findById(req.params.id);
  if (!activo) throw HttpError.notFound('Activo no encontrado');
  res.json({ activo });
}

function buildData(body, { partial }) {
  const data = {};

  const putRequired = (field, opts) => {
    if (partial && body[field] === undefined) return;
    data[field] = requiredString(body[field], field, opts);
  };
  const putOptional = (field, opts) => {
    const value = optionalString(body[field], field, opts);
    if (value !== undefined) data[field] = value;
  };
  const putEnum = (field, allowed) => {
    if (partial && body[field] === undefined) return;
    const value = oneOf(body[field], allowed, field, { required: false });
    if (value !== undefined) data[field] = value;
  };
  const putDate = (field) => {
    const value = date(body[field], field);
    if (value !== undefined) data[field] = value;
  };

  putRequired('codigo', { min: 2, max: 60 });
  putRequired('nombre', { min: 2, max: 160 });
  putOptional('marca', { max: 80 });
  putOptional('modelo', { max: 80 });
  putOptional('numero_serie', { max: 80 });
  putOptional('ubicacion', { max: 160 });
  putOptional('notas', { max: 1000 });
  putEnum('tipo', TIPOS);
  putEnum('criticidad', CRITICIDADES);
  putEnum('estado', ESTADOS);
  putDate('fecha_adquisicion');
  return data;
}

async function create(req, res) {
  const data = buildData(req.body, { partial: false });
  const activo = await service.create(data);
  res.status(201).json({ activo });
}

async function update(req, res) {
  const patch = buildData(req.body, { partial: true });
  if (!Object.keys(patch).length) {
    throw HttpError.badRequest('No se enviaron campos para actualizar');
  }
  const activo = await service.update(req.params.id, patch);
  if (!activo) throw HttpError.notFound('Activo no encontrado');
  res.json({ activo });
}

async function remove(req, res) {
  const eliminado = await service.remove(req.params.id);
  if (!eliminado) throw HttpError.notFound('Activo no encontrado');
  res.status(204).send();
}

module.exports = { list, getOne, create, update, remove };
