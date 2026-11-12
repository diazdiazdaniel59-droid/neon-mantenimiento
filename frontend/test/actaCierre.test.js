import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirActa, dibujarActa, TITULO_ACTA } from '../src/lib/actaCierre.js';

const ORDEN = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  titulo: 'Cambio de rodamientos',
  descripcion: 'Ruido en el eje principal',
  tipo: 'correctivo',
  prioridad: 'alta',
  estado: 'cerrada',
  activo_id: 'ACT-010',
  activo_nombre: 'Motor principal',
  tecnico_email: 'tec@neon.local',
  fecha_cierre: '2024-06-02T10:00:00.000Z',
  solucion: 'Se reemplazaron los rodamientos',
};

function fakeDoc() {
  const calls = { text: [], line: [] };
  return {
    calls,
    setFontSize() {
      return this;
    },
    setFont() {
      return this;
    },
    setDrawColor() {
      return this;
    },
    setLineWidth() {
      return this;
    },
    splitTextToSize(text) {
      return String(text).split('\n');
    },
    text(...args) {
      calls.text.push(args);
      return this;
    },
    line(...args) {
      calls.line.push(args);
      return this;
    },
  };
}

test('construirActa arma la estructura y filtra filas vacias', () => {
  const acta = construirActa(ORDEN, { generadoEn: '2024-06-03T00:00:00.000Z' });
  assert.equal(acta.titulo, TITULO_ACTA);
  assert.equal(acta.folio, ORDEN.id);
  assert.equal(acta.generadoEn, '2024-06-03T00:00:00.000Z');
  assert.equal(acta.solucion, 'Se reemplazaron los rodamientos');
  assert.equal(acta.firmas.length, 3);
  assert.ok(acta.filas.every(([, v]) => v !== undefined && v !== null && v !== ''));
  assert.ok(acta.filas.some(([k, v]) => k === 'Activo (codigo)' && v === 'ACT-010'));
});

test('construirActa completa el activo y el tecnico cuando se proveen', () => {
  const acta = construirActa(ORDEN, {
    activo: { codigo: 'MOT-1', nombre: 'Motor 1', ubicacion: 'Sala A' },
    tecnico: { nombre: 'Juan Perez' },
    empresa: 'Empresa X',
  });
  assert.equal(acta.empresa, 'Empresa X');
  assert.ok(acta.filas.some(([k, v]) => k === 'Activo (nombre)' && v === 'Motor 1'));
  assert.ok(acta.filas.some(([k, v]) => k === 'Ubicacion del activo' && v === 'Sala A'));
  assert.ok(acta.filas.some(([k, v]) => k === 'Tecnico responsable' && v === 'Juan Perez'));
});

test('dibujarActa escribe el encabezado, el folio y las firmas', () => {
  const acta = construirActa(ORDEN, { generadoEn: '2024-06-03T00:00:00.000Z' });
  const doc = fakeDoc();
  const result = dibujarActa(doc, acta);

  assert.equal(result, doc);
  assert.ok(doc.calls.text.some((args) => args[0] === acta.empresa), 'dibuja la empresa');
  assert.ok(doc.calls.text.some((args) => args[0] === TITULO_ACTA), 'dibuja el titulo');
  assert.ok(
    doc.calls.text.some((args) => typeof args[0] === 'string' && args[0].startsWith('Folio:')),
    'dibuja el folio'
  );
  assert.equal(doc.calls.line.length, acta.firmas.length + 1, 'una linea separadora + firmas');
});
