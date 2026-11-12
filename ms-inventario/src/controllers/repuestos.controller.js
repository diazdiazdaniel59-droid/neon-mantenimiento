'use strict';

// =============================================================================
// NEON :: ms-inventario - Controlador de repuestos y movimientos de stock
//   GET    /inventario/repuestos                     (autenticado)
//   POST   /inventario/repuestos                     (admin, supervisor)
//   GET    /inventario/repuestos/:id                 (autenticado)
//   PATCH  /inventario/repuestos/:id                 (admin, supervisor)
//   DELETE /inventario/repuestos/:id                 (admin)
//   GET    /inventario/repuestos/:id/movimientos     (autenticado)
//   POST   /inventario/repuestos/:id/movimientos     (admin, supervisor, tecnico)
//   GET    /inventario/movimientos                   (autenticado)
//
// El stock NO se edita por PATCH: solo cambia registrando movimientos.
// =============================================================================

const service = require('../services/inventario.service');
const { HttpError } = require('../utils/httpError');
const { config } = require('../config');
const {
  UNIDADES,
  TIPOS_MOVIMIENTO,
  requiredString,
  optionalString,
  oneOf,
  uuid,
  optionalUuid,
  integer,
  decimal,
  boolean,
} = require('../utils/validators');

function parsePage(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), config.maxPageSize);
  return { page, limit };
}

function clean(object) {
  return Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined));
}

// --- Repuestos ---------------------------------------------------------------

async function listRepuestos(req, res) {
  const { page, limit } = parsePage(req.query);
  const activo = boolean(req.query.activo, 'activo');
  const result = await service.list({
    page,
    limit,
    categoria: optionalString(req.query.categoria, 'categoria', { max: 80 }),
    activo,
    lowStock: boolean(req.query.low_stock, 'low_stock') === true,
    search: optionalString(req.query.search, 'search', { max: 160 }),
  });
  res.json(result);
}

async function getRepuesto(req, res) {
  const id = uuid(req.params.id, 'id');
  const repuesto = await service.findById(id);
  if (!repuesto) throw HttpError.notFound('Repuesto no encontrado');
  res.json({ repuesto });
}

async function createRepuesto(req, res) {
  const data = {
    codigo: requiredString(req.body.codigo, 'codigo', { min: 1, max: 60 }),
    nombre: requiredString(req.body.nombre, 'nombre', { min: 2, max: 160 }),
    ...clean({
      descripcion: optionalString(req.body.descripcion, 'descripcion', { max: 2000 }),
      categoria: optionalString(req.body.categoria, 'categoria', { max: 80 }),
      unidad: oneOf(req.body.unidad, UNIDADES, 'unidad', { required: false }),
      stock: integer(req.body.stock, 'stock', { required: false, min: 0 }),
      stock_minimo: integer(req.body.stock_minimo, 'stock_minimo', { required: false, min: 0 }),
      precio_unitario: decimal(req.body.precio_unitario, 'precio_unitario', { min: 0 }),
      ubicacion: optionalString(req.body.ubicacion, 'ubicacion', { max: 120 }),
      activo: boolean(req.body.activo, 'activo'),
    }),
  };
  const repuesto = await service.create(data);
  res.status(201).json({ repuesto });
}

async function updateRepuesto(req, res) {
  const id = uuid(req.params.id, 'id');
  const patch = {};

  if (req.body.codigo !== undefined) {
    patch.codigo = requiredString(req.body.codigo, 'codigo', { min: 1, max: 60 });
  }
  if (req.body.nombre !== undefined) {
    patch.nombre = requiredString(req.body.nombre, 'nombre', { min: 2, max: 160 });
  }
  if (req.body.descripcion !== undefined) {
    patch.descripcion = optionalString(req.body.descripcion, 'descripcion', { max: 2000 });
  }
  if (req.body.categoria !== undefined) {
    patch.categoria = optionalString(req.body.categoria, 'categoria', { max: 80 });
  }
  if (req.body.unidad !== undefined) {
    patch.unidad = oneOf(req.body.unidad, UNIDADES, 'unidad');
  }
  if (req.body.stock_minimo !== undefined) {
    patch.stock_minimo = integer(req.body.stock_minimo, 'stock_minimo', { min: 0 });
  }
  if (req.body.precio_unitario !== undefined) {
    patch.precio_unitario = decimal(req.body.precio_unitario, 'precio_unitario', { min: 0 });
  }
  if (req.body.ubicacion !== undefined) {
    patch.ubicacion = optionalString(req.body.ubicacion, 'ubicacion', { max: 120 });
  }
  if (req.body.activo !== undefined) {
    patch.activo = boolean(req.body.activo, 'activo');
  }

  const fields = clean(patch);
  if (!Object.keys(fields).length) {
    throw HttpError.badRequest('No se enviaron campos para actualizar');
  }

  const repuesto = await service.update(id, fields);
  if (!repuesto) throw HttpError.notFound('Repuesto no encontrado');
  res.json({ repuesto });
}

async function removeRepuesto(req, res) {
  const id = uuid(req.params.id, 'id');
  const eliminado = await service.remove(id);
  if (!eliminado) throw HttpError.notFound('Repuesto no encontrado');
  res.status(204).send();
}

// --- Movimientos -------------------------------------------------------------

async function listMovimientos(req, res) {
  const id = uuid(req.params.id, 'id');
  const repuesto = await service.findById(id);
  if (!repuesto) throw HttpError.notFound('Repuesto no encontrado');
  const { page, limit } = parsePage(req.query);
  const result = await service.listMovimientos(id, { page, limit });
  res.json(result);
}

async function createMovimiento(req, res) {
  const id = uuid(req.params.id, 'id');
  const data = {
    tipo: oneOf(req.body.tipo, TIPOS_MOVIMIENTO, 'tipo'),
    cantidad: integer(req.body.cantidad, 'cantidad', { min: 1 }),
    motivo: optionalString(req.body.motivo, 'motivo', { max: 2000 }),
    ordenId: optionalUuid(req.body.orden_id, 'orden_id'),
    usuarioId: req.user.id,
  };
  const result = await service.createMovimiento(id, data);
  if (result.notFound) throw HttpError.notFound('Repuesto no encontrado');
  if (result.conflict) throw HttpError.conflict(result.conflict);
  res.status(201).json({ movimiento: result.movimiento, repuesto: result.repuesto });
}

async function listAllMovimientos(req, res) {
  const { page, limit } = parsePage(req.query);
  const result = await service.listAllMovimientos({
    page,
    limit,
    repuestoId: req.query.repuesto_id ? uuid(req.query.repuesto_id, 'repuesto_id') : undefined,
    tipo: req.query.tipo ? oneOf(req.query.tipo, TIPOS_MOVIMIENTO, 'tipo') : undefined,
    ordenId: req.query.orden_id ? uuid(req.query.orden_id, 'orden_id') : undefined,
  });
  res.json(result);
}

async function descontarStock(req, res) {
  const { repuestoId, cantidad, ordenId } = req.body;
  const id = uuid(repuestoId, 'repuestoId');
  const qty = integer(cantidad, 'cantidad', { min: 1 });
  const ordId = uuid(ordenId, 'ordenId');

  const result = await service.descontarStock(id, qty, ordId, req.user.id);
  if (result.notFound) throw HttpError.notFound('Repuesto no encontrado');
  if (result.conflict) throw HttpError.conflict(result.conflict);

  const subtotal = result.repuesto.precio_unitario * qty;
  res.json({
    subtotal: Number(subtotal.toFixed(2)),
    stockActual: result.repuesto.stock,
    repuesto: result.repuesto,
    movimiento: result.movimiento,
  });
}

module.exports = {
  listRepuestos,
  getRepuesto,
  createRepuesto,
  updateRepuesto,
  removeRepuesto,
  listMovimientos,
  createMovimiento,
  listAllMovimientos,
  descontarStock,
};
