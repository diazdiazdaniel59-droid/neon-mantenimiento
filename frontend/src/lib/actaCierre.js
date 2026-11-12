// =============================================================================
// NEON :: frontend - Acta de Cierre de Mantenimiento
//   - construirActa(...)  : funcion PURA que arma la estructura del documento.
//   - dibujarActa(doc,...): dibuja sobre un documento jsPDF inyectado (testable).
// La generacion/descarga real vive en ./pdf.js (importa jsPDF).
// =============================================================================

export const TITULO_ACTA = 'ACTA DE CIERRE DE MANTENIMIENTO';
export const EMPRESA_POR_DEFECTO = 'NEON - Sistema de Gestion de Mantenimiento';

export function construirActa(orden, { activo, tecnico, empresa, generadoEn } = {}) {
  const filas = [
    ['Titulo', orden.titulo],
    ['Tipo', orden.tipo],
    ['Prioridad', orden.prioridad],
    ['Estado', orden.estado],
    ['Activo (codigo)', (activo && activo.codigo) || orden.activo_id],
    ['Activo (nombre)', (activo && activo.nombre) || orden.activo_nombre],
    ['Ubicacion del activo', activo && activo.ubicacion],
    ['Tecnico responsable', (tecnico && (tecnico.nombre || tecnico.email)) || orden.tecnico_email],
    ['Fecha programada', orden.fecha_programada],
    ['Fecha de inicio', orden.fecha_inicio],
    ['Fecha de cierre', orden.fecha_cierre],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  return {
    empresa: empresa || EMPRESA_POR_DEFECTO,
    titulo: TITULO_ACTA,
    folio: orden.id,
    generadoEn: generadoEn || new Date().toISOString(),
    orden,
    solucion: orden.solucion || orden.descripcion || '',
    filas,
    firmas: ['Responsable tecnico', 'Supervisor', 'Responsable del activo'],
  };
}

// Dibuja el acta en un documento jsPDF (A4, mm). `doc` se inyecta para poder
// testear la disposicion sin depender de jsPDF.
export function dibujarActa(doc, acta) {
  const margen = 20;
  const anchoPagina = 210;
  const anchoUtil = anchoPagina - margen * 2;
  let y = 22;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(acta.empresa, margen, y);
  y += 9;

  doc.setFontSize(13);
  doc.text(acta.titulo, margen, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Folio: ${acta.folio}`, margen, y);
  y += 5;
  doc.text(`Generado: ${acta.generadoEn}`, margen, y);
  y += 6;

  doc.setDrawColor(120);
  doc.setLineWidth(0.4);
  doc.line(margen, y, anchoPagina - margen, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Informacion de la orden', margen, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  for (const [label, value] of acta.filas) {
    doc.text(`${label}:`, margen, y);
    doc.text(String(value), margen + 50, y);
    y += 6;
  }

  y += 4;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Trabajo realizado / solucion aplicada', margen, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const texto = doc.splitTextToSize(
    acta.solucion || 'Sin descripcion registrada.',
    anchoUtil
  );
  doc.text(texto, margen, y);
  y += texto.length * 5 + 16;

  const anchoFirma = anchoUtil / acta.firmas.length;
  acta.firmas.forEach((firma, i) => {
    const x = margen + i * anchoFirma;
    doc.line(x + 4, y, x + anchoFirma - 4, y);
    doc.text(firma, x + 4, y + 5);
  });

  return doc;
}
