'use strict';

// =============================================================================
// NEON :: api-gateway - Tests unitarios de la extraccion del usuario (JWT)
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { config } = require('../src/config');
const { extractUser } = require('../src/middlewares/auth');

function reqWith(authorization) {
  return { headers: { authorization } };
}

test('extractUser devuelve el usuario de un token valido', () => {
  const token = jwt.sign({ sub: 'u1', email: 'a@b.com', rol: 'admin' }, config.jwt.secret, {
    issuer: config.jwt.issuer,
  });
  assert.deepEqual(extractUser(reqWith(`Bearer ${token}`)), {
    id: 'u1',
    email: 'a@b.com',
    rol: 'admin',
  });
});

test('extractUser devuelve null sin token o con token invalido', () => {
  assert.equal(extractUser(reqWith(undefined)), null);
  assert.equal(extractUser(reqWith('Bearer no-valido')), null);
  assert.equal(extractUser(reqWith('Basic abc')), null);
});

test('extractUser rechaza un token con emisor incorrecto', () => {
  const token = jwt.sign({ sub: 'u1' }, config.jwt.secret, { issuer: 'otro' });
  assert.equal(extractUser(reqWith(`Bearer ${token}`)), null);
});
