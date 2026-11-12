'use strict';

// =============================================================================
// NEON :: ms-usuarios - Acceso a datos de usuarios (PostgreSQL)
// Consultas parametrizadas; nunca se expone password_hash al exterior.
// =============================================================================

const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');
const { config } = require('../config');
const { HttpError } = require('../utils/httpError');

const PUBLIC_COLUMNS = 'id, nombre, email, rol, activo, created_at, updated_at';

function toPublic(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

async function createUsuario({ nombre, email, password, rol = 'tecnico' }) {
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  try {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_COLUMNS}`,
      [nombre, email, passwordHash, rol]
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw HttpError.conflict('Ya existe un usuario registrado con ese email', [{ field: 'email' }]);
    }
    throw err;
  }
}

async function findByEmailWithHash(email) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol, activo, password_hash
     FROM usuarios WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM usuarios WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function list({ page = 1, limit = 20, search, rol, activo }) {
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(nombre ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }
  if (rol) {
    params.push(rol);
    conditions.push(`rol = $${params.length}`);
  }
  if (typeof activo === 'boolean') {
    params.push(activo);
    conditions.push(`activo = $${params.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM usuarios ${whereSql}`, params);
  const total = countResult.rows[0].total;

  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}
     FROM usuarios ${whereSql}
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

async function listTecnicos() {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}
     FROM usuarios
     WHERE rol = 'tecnico' AND activo = TRUE
     ORDER BY nombre ASC`
  );
  return rows;
}

async function updateUsuario(id, { nombre, rol, activo, password }) {
  const sets = [];
  const params = [];

  if (nombre !== undefined) {
    params.push(nombre);
    sets.push(`nombre = $${params.length}`);
  }
  if (rol !== undefined) {
    params.push(rol);
    sets.push(`rol = $${params.length}`);
  }
  if (activo !== undefined) {
    params.push(activo);
    sets.push(`activo = $${params.length}`);
  }
  if (password !== undefined) {
    params.push(await bcrypt.hash(password, config.bcryptRounds));
    sets.push(`password_hash = $${params.length}`);
  }

  if (!sets.length) {
    throw HttpError.badRequest('No se enviaron campos para actualizar');
  }

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE usuarios SET ${sets.join(', ')}
     WHERE id = $${params.length}
     RETURNING ${PUBLIC_COLUMNS}`,
    params
  );
  return rows[0] || null;
}

async function remove(id) {
  const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = {
  toPublic,
  createUsuario,
  findByEmailWithHash,
  findById,
  list,
  listTecnicos,
  updateUsuario,
  remove,
};
