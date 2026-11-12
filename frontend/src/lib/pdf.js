// =============================================================================
// NEON :: frontend - Generacion del PDF del Acta de Cierre (jsPDF)
// Este modulo importa jsPDF y solo se usa en el navegador.
// =============================================================================

import { construirActa, dibujarActa } from './actaCierre.js';

export function nombreArchivoActa(orden) {
  const folio = String(orden && orden.id ? orden.id : 'orden').slice(0, 8);
  return `acta-cierre-${folio}.pdf`;
}

// jsPDF se carga bajo demanda (import dinamico) para no engordar el bundle inicial.
export async function generarActaCierrePdf(orden, opciones = {}) {
  const { jsPDF } = await import('jspdf');
  const acta = construirActa(orden, opciones);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  dibujarActa(doc, acta);
  const nombre = nombreArchivoActa(orden);
  doc.save(nombre);
  return nombre;
}
