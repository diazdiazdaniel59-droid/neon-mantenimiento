'use strict';

// =============================================================================
// NEON :: ms-ordenes - Tests unitarios de los eventos de dominio
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ROUTING_KEYS, ordenCreada, ordenCerrada, ordenCancelada } = require('../src/events/ordenes.events');

const orden = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  cliente_id: '223e4567-e89b-12d3-a456-426614174000',
  tipo: 'preventivo',
  prioridad: 'alta',
  estado: 'abierta',
  descripcion: 'Cambio de aceite del compresor',
  tecnico_id: null,
  fecha_solicitud: '2024-06-01T10:00:00.000Z',
  created_at: '2024-06-01T10:00:00.000Z',
};

test('ordenCreada usa la routing key y el payload esperados', () => {
  const { routingKey, payload } = ordenCreada(orden);
  assert.equal(routingKey, ROUTING_KEYS.creada);
  assert.equal(routingKey, 'orden.creada');
  assert.equal(payload.event, 'orden.creada');
  assert.equal(payload.ordenId, orden.id);
  assert.equal(payload.clienteId, orden.cliente_id);
  assert.equal(payload.descripcion, 'Cambio de aceite del compresor');
});

test('ordenCerrada incluye solucion y fecha de cierre', () => {
  const cerrada = {
    ...orden,
    estado: 'cerrada',
    descripcion: 'Aceite reemplazado',
    fecha_cierre: '2024-06-02T10:00:00.000Z',
  };
  const { routingKey, payload } = ordenCerrada(cerrada);
  assert.equal(routingKey, 'orden.cerrada');
  assert.equal(payload.estado, 'cerrada');
  assert.equal(payload.solucion, 'Aceite reemplazado');
  assert.equal(payload.fechaCierre, '2024-06-02T10:00:00.000Z');
});

test('ordenCancelada indica quien la cancelo', () => {
  const { routingKey, payload } = ordenCancelada({ ...orden, estado: 'cancelada' }, 'usuario-1');
  assert.equal(routingKey, 'orden.cancelada');
  assert.equal(payload.event, 'orden.cancelada');
  assert.equal(payload.canceladoPor, 'usuario-1');
});
