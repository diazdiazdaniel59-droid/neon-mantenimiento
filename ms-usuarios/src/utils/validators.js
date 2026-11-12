'use strict';

// =============================================================================
// NEON :: ms-usuarios - Validacion y normalizacion de entradas
// Sin dependencias extra: el stack declarado para el servicio no incluye una
// libreria de esquemas. Cada validador lanza HttpError.badRequest con detalle.
// =============================================================================

const { HttpError } = require('./httpError');

const ROLES = ['admin', 'supervisor', 'tecnico', 'cliente'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredString(value, field, { min = 1, max = 255 } = {}) {
  const normalized = asString(value);
  if (normalized.length < min || normalized.length > max) {
    throw HttpError.badRequest(`El campo '${field}' es invalido`, [
      { field, message: `debe tener entre ${min} y ${max} caracteres` },
    ]);
  }
  return normalized;
}

function email(value, field = 'email') {
  const normalized = asString(value).toLowerCase();
  if (!EMAIL_RE.test(normalized) || normalized.length > 160) {
    throw HttpError.badRequest(`El campo '${field}' es invalido`, [
      { field, message: 'debe ser un correo electronico valido' },
    ]);
  }
  return normalized;
}

function password(value, field = 'password') {
  const raw = typeof value === 'string' ? value : '';
  if (raw.length < 8 || raw.length > 128) {
    throw HttpError.badRequest(`El campo '${field}' es invalido`, [
      { field, message: 'debe tener entre 8 y 128 caracteres' },
    ]);
  }
  return raw;
}

function rol(value, { required = true, field = 'rol' } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw HttpError.badRequest(`El campo '${field}' es obligatorio`, [{ field }]);
    }
    return undefined;
  }
  const normalized = asString(value).toLowerCase();
  if (!ROLES.includes(normalized)) {
    throw HttpError.badRequest(`El campo '${field}' es invalido`, [
      { field, message: `valores permitidos: ${ROLES.join(', ')}` },
    ]);
  }
  return normalized;
}

function boolean(value, field = 'valor') {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw HttpError.badRequest(`El campo '${field}' debe ser booleano`, [{ field }]);
}

function uuid(value, field = 'id') {
  const normalized = asString(value);
  if (!UUID_RE.test(normalized)) {
    throw HttpError.badRequest(`El campo '${field}' no es un UUID valido`, [{ field }]);
  }
  return normalized;
}

module.exports = { ROLES, requiredString, email, password, rol, boolean, uuid };
