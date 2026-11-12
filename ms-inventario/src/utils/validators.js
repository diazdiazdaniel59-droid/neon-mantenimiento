'use strict';

// =============================================================================
// NEON :: ms-inventario - Validacion y normalizacion de entradas
// Sin dependencias extra: el stack declarado no incluye una libreria de esquemas.
// =============================================================================

const { HttpError } = require('./httpError');

const UNIDADES = ['pieza', 'litro', 'metro', 'kg', 'caja', 'rollo', 'juego'];
const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'ajuste'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function optionalString(value, field, { max = 255 } = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  const normalized = asString(value);
  if (normalized.length > max) {
    throw HttpError.badRequest(`El campo '${field}' es invalido`, [
      { field, message: `no debe superar ${max} caracteres` },
    ]);
  }
  return normalized;
}

function oneOf(value, allowed, field, { required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw HttpError.badRequest(`El campo '${field}' es obligatorio`, [{ field }]);
    return undefined;
  }
  const normalized = asString(value).toLowerCase();
  if (!allowed.includes(normalized)) {
    throw HttpError.badRequest(`El campo '${field}' es invalido`, [
      { field, message: `valores permitidos: ${allowed.join(', ')}` },
    ]);
  }
  return normalized;
}

function uuid(value, field = 'id') {
  const normalized = asString(value);
  if (!UUID_RE.test(normalized)) {
    throw HttpError.badRequest(`El campo '${field}' no es un UUID valido`, [{ field }]);
  }
  return normalized;
}

function optionalUuid(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  return uuid(value, field);
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

const INTEGER_RE = /^[+-]?\d+$/;

function integer(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER, required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw HttpError.badRequest(`El campo '${field}' es obligatorio`, [{ field }]);
    return undefined;
  }
  // En cadenas se exige un entero estricto (evita que '1.5' se trunque a 1).
  const parsed =
    typeof value === 'number'
      ? value
      : INTEGER_RE.test(asString(value))
        ? Number.parseInt(asString(value), 10)
        : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw HttpError.badRequest(`El campo '${field}' es invalido`, [
      { field, message: `debe ser un entero entre ${min} y ${max}` },
    ]);
  }
  return parsed;
}

function decimal(value, field, { min = 0 } = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed < min) {
    throw HttpError.badRequest(`El campo '${field}' es invalido`, [
      { field, message: `debe ser un numero mayor o igual a ${min}` },
    ]);
  }
  return parsed;
}

function boolean(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const normalized = asString(value).toLowerCase();
  if (['true', '1', 'si', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  throw HttpError.badRequest(`El campo '${field}' es invalido`, [
    { field, message: 'debe ser booleano' },
  ]);
}

module.exports = {
  UNIDADES,
  TIPOS_MOVIMIENTO,
  requiredString,
  optionalString,
  oneOf,
  uuid,
  optionalUuid,
  email,
  integer,
  decimal,
  boolean,
};
