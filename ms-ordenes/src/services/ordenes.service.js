'use strict';

// =============================================================================
// NEON :: ms-ordenes - Acceso a datos de ordenes (PostgreSQL)
// =============================================================================

const { pool } = require('../db/pool');
const { HttpError } = require('../utils/httpError');
const publisher = require('../broker/publisher');
const events = require('../events/ordenes.events');

const PUBLIC_COLUMNS = `
  id, cliente_id, tipo, prioridad, estado, descripcion,
  tecnico_id, fecha_solicitud, fecha_cierre, created_at, updated_at,
  evidencia_base64, evidencia_nombre
`;

const REPUESTOS_COLUMNS = `
  id, orden_id, repuesto_id, cantidad, nota, created_at
`;

function toPublic(row) {
  return row ? { ...row } : null;
}

async function createOrden({ cliente_id, tipo, prioridad, descripcion, tecnico_id }) {
  const { rows } = await pool.query(
    `INSERT INTO ordenes (cliente_id, tipo, prioridad, descripcion, tecnico_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PUBLIC_COLUMNS}`,
    [cliente_id, tipo, prioridad, descripcion, tecnico_id || null]
  );
  const orden = rows[0];

  // Publicar evento orden.creada (no bloquea si RabbitMQ no esta disponible)
  try {
    const { routingKey, payload } = events.ordenCreada(orden);
    await publisher.publish(routingKey, payload);
  } catch {
    // Evento no crítico: la orden ya se creo
  }

  return toPublic(orden);
}

async function listOrdenes({ page = 1, limit = 20, search, estado, prioridad, tipo, cliente_id, tecnico_id }) {
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`descripcion ILIKE $${params.length}`);
  }
  if (estado) {
    params.push(estado);
    conditions.push(`estado = $${params.length}`);
  }
  if (prioridad) {
    params.push(prioridad);
    conditions.push(`prioridad = $${params.length}`);
  }
  if (tipo) {
    params.push(tipo);
    conditions.push(`tipo = $${params.length}`);
  }
  if (cliente_id) {
    params.push(cliente_id);
    conditions.push(`cliente_id = $${params.length}`);
  }
  if (tecnico_id) {
    params.push(tecnico_id);
    conditions.push(`tecnico_id = $${params.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM ordenes ${whereSql}`,
    params
  );
  const total = countResult.rows[0].total;

  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}
     FROM ordenes ${whereSql}
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

async function getOrdenById(id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM ordenes WHERE id = $1`, [id]);
  return rows[0] ? toPublic(rows[0]) : null;
}

async function updateOrden(id, updates, _user) {
  const sets = [];
  const params = [];

  const allowedFields = ['tipo', 'prioridad', 'estado', 'descripcion', 'tecnico_id', 'evidencia_base64', 'evidencia_nombre'];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      params.push(updates[field]);
      sets.push(`${field} = $${params.length}`);
    }
  }

  if (!sets.length) {
    throw HttpError.badRequest('No se enviaron campos para actualizar');
  }

  // Si el estado pasa a cerrada, registrar fecha_cierre
  if (updates.estado === 'cerrada') {
    params.push(new Date().toISOString());
    sets.push(`fecha_cierre = $${params.length}`);
  } else if (updates.estado === 'abierta') {
    params.push(null);
    sets.push(`fecha_cierre = $${params.length}`);
  }

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE ordenes SET ${sets.join(', ')}
     WHERE id = $${params.length}
     RETURNING ${PUBLIC_COLUMNS}`,
    params
  );

  const orden = rows[0] ? toPublic(rows[0]) : null;

  // Publicar evento orden.cerrada si corresponde
  if (orden && orden.estado === 'cerrada') {
    try {
      const { routingKey, payload } = events.ordenCerrada(orden);
      await publisher.publish(routingKey, payload);
    } catch {
      // Evento no crítico
    }
  }

  return orden;
}

async function cancelarOrden(id, user) {
  const orden = await getOrdenById(id);
  if (!orden) throw HttpError.notFound('Orden no encontrada');

  // Solo el cliente dueño o un admin puede cancelar
  const isOwner = user.rol === 'cliente' && orden.cliente_id === user.id;
  const isAdmin = user.rol === 'admin';

  if (!isOwner && !isAdmin) {
    throw HttpError.forbidden('No tiene permiso para cancelar esta orden');
  }

  if (orden.estado === 'cancelada') {
    throw HttpError.badRequest('La orden ya esta cancelada');
  }
  if (orden.estado === 'cerrada') {
    throw HttpError.badRequest('No se puede cancelar una orden cerrada');
  }

  const result = await pool.query(
    `UPDATE ordenes SET estado = 'cancelada', fecha_cierre = $1
     WHERE id = $2
     RETURNING ${PUBLIC_COLUMNS}`,
    [new Date().toISOString(), id]
  );

  const cancelada = toPublic(result.rows[0]);

  try {
    const { routingKey, payload } = events.ordenCancelada(cancelada, user.id);
    await publisher.publish(routingKey, payload);
  } catch {
    // Evento no crítico
  }

  return cancelada;
}

async function puedeVerOrden(orden, user) {
  if (user.rol === 'admin' || user.rol === 'supervisor') return true;
  if (user.rol === 'tecnico' && orden.tecnico_id === user.id) return true;
  if (user.rol === 'cliente' && orden.cliente_id === user.id) return true;
  return false;
}

// =============================================================================
// Repuestos consumidos en órdenes
// =============================================================================

async function agregarRepuestoConsumido(ordenId, { repuesto_id, cantidad, nota }) {
  const { rows } = await pool.query(
    `INSERT INTO ordenes_repuestos (orden_id, repuesto_id, cantidad, nota)
     VALUES ($1, $2, $3, $4)
     RETURNING ${REPUESTOS_COLUMNS}`,
    [ordenId, repuesto_id, cantidad, nota || null]
  );
  return rows[0];
}

async function listarRepuestosConsumidos(ordenId) {
  const { rows } = await pool.query(
    `SELECT ${REPUESTOS_COLUMNS} FROM ordenes_repuestos WHERE orden_id = $1 ORDER BY created_at`,
    [ordenId]
  );
  return rows;
}

async function getOrdenConRepuestos(id) {
  const orden = await getOrdenById(id);
  if (!orden) return null;
  const consumos = await listarRepuestosConsumidos(id);
  return { ...orden, consumos };
}

module.exports = {
  toPublic,
  createOrden,
  listOrdenes,
  getOrdenById,
  updateOrden,
  cancelarOrden,
  puedeVerOrden,
  agregarRepuestoConsumido,
  listarRepuestosConsumidos,
  getOrdenConRepuestos,
};
