'use strict';

// =============================================================================
// NEON :: ms-inventario - Controlador de inventario
//   GET    /inventario/catalogo     (cliente, tecnico, admin, supervisor)
//   GET    /inventario              (admin, supervisor)
//   GET    /inventario/:id          (cliente, tecnico, admin, supervisor)
//   POST   /inventario              (admin, supervisor)
//   PATCH  /inventario/:id          (admin, supervisor)
//   DELETE /inventario/:id          (admin)
//   POST   /inventario/:id/stock    (admin, supervisor)
//   GET    /inventario/:id/movimientos (admin, supervisor)
// =============================================================================

const inventarioService = require('../services/inventario.service');
const { HttpError } = require('../utils/httpError');
const { requiredString, optionalString, oneOf, uuid, integer, decimal, boolean } = require('../utils/validators');

const TIPOS = ['repuesto', 'herramienta', 'insumo', 'servicio'];
const UNIDADES = ['pieza', 'litro', 'metro', 'kg', 'caja', 'rollo', 'juego'];
const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'ajuste'];

// -----------------------------------------------------------------------------
// Normalizacion de contrato
// El cliente puede enviar nombres alternativos; se aceptan ambos y se mapean
// al contrato canonico antes de validar:
//   codigo -> sku | categoria -> tipo | stock -> stock_actual | tipo -> tipo_movimiento
// -----------------------------------------------------------------------------

const ALIAS_TIPO = {
  repuesto: 'repuesto',
  repuestos: 'repuesto',
  herramienta: 'herramienta',
  herramientas: 'herramienta',
  insumo: 'insumo',
  insumos: 'insumo',
  servicio: 'servicio',
  servicios: 'servicio',
};

/**
 * Devuelve un `tipo` valido del enum.
 * Los valores no reconocidos caen a 'repuesto' para no romper la UI cuando el
 * campo se envia como texto libre (comportamiento historico de `categoria`).
 */
function normalizarTipo(value) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ALIAS_TIPO[raw] || 'repuesto';
}

/** Primer valor definido y no vacio de la lista; permite aceptar alias. */
function primeroDefinido(...valores) {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && valor !== '') return valor;
  }
  return undefined;
}

/** Filtro de stock bajo aceptando `stockBajo` y `low_stock`. */
function leerStockBajo(query) {
  return query.stockBajo === 'true' || query.low_stock === 'true';
}

async function catalogo(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), req.app.locals.maxPageSize || 100);

  const search = req.query.search ? String(req.query.search).trim() : undefined;
  const tipo = req.query.tipo ? oneOf(req.query.tipo, TIPOS, 'tipo', { required: false }) : undefined;
  const stockBajo = leerStockBajo(req.query);

  const result = await inventarioService.listItems({ page, limit, search, tipo, activo: true, stockBajo });
  res.json(result);
}

async function list(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), req.app.locals.maxPageSize || 100);

  const search = req.query.search ? String(req.query.search).trim() : undefined;
  const tipo = req.query.tipo ? oneOf(req.query.tipo, TIPOS, 'tipo', { required: false }) : undefined;
  const activo = req.query.activo !== undefined ? boolean(req.query.activo, 'activo') : undefined;
  const stockBajo = leerStockBajo(req.query);

  const result = await inventarioService.listItems({ page, limit, search, tipo, activo, stockBajo });
  res.json(result);
}

async function getOne(req, res) {
  const id = uuid(req.params.id, 'id');
  const item = await inventarioService.getItemById(id);
  if (!item) throw HttpError.notFound('Item no encontrado');
  res.json({ item });
}

async function create(req, res) {
  const sku = requiredString(primeroDefinido(req.body.sku, req.body.codigo), 'sku', { min: 1, max: 50 });
  const nombre = requiredString(req.body.nombre, 'nombre', { min: 2, max: 160 });
  const descripcion = optionalString(req.body.descripcion, 'descripcion', { max: 1000 });
  const tipo = normalizarTipo(primeroDefinido(req.body.tipo, req.body.categoria));
  const unidad = oneOf(req.body.unidad, UNIDADES, 'unidad');
  const precio_unitario = decimal(req.body.precio_unitario, 'precio_unitario', { min: 0 }) ?? 0;
  const stock_actual = integer(primeroDefinido(req.body.stock_actual, req.body.stock), 'stock_actual', { min: 0, required: false }) ?? 0;
  const stock_minimo = integer(req.body.stock_minimo, 'stock_minimo', { min: 0, required: false }) ?? 0;
  const ubicacion = optionalString(req.body.ubicacion, 'ubicacion', { max: 120 });

  const existing = await inventarioService.getItemBySku(sku);
  if (existing) throw HttpError.conflict('Ya existe un item con ese SKU', [{ field: 'sku' }]);

  const item = await inventarioService.createItem({
    sku, nombre, descripcion, tipo, unidad, precio_unitario, stock_actual, stock_minimo, ubicacion,
  });
  res.status(201).json({ item });
}

async function update(req, res) {
  const id = uuid(req.params.id, 'id');
  const item = await inventarioService.getItemById(id);
  if (!item) throw HttpError.notFound('Item no encontrado');

  const updates = {};
  if (req.body.nombre !== undefined) updates.nombre = requiredString(req.body.nombre, 'nombre', { min: 2, max: 160 });
  if (req.body.descripcion !== undefined) updates.descripcion = optionalString(req.body.descripcion, 'descripcion', { max: 1000 });
  if (req.body.tipo !== undefined || req.body.categoria !== undefined) {
    updates.tipo = normalizarTipo(primeroDefinido(req.body.tipo, req.body.categoria));
  }
  if (req.body.unidad !== undefined) updates.unidad = oneOf(req.body.unidad, UNIDADES, 'unidad');
  if (req.body.precio_unitario !== undefined) updates.precio_unitario = decimal(req.body.precio_unitario, 'precio_unitario', { min: 0 }) ?? 0;
  if (req.body.stock_minimo !== undefined) updates.stock_minimo = integer(req.body.stock_minimo, 'stock_minimo', { min: 0 });
  if (req.body.ubicacion !== undefined) updates.ubicacion = optionalString(req.body.ubicacion, 'ubicacion', { max: 120 });
  if (req.body.activo !== undefined) updates.activo = boolean(req.body.activo, 'activo');

  // Cambiar el stock desde una edicion se registra como movimiento 'ajuste'
  // para no perder el historial de inventario.
  const stockRaw = primeroDefinido(req.body.stock_actual, req.body.stock);
  const stockNuevo = stockRaw === undefined ? undefined : integer(stockRaw, 'stock_actual', { min: 0 });
  const cambiaStock = stockNuevo !== undefined && stockNuevo !== item.stock_actual;

  if (Object.keys(updates).length === 0 && !cambiaStock) {
    throw HttpError.badRequest('No se enviaron campos para actualizar');
  }

  let actualizado = item;
  if (Object.keys(updates).length > 0) {
    actualizado = await inventarioService.updateItem(id, updates);
  }
  if (cambiaStock) {
    actualizado = await inventarioService.ajustarStock(
      id,
      stockNuevo,
      'ajuste',
      'Ajuste por edicion de item',
      req.user.id
    );
  }

  res.json({ item: actualizado });
}

async function remove(req, res) {
  const id = uuid(req.params.id, 'id');
  const item = await inventarioService.getItemById(id);
  if (!item) throw HttpError.notFound('Item no encontrado');

  // Soft delete: poner activo = false
  await inventarioService.updateItem(id, { activo: false });
  res.status(204).send();
}

async function ajustarStock(req, res) {
  const id = uuid(req.params.id, 'id');
  const tipo_movimiento = oneOf(
    primeroDefinido(req.body.tipo_movimiento, req.body.tipo),
    TIPOS_MOVIMIENTO,
    'tipo_movimiento'
  );
  const cantidad = integer(req.body.cantidad, 'cantidad', { min: 1 });
  const motivo = optionalString(req.body.motivo, 'motivo', { max: 200 });

  const actualizado = await inventarioService.ajustarStock(id, cantidad, tipo_movimiento, motivo, req.user.id);
  res.json({ item: actualizado });
}

async function listMovimientos(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), req.app.locals.maxPageSize || 100);

  const item_id = req.query.item_id ? uuid(req.query.item_id, 'item_id') : undefined;
  const tipo_movimiento = req.query.tipo_movimiento ? oneOf(req.query.tipo_movimiento, TIPOS_MOVIMIENTO, 'tipo_movimiento', { required: false }) : undefined;

  const result = await inventarioService.listMovimientos({ page, limit, item_id, tipo_movimiento });
  res.json(result);
}

module.exports = { catalogo, list, getOne, create, update, remove, ajustarStock, listMovimientos };
