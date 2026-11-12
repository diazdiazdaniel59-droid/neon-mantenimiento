'use strict';

// =============================================================================
// NEON :: ms-inventario - Acceso a datos de inventario (PostgreSQL)
// =============================================================================

const { pool } = require('../db/pool');
const { HttpError } = require('../utils/httpError');

const ITEM_COLUMNS = `
  id, sku, nombre, descripcion, tipo, unidad, precio_unitario,
  stock_actual, stock_minimo, ubicacion, activo, created_at, updated_at
`;

function toPublic(row) {
  return row ? { ...row } : null;
}

async function createItem({ sku, nombre, descripcion, tipo, unidad, precio_unitario, stock_actual, stock_minimo, ubicacion }) {
  const { rows } = await pool.query(
    `INSERT INTO items (sku, nombre, descripcion, tipo, unidad, precio_unitario, stock_actual, stock_minimo, ubicacion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${ITEM_COLUMNS}`,
    [sku, nombre, descripcion, tipo, unidad, precio_unitario, stock_actual, stock_minimo, ubicacion || null]
  );
  return toPublic(rows[0]);
}

async function listItems({ page = 1, limit = 20, search, tipo, activo, stockBajo }) {
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(nombre ILIKE $${params.length} OR sku ILIKE $${params.length} OR descripcion ILIKE $${params.length})`);
  }
  if (tipo) {
    params.push(tipo);
    conditions.push(`tipo = $${params.length}`);
  }
  if (activo !== undefined) {
    params.push(activo);
    conditions.push(`activo = $${params.length}`);
  }
  if (stockBajo === true) {
    conditions.push(`stock_actual <= stock_minimo`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM items ${whereSql}`,
    params
  );
  const total = countResult.rows[0].total;

  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const { rows } = await pool.query(
    `SELECT ${ITEM_COLUMNS}
     FROM items ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return {
    items: rows.map(toPublic),
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getItemById(id) {
  const { rows } = await pool.query(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = $1`, [id]);
  return rows[0] ? toPublic(rows[0]) : null;
}

async function getItemBySku(sku) {
  const { rows } = await pool.query(`SELECT ${ITEM_COLUMNS} FROM items WHERE sku = $1`, [sku]);
  return rows[0] ? toPublic(rows[0]) : null;
}

async function updateItem(id, updates) {
  const sets = [];
  const params = [];

  const allowedFields = ['nombre', 'descripcion', 'tipo', 'unidad', 'precio_unitario', 'stock_minimo', 'ubicacion', 'activo'];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      params.push(updates[field]);
      sets.push(`${field} = $${params.length}`);
    }
  }

  if (!sets.length) {
    throw HttpError.badRequest('No se enviaron campos para actualizar');
  }

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE items SET ${sets.join(', ')}
     WHERE id = $${params.length}
     RETURNING ${ITEM_COLUMNS}`,
    params
  );

  return rows[0] ? toPublic(rows[0]) : null;
}

async function ajustarStock(id, cantidad, tipo_movimiento, motivo, usuario_id) {
  // Verificar que el item exista y este activo
  const item = await getItemById(id);
  if (!item) throw HttpError.notFound('Item no encontrado');
  if (!item.activo) throw HttpError.badRequest('El item no esta activo');

  let nuevoStock;
  if (tipo_movimiento === 'entrada') {
    nuevoStock = item.stock_actual + cantidad;
  } else if (tipo_movimiento === 'salida') {
    nuevoStock = item.stock_actual - cantidad;
    if (nuevoStock < 0) {
      throw HttpError.badRequest('Stock insuficiente para esta salida');
    }
  } else if (tipo_movimiento === 'ajuste') {
    nuevoStock = cantidad;
  }

  const { rows } = await pool.query(
    `UPDATE items SET stock_actual = $1 WHERE id = $2 RETURNING ${ITEM_COLUMNS}`,
    [nuevoStock, id]
  );

  // Registrar movimiento
  await pool.query(
    `INSERT INTO movimientos_inventario (item_id, tipo_movimiento, cantidad, motivo, usuario_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, tipo_movimiento, cantidad, motivo, usuario_id || null]
  );

  return toPublic(rows[0]);
}

async function listMovimientos({ page = 1, limit = 20, item_id, tipo_movimiento }) {
  const params = [];
  const conditions = [];

  if (item_id) {
    params.push(item_id);
    conditions.push(`item_id = $${params.length}`);
  }
  if (tipo_movimiento) {
    params.push(tipo_movimiento);
    conditions.push(`tipo_movimiento = $${params.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM movimientos_inventario ${whereSql}`,
    params
  );
  const total = countResult.rows[0].total;

  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const { rows } = await pool.query(
    `SELECT id, item_id, tipo_movimiento, cantidad, motivo, usuario_id, created_at
     FROM movimientos_inventario ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return {
    items: rows,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

module.exports = {
  toPublic,
  createItem,
  listItems,
  getItemById,
  getItemBySku,
  updateItem,
  ajustarStock,
  listMovimientos,
};
