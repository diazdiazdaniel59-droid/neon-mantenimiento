'use strict';

// =============================================================================
// NEON :: api-gateway - Tests unitarios de la tabla de rutas
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveRoute } = require('../src/routing');

const services = {
  usuarios: 'http://usuarios:3001',
  activos: 'http://activos:3002',
  ordenes: 'http://ordenes:3003',
  inventario: 'http://inventario:3004',
};

test('login y register son rutas publicas', () => {
  assert.equal(resolveRoute('/auth/login', services).public, true);
  assert.equal(resolveRoute('/auth/register', services).public, true);
});

test('/auth/me y /usuarios requieren autenticacion', () => {
  assert.equal(resolveRoute('/auth/me', services).public, false);
  assert.equal(resolveRoute('/usuarios', services).public, false);
  assert.equal(resolveRoute('/usuarios/abc', services).service, 'usuarios');
});

test('cada prefijo apunta a su microservicio', () => {
  assert.equal(resolveRoute('/activos/1', services).target, services.activos);
  assert.equal(resolveRoute('/ordenes', services).target, services.ordenes);
  assert.equal(resolveRoute('/inventario/repuestos', services).target, services.inventario);
});

test('las rutas desconocidas no se exponen', () => {
  assert.equal(resolveRoute('/desconocido', services), null);
  assert.equal(resolveRoute('/', services), null);
});

test('normaliza las barras finales', () => {
  assert.equal(resolveRoute('/auth/login/', services).public, true);
  assert.equal(resolveRoute('/activos/', services).service, 'activos');
});
