'use strict';

// =============================================================================
// NEON :: ms-usuarios - Tests unitarios de HttpError
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HttpError } = require('../src/utils/httpError');

test('los helpers fijan status, mensaje y flag operacional', () => {
  const notFound = HttpError.notFound('no existe');
  assert.equal(notFound.statusCode, 404);
  assert.equal(notFound.isOperational, true);
  assert.equal(notFound.message, 'no existe');

  const conflict = HttpError.conflict('duplicado', [{ field: 'email' }]);
  assert.equal(conflict.statusCode, 409);
  assert.deepEqual(conflict.details, [{ field: 'email' }]);
});
