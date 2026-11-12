'use strict';

// =============================================================================
// NEON :: ms-ordenes - Tests unitarios de validadores
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  TIPOS,
  requiredString,
  optionalString,
  oneOf,
  uuid,
  optionalUuid,
  email,
  date,
} = require('../src/utils/validators');

test('requiredString normaliza y valida longitud', () => {
  assert.equal(requiredString('  Cambio de aceite ', 'titulo', { min: 3, max: 160 }), 'Cambio de aceite');
  assert.throws(() => requiredString('ab', 'titulo', { min: 3 }), /invalido/);
});

test('optionalString devuelve undefined si esta vacio', () => {
  assert.equal(optionalString('', 'descripcion'), undefined);
  assert.equal(optionalString('texto', 'descripcion', { max: 2000 }), 'texto');
});

test('oneOf valida el catalogo y respeta required', () => {
  assert.equal(oneOf('Preventivo', TIPOS, 'tipo'), 'preventivo');
  assert.equal(oneOf(undefined, TIPOS, 'tipo', { required: false }), undefined);
  assert.throws(() => oneOf('urgentisimo', TIPOS, 'tipo'), /invalido/);
});

test('uuid y optionalUuid validan el formato', () => {
  const id = '123e4567-e89b-12d3-a456-426614174000';
  assert.equal(uuid(id), id);
  assert.equal(optionalUuid(undefined, 'tecnico_id'), undefined);
  assert.throws(() => uuid('123', 'id'), /UUID/);
});

test('email normaliza y valida', () => {
  assert.equal(email('  TEC@Neon.local '), 'tec@neon.local');
  assert.throws(() => email('no-mail'), /invalido/);
});

test('date normaliza y rechaza invalidas', () => {
  assert.equal(date(undefined, 'fecha'), undefined);
  assert.ok(date('2024-06-01', 'fecha') instanceof Date);
  assert.throws(() => date('xxx', 'fecha'), /invalido/);
});
