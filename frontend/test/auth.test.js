import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeToken, isTokenExpired, usuarioDesdeToken } from '../src/lib/auth.js';

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

function tokenCon(payload) {
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.firma`;
}

test('decodeToken extrae el payload', () => {
  const token = tokenCon({ sub: 'u-1', email: 'admin@neon.local', rol: 'admin' });
  const payload = decodeToken(token);
  assert.equal(payload.sub, 'u-1');
  assert.equal(payload.rol, 'admin');
});

test('decodeToken devuelve null para entradas invalidas', () => {
  assert.equal(decodeToken(null), null);
  assert.equal(decodeToken('sin-puntos'), null);
  assert.equal(decodeToken('a.b.c'), null);
});

test('isTokenExpired detecta la expiracion', () => {
  const futuro = Math.floor(Date.now() / 1000) + 3600;
  const pasado = Math.floor(Date.now() / 1000) - 3600;
  assert.equal(isTokenExpired({ exp: futuro }), false);
  assert.equal(isTokenExpired({ exp: pasado }), true);
  assert.equal(isTokenExpired({}), false);
});

test('usuarioDesdeToken arma el usuario y descarta tokens expirados', () => {
  const vigente = tokenCon({
    sub: 'u-9',
    email: 'tec@neon.local',
    rol: 'tecnico',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  assert.deepEqual(usuarioDesdeToken(vigente), {
    id: 'u-9',
    email: 'tec@neon.local',
    rol: 'tecnico',
  });

  const expirado = tokenCon({ sub: 'u-9', rol: 'tecnico', exp: Math.floor(Date.now() / 1000) - 10 });
  assert.equal(usuarioDesdeToken(expirado), null);
});
