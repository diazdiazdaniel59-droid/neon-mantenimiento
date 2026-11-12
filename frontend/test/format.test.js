import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatFecha, formatFechaHora, formatMoneda, labelEnum } from '../src/lib/format.js';

test('formatFecha devuelve un guion para valores vacios o invalidos', () => {
  assert.equal(formatFecha(null), '—');
  assert.equal(formatFecha(undefined), '—');
  assert.equal(formatFecha('no-es-fecha'), '—');
  assert.notEqual(formatFecha('2024-06-01T10:00:00Z'), '—');
});

test('formatFechaHora formatea valores validos', () => {
  assert.equal(formatFechaHora(undefined), '—');
  assert.notEqual(formatFechaHora('2024-06-01T10:00:00Z'), '—');
});

test('formatMoneda formatea numeros y protege vacios', () => {
  assert.equal(formatMoneda(null), '—');
  assert.equal(formatMoneda('abc'), '—');
  assert.match(formatMoneda(12.5), /12/);
});

test('labelEnum humaniza los valores de catalogo', () => {
  assert.equal(labelEnum('en_mantenimiento'), 'En mantenimiento');
  assert.equal(labelEnum(''), '—');
  assert.equal(labelEnum(undefined), '—');
});
