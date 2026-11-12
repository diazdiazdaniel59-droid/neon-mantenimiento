'use strict';

// =============================================================================
// NEON :: ms-inventario - Tests unitarios de validadores
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  UNIDADES,
  TIPOS_MOVIMIENTO,
  requiredString,
  optionalString,
  oneOf,
  integer,
  decimal,
  boolean,
} = require('../src/utils/validators');

test('requiredString normaliza y valida longitud', () => {
  assert.equal(requiredString('  SKU-001 ', 'codigo', { min: 1, max: 60 }), 'SKU-001');
  assert.throws(() => requiredString('', 'codigo'), /invalido/);
});

test('optionalString devuelve undefined si esta vacio', () => {
  assert.equal(optionalString('', 'categoria'), undefined);
  assert.equal(optionalString('Filtros', 'categoria', { max: 80 }), 'Filtros');
});

test('oneOf valida unidades y tipos de movimiento', () => {
  assert.equal(oneOf('Pieza', UNIDADES, 'unidad'), 'pieza');
  assert.equal(oneOf('ENTRADA', TIPOS_MOVIMIENTO, 'tipo'), 'entrada');
  assert.throws(() => oneOf('galon', UNIDADES, 'unidad'), /invalido/);
});

test('integer valida rango y tipo entero', () => {
  assert.equal(integer('5', 'stock', { min: 0 }), 5);
  assert.equal(integer(undefined, 'stock', { required: false }), undefined);
  assert.throws(() => integer('1.5', 'stock'), /invalido/);
  assert.throws(() => integer(-1, 'stock', { min: 0 }), /invalido/);
});

test('decimal valida numeros no negativos', () => {
  assert.equal(decimal('12.50', 'precio_unitario'), 12.5);
  assert.equal(decimal(undefined, 'precio_unitario'), undefined);
  assert.throws(() => decimal(-1, 'precio_unitario'), /invalido/);
});

test('boolean acepta booleanos y cadenas comunes', () => {
  assert.equal(boolean(true, 'activo'), true);
  assert.equal(boolean('false', 'activo'), false);
  assert.equal(boolean('si', 'activo'), true);
  assert.equal(boolean(undefined, 'activo'), undefined);
  assert.throws(() => boolean('quizas', 'activo'), /invalido/);
});
