'use strict';

// =============================================================================
// NEON :: ms-ordenes - Validacion y normalizacion de entradas
// Sin dependencias extra: el stack declarado no incluye una libreria de esquemas.
// =============================================================================

const { HttpError } = require('./httpError');

const TIPOS = ['preventivo', 'correctivo', 'predictivo', 'mejora'];
const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'];
const ESTADOS = ['abierta', 'en_proceso', 'en_espera', 'cerrada', 'cancelada'];
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

function date(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw HttpError.badRequest(`El campo '${field}' es invalido`, [
      { field, message: 'debe ser una fecha valida (ISO 8601)' },
    ]);
  }
  return parsed;
}

module.exports = {
  TIPOS,
  PRIORIDADES,
  ESTADOS,
  requiredString,
  optionalString,
  oneOf,
  uuid,
  optionalUuid,
  email,
  date,
};
