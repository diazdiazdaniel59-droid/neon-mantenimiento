'use strict';

// =============================================================================
// NEON :: ms-activos - Acceso a datos de activos (MongoDB / Mongoose)
// =============================================================================

const mongoose = require('mongoose');
const { Activo, toPublic } = require('../models/activo.model');
const { HttpError } = require('../utils/httpError');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertValidId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw HttpError.badRequest("El campo 'id' no es un identificador valido", [{ field: 'id' }]);
  }
}

async function create(data) {
  const doc = await Activo.create(data);
  return toPublic(doc);
}

async function findById(id) {
  assertValidId(id);
  const doc = await Activo.findById(id);
  return doc ? toPublic(doc) : null;
}

async function list({ page = 1, limit = 20, search, tipo, estado, criticidad }) {
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ nombre: rx }, { codigo: rx }];
  }
  if (tipo) filter.tipo = tipo;
  if (estado) filter.estado = estado;
  if (criticidad) filter.criticidad = criticidad;

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Activo.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Activo.countDocuments(filter),
  ]);

  return {
    items: docs.map(toPublic),
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function update(id, patch) {
  assertValidId(id);
  const doc = await Activo.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  return doc ? toPublic(doc) : null;
}

async function remove(id) {
  assertValidId(id);
  const doc = await Activo.findByIdAndDelete(id);
  return Boolean(doc);
}

module.exports = { create, findById, list, update, remove };
