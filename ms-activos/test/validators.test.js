'use strict';

// =============================================================================
// NEON :: ms-activos - Tests unitarios de validadores
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  TIPOS,
  requiredString,
  optionalString,
  oneOf,
  date,
  boolean,
} = require('../src/utils/validators');

test('requiredString normaliza y valida longitud', () => {
  assert.equal(requiredString('  AC-01  ', 'codigo', { min: 2, max: 60 }), 'AC-01');
  assert.throws(() => requiredString('x', 'codigo', { min: 2 }), /invalido/);
});

test('optionalString devuelve undefined si esta vacio', () => {
  assert.equal(optionalString('', 'marca'), undefined);
  assert.equal(optionalString(undefined, 'marca'), undefined);
  assert.equal(optionalString('  Siemens ', 'marca', { max: 80 }), 'Siemens');
});

test('oneOf valida el catalogo permitido', () => {
  assert.equal(oneOf('Equipo', TIPOS, 'tipo'), 'equipo');
  assert.equal(oneOf(undefined, TIPOS, 'tipo', { required: false }), undefined);
  assert.throws(() => oneOf('nave', TIPOS, 'tipo'), /invalido/);
  assert.throws(() => oneOf(undefined, TIPOS, 'tipo'), /obligatorio/);
});

test('date normaliza y rechaza fechas invalidas', () => {
  assert.equal(date('', 'fecha_adquisicion'), undefined);
  assert.ok(date('2024-01-15', 'fecha_adquisicion') instanceof Date);
  assert.throws(() => date('no-fecha', 'fecha_adquisicion'), /invalido/);
});

test('boolean acepta booleanos y cadenas', () => {
  assert.equal(boolean(true), true);
  assert.equal(boolean('false'), false);
  assert.throws(() => boolean('si'), /booleano/);
});
