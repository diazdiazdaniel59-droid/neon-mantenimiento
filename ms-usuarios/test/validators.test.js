'use strict';

// =============================================================================
// NEON :: ms-usuarios - Tests unitarios de validadores
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  requiredString,
  email,
  password,
  rol,
  boolean,
  uuid,
} = require('../src/utils/validators');

test('requiredString normaliza espacios y valida longitud', () => {
  assert.equal(requiredString('  Ana  ', 'nombre', { min: 2, max: 120 }), 'Ana');
  assert.throws(() => requiredString('a', 'nombre', { min: 2 }), /invalido/);
});

test('email normaliza a minusculas y rechaza invalidos', () => {
  assert.equal(email('  Foo@Bar.COM '), 'foo@bar.com');
  assert.throws(() => email('no-es-email'), /invalido/);
});

test('password exige entre 8 y 128 caracteres', () => {
  assert.equal(password('claveSegura1'), 'claveSegura1');
  assert.throws(() => password('corta'), /invalido/);
});

test('rol valida el catalogo permitido', () => {
  assert.equal(rol('ADMIN'), 'admin');
  assert.equal(rol(undefined, { required: false }), undefined);
  assert.throws(() => rol('root'), /invalido/);
  assert.throws(() => rol(undefined), /obligatorio/);
});

test('boolean acepta booleanos y cadenas "true"/"false"', () => {
  assert.equal(boolean(true), true);
  assert.equal(boolean('false'), false);
  assert.throws(() => boolean('si'), /booleano/);
});

test('uuid valida el formato', () => {
  const id = '123e4567-e89b-12d3-a456-426614174000';
  assert.equal(uuid(id), id);
  assert.throws(() => uuid('123'), /UUID/);
});
