'use strict';

// =============================================================================
// NEON :: ms-notificaciones - Tests unitarios de las plantillas de mensajes
// =============================================================================

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildNotification } = require('../src/notifications/templates');

test('orden.creada genera asunto y cuerpo con los datos de la orden', () => {
  const notif = buildNotification({
    event: 'orden.creada',
    ordenId: '123e4567-e89b-12d3-a456-426614174000',
    activoId: 'ACT-001',
    titulo: 'Cambio de aceite',
    tipo: 'preventivo',
    prioridad: 'alta',
    estado: 'abierta',
  });
  assert.equal(notif.event, 'orden.creada');
  assert.match(notif.subject, /Cambio de aceite/);
  assert.match(notif.text, /ACT-001/);
  assert.match(notif.text, /preventivo/);
});

test('orden.cerrada incluye la solucion y la fecha de cierre', () => {
  const notif = buildNotification({
    event: 'orden.cerrada',
    ordenId: '123e4567-e89b-12d3-a456-426614174000',
    titulo: 'Reparacion de bomba',
    estado: 'cerrada',
    fechaCierre: '2024-06-02T10:00:00.000Z',
    solucion: 'Sello reemplazado',
  });
  assert.match(notif.subject, /cerrada/i);
  assert.match(notif.text, /Sello reemplazado/);
  assert.match(notif.text, /2024-06-02/);
});

test('eventos desconocidos se notifican con un asunto generico', () => {
  const notif = buildNotification({ event: 'orden.reabierta', ordenId: 'X' });
  assert.match(notif.subject, /orden.reabierta/);
  assert.match(notif.text, /orden.reabierta/);
});

test('un evento vacio no lanza excepciones', () => {
  const notif = buildNotification({});
  assert.equal(typeof notif.subject, 'string');
  assert.equal(typeof notif.text, 'string');
  assert.match(notif.subject, /desconocido/);
});
