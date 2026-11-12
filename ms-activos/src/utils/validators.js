'use strict';

// =============================================================================
// NEON :: ms-activos - Validacion y normalizacion de entradas
// Sin dependencias extra: el stack declarado no incluye una libreria de esquemas.
// =============================================================================

const { HttpError } = require('./httpError');

const TIPOS = ['maquinaria', 'equipo', 'instalacion', 'vehiculo', 'herramienta', 'otro'];
const CRITICIDADES = ['alta', 'media', 'baja'];
const ESTADOS = ['operativo', 'en_mantenimiento', 'fuera_servicio', 'baja'];

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

function boolean(value, field = 'valor') {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw HttpError.badRequest(`El campo '${field}' debe ser booleano`, [{ field }]);
}

module.exports = {
  TIPOS,
  CRITICIDADES,
  ESTADOS,
  requiredString,
  optionalString,
  oneOf,
  date,
  boolean,
};
