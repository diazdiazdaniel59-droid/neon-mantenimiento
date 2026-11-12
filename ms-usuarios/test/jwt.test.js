'use strict';

// =============================================================================
// NEON :: ms-usuarios - Tests unitarios de firma/verificacion JWT
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { signToken, verifyToken } = require('../src/utils/jwt');

test('signToken/verifyToken hacen roundtrip del payload', () => {
  const token = signToken({ sub: 'abc', email: 'a@b.com', rol: 'admin' });
  const payload = verifyToken(token);
  assert.equal(payload.sub, 'abc');
  assert.equal(payload.rol, 'admin');
  assert.equal(payload.iss, 'neon');
});

test('verifyToken rechaza un token manipulado', () => {
  const token = signToken({ sub: 'abc' });
  assert.throws(() => verifyToken(`${token}x`));
});
