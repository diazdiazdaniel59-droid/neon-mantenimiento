/**
 * NEON :: Generador de Acta de Cierre Técnico
 * Genera HTML listo para imprimir / guardar como PDF con:
 * - Membrete NEON, código de orden, fecha, sello SLA
 * - Datos del activo, diagnóstico, repuestos consumidos
 * - Evidencia fotográfica (base64) en alta definición
 * - Firma digital del técnico (desde localStorage)
 */

import { formatFecha, formatMoneda } from './format.js';

// =============================================================================
// Utilidades internas
// =============================================================================

function escapeHtml(str) {
  if (!str) return '—';
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function formatearEstado(estado) {
  const mapa = {
    abierta: 'Abierta',
    en_proceso: 'En Proceso',
    en_espera: 'En Espera',
    cerrada: 'Cerrada',
    cancelada: 'Cancelada',
    operativo: 'Operativo',
    en_mantenimiento: 'En Mantenimiento',
    fuera_servicio: 'Fuera de Servicio',
    baja: 'Baja',
  };
  return mapa[estado] || estado;
}

function formatearPrioridad(prioridad) {
  const mapa = { baja: 'Baja', media: 'Media', alta: 'Alta', urgente: 'Urgente' };
  return mapa[prioridad] || prioridad;
}

function formatearTipoOrden(tipo) {
  const mapa = {
    preventivo: 'Preventivo',
    correctivo: 'Correctivo',
    predictivo: 'Predictivo',
    mejora: 'Mejora',
  };
  return mapa[tipo] || tipo;
}

function formatearTipoRepuesto(tipo) {
  const mapa = {
    repuesto: 'Repuesto',
    herramienta: 'Herramienta',
    insumo: 'Insumo',
    servicio: 'Servicio',
  };
  return mapa[tipo] || tipo;
}

// Firma del técnico desde localStorage (guardada en TecnicoPerfil)
function obtenerFirmaTecnico() {
  try {
    return localStorage.getItem('neon_tec_firma') || '';
  } catch {
    return '';
  }
}

function obtenerNombreTecnico() {
  try {
    return localStorage.getItem('neon_tec_nombre') || '';
  } catch {
    return '';
  }
}

function obtenerEspecialidadTecnico() {
  try {
    return localStorage.getItem('neon_tec_especialidad') || '';
  } catch {
    return '';
  }
}

// =============================================================================
// Generador principal
// =============================================================================

/**
 * Genera el HTML completo del acta técnico para impresión/PDF.
 * @param {Object} orden - Orden completa con relaciones cargadas
 * @param {Object} activo - Activo intervenido (opcional, si no viene en orden)
 * @param {Array} repuestosConsumidos - Array de { repuesto, cantidad, precio_unitario }
 * @returns {string} HTML listo para window.open().document.write()
 */
export function generarActaHTML({ orden, activo, repuestosConsumidos = [] }) {
  const tecnicoNombre = obtenerNombreTecnico() || orden.tecnico_nombre || 'Técnico no identificado';
  const tecnicoEspecialidad = obtenerEspecialidadTecnico();
  const firmaBase64 = obtenerFirmaTecnico();

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaActual = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calcular SLA si hay fechas
  let slaInfo = '';
  if (orden.fecha_creacion && orden.fecha_cierre) {
    const inicio = new Date(orden.fecha_creacion);
    const fin = new Date(orden.fecha_cierre);
    const diffMs = fin - inicio;
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    slaInfo = `${diffHoras}h ${diffMinutos}min`;
  }

  // Total repuestos
  const totalRepuestos = repuestosConsumidos.reduce(
    (acc, r) => acc + (Number(r.cantidad) * Number(r.precio_unitario || 0)),
    0
  );

  // Evidencia fotográfica
  const evidenciaHtml = orden.evidencia_base64
    ? `<div class="acta-evidencia">
         <h4>Evidencia Fotográfica</h4>
         <img src="data:image/jpeg;base64,${orden.evidencia_base64}" alt="Evidencia de la orden ${orden.codigo}" style="max-width:100%; max-height:400px; border:1px solid #d1d5db; border-radius:8px;" />
       </div>`
    : '';

  // Repuestos consumidos
  const repuestosRows = repuestosConsumidos.length
    ? repuestosConsumidos
        .map(
          (r, i) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:0.5rem; text-align:center;">${i + 1}</td>
        <td style="padding:0.5rem;">${escapeHtml(r.repuesto?.sku || r.repuesto?.codigo || '—')}</td>
        <td style="padding:0.5rem;">${escapeHtml(r.repuesto?.nombre || 'Repuesto desconocido')}</td>
        <td style="padding:0.5rem; text-align:center;">${formatearTipoRepuesto(r.repuesto?.tipo || r.repuesto?.categoria)}</td>
        <td style="padding:0.5rem; text-align:center;">${escapeHtml(r.repuesto?.unidad || 'pieza')}</td>
        <td style="padding:0.5rem; text-align:right;">${Number(r.cantidad)}</td>
        <td style="padding:0.5rem; text-align:right;">${formatMoneda(r.precio_unitario || r.repuesto?.precio_unitario || 0)}</td>
        <td style="padding:0.5rem; text-align:right; font-weight:600;">${formatMoneda(Number(r.cantidad) * Number(r.precio_unitario || r.repuesto?.precio_unitario || 0))}</td>
      </tr>
    `
        )
        .join('')
    : `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#6b7280;">No se consumieron repuestos en esta orden.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Acta de Cierre Técnico - ${escapeHtml(orden.codigo)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', 'Geist', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; color: #111827; line-height: 1.5; font-size: 13px; }
    .acta-print { max-width: 800px; margin: 0 auto; padding: 2rem; }
    .acta-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #FF5E00; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .acta-brand { display: flex; align-items: center; gap: 1rem; }
    .acta-brand-mark { width: 48px; height: 48px; background: #FF5E00; color: #050505; border-radius: 10px; display: grid; place-items: center; font-weight: 800; font-size: 1.5rem; }
    .acta-brand-text { font-weight: 700; font-size: 1.5rem; letter-spacing: -0.02em; color: #111827; }
    .acta-meta { text-align: right; font-size: 0.875rem; color: #374151; }
    .acta-meta .meta-row { display: flex; justify-content: flex-end; gap: 1rem; margin-bottom: 0.25rem; }
    .acta-meta .meta-label { font-weight: 600; color: #6b7280; }
    .acta-meta .meta-value { font-family: monospace; }
    .acta-section { margin-bottom: 1.5rem; page-break-inside: avoid; }
    .acta-section h3 { color: #FF5E00; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; margin-bottom: 1rem; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .acta-row { display: grid; grid-template-columns: 220px 1fr; gap: 1rem; margin-bottom: 0.5rem; }
    .acta-label { font-weight: 600; color: #374151; font-size: 0.875rem; }
    .acta-value { color: #111827; }
    .acta-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; margin-top: 0.5rem; }
    .acta-table th { background: #f3f4f6; color: #374151; font-weight: 600; padding: 0.5rem; text-align: left; border-bottom: 2px solid #e5e7eb; }
    .acta-table td { padding: 0.5rem; border-bottom: 1px solid #f3f4f6; }
    .acta-table th:nth-child(1), .acta-table td:nth-child(1) { text-align: center; width: 40px; }
    .acta-table th:nth-child(6), .acta-table td:nth-child(6),
    .acta-table th:nth-child(7), .acta-table td:nth-child(7),
    .acta-table th:nth-child(8), .acta-table td:nth-child(8) { text-align: right; }
    .acta-evidencia { margin-top: 1rem; }
    .acta-evidencia h4 { font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .acta-signature { margin-top: 3rem; display: flex; gap: 4rem; justify-content: flex-end; }
    .acta-sig-block { text-align: center; min-width: 200px; }
    .acta-sig-line { border-top: 1px solid #374151; width: 200px; margin: 0 auto 0.5rem; height: 40px; }
    .acta-sig-block div { font-size: 0.8125rem; }
    .acta-footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #9ca3af; text-align: center; }
    .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge-abierta { background: #dbeafe; color: #1d4ed8; }
    .badge-en_proceso { background: #fef3c7; color: #b45309; }
    .badge-en_espera { background: #fef3c7; color: #b45309; }
    .badge-cerrada { background: #f3f4f6; color: #374151; }
    .badge-cancelada { background: #fee2e2; color: #b91c1c; }
    .badge-alta { background: #fee2e2; color: #b91c1c; }
    .badge-media { background: #fef3c7; color: #b45309; }
    .badge-baja { background: #dcfce7; color: #16a34a; }
    .badge-urgente { background: #fee2e2; color: #b91c1c; }
    @media print {
      .no-print { display: none !important; }
      .acta-print { padding: 0; max-width: none; }
      .acta-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="acta-print">
    <!-- Header -->
    <header class="acta-header">
      <div class="acta-brand">
        <div class="acta-brand-mark">N</div>
        <div class="acta-brand-text">NEON</div>
      </div>
      <div class="acta-meta">
        <div class="meta-row"><span class="meta-label">Acta Nº:</span> <span class="meta-value">${escapeHtml(orden.codigo)}</span></div>
        <div class="meta-row"><span class="meta-label">Fecha:</span> <span class="meta-value">${fechaActual}</span></div>
        <div class="meta-row"><span class="meta-label">Hora:</span> <span class="meta-value">${horaActual}</span></div>
        <div class="meta-row"><span class="meta-label">SLA:</span> <span class="meta-value">${slaInfo || '—'}</span></div>
      </div>
    </header>

    <!-- 1. Datos de la Orden -->
    <section class="acta-section">
      <h3>1. Datos de la Orden de Trabajo</h3>
      <div class="acta-row"><span class="acta-label">Código:</span> <span class="acta-value"><strong>${escapeHtml(orden.codigo)}</strong></span></div>
      <div class="acta-row"><span class="acta-label">Tipo:</span> <span class="acta-value"><span class="badge badge-${orden.tipo}">${formatearTipoOrden(orden.tipo)}</span></span></div>
      <div class="acta-row"><span class="acta-label">Prioridad:</span> <span class="acta-value"><span class="badge badge-${orden.prioridad}">${formatearPrioridad(orden.prioridad)}</span></span></div>
      <div class="acta-row"><span class="acta-label">Estado:</span> <span class="acta-value"><span class="badge badge-${orden.estado}">${formatearEstado(orden.estado)}</span></span></div>
      <div class="acta-row"><span class="acta-label">Fecha creación:</span> <span class="acta-value">${orden.fecha_creacion ? formatFecha(orden.fecha_creacion) : '—'}</span></div>
      <div class="acta-row"><span class="acta-label">Fecha cierre:</span> <span class="acta-value">${orden.fecha_cierre ? formatFecha(orden.fecha_cierre) : '—'}</span></div>
      <div class="acta-row"><span class="acta-label">Técnico asignado:</span> <span class="acta-value">${escapeHtml(orden.tecnico_nombre || '—')}</span></div>
      <div class="acta-row"><span class="acta-label">Solicitante:</span> <span class="acta-value">${escapeHtml(orden.cliente_nombre || '—')}</span></div>
    </section>

    <!-- 2. Activo Intervenido -->
    <section class="acta-section">
      <h3>2. Activo Intervenido</h3>
      ${activo ? `
      <div class="acta-row"><span class="acta-label">Código / Etiqueta:</span> <span class="acta-value">${escapeHtml(activo.codigo || activo.etiqueta || '—')}</span></div>
      <div class="acta-row"><span class="acta-label">Nombre:</span> <span class="acta-value">${escapeHtml(activo.nombre)}</span></div>
      <div class="acta-row"><span class="acta-label">Tipo:</span> <span class="acta-value">${formatearEstado(activo.tipo)}</span></div>
      <div class="acta-row"><span class="acta-label">Crítica:</span> <span class="acta-value"><span class="badge badge-${activo.criticidad}">${formatearEstado(activo.criticidad)}</span></span></div>
      <div class="acta-row"><span class="acta-label">Ubicación:</span> <span class="acta-value">${escapeHtml(activo.ubicacion || '—')}</span></div>
      <div class="acta-row"><span class="acta-label">Fabricante / Modelo:</span> <span class="acta-value">${escapeHtml((activo.fabricante || '') + ' ' + (activo.modelo || '')).trim() || '—'}</span></div>
      <div class="acta-row"><span class="acta-label">Nº Serie:</span> <span class="acta-value">${escapeHtml(activo.numero_serie || '—')}</span></div>
      ` : '<p style="color:#6b7280;">Información del activo no disponible.</p>'}
    </section>

    <!-- 3. Diagnóstico y Trabajo Realizado -->
    <section class="acta-section">
      <h3>3. Diagnóstico y Trabajo Realizado</h3>
      <div class="acta-row"><span class="acta-label">Diagnóstico:</span></div>
      <div style="margin-left: 220px; margin-bottom: 1rem; white-space: pre-wrap; background:#f9fafb; padding:1rem; border-radius:8px; border:1px solid #e5e7eb;">${escapeHtml(orden.diagnostico || orden.descripcion || 'Sin diagnóstico registrado.')}</div>
      <div class="acta-row"><span class="acta-label">Trabajo realizado:</span></div>
      <div style="margin-left: 220px; white-space: pre-wrap; background:#f9fafb; padding:1rem; border-radius:8px; border:1px solid #e5e7eb;">${escapeHtml(orden.trabajo_realizado || 'Trabajo completado según procedimiento estándar.')}</div>
    </section>

    <!-- 4. Repuestos Consumidos -->
    <section class="acta-section">
      <h3>4. Repuestos y Materiales Consumidos</h3>
      <table class="acta-table">
        <thead>
          <tr>
            <th>#</th>
            <th>SKU / Código</th>
            <th>Descripción</th>
            <th>Tipo</th>
            <th>Unidad</th>
            <th>Cant.</th>
            <th>P. Unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${repuestosRows}
        </tbody>
      </table>
      <div style="display:flex; justify-content:flex-end; margin-top:1rem; font-size:0.9375rem;">
        <div style="background:#f3f4f6; padding:0.75rem 1.5rem; border-radius:8px; border:1px solid #e5e7eb;">
          <strong>Total Repuestos: ${formatMoneda(totalRepuestos)}</strong>
        </div>
      </div>
    </section>

    <!-- 5. Evidencia Fotográfica -->
    ${evidenciaHtml ? `<section class="acta-section">${evidenciaHtml}</section>` : ''}

    <!-- 6. Firma -->
    <section class="acta-section">
      <h3>5. Firma y Conformidad</h3>
      <div class="acta-signature">
        <div class="acta-sig-block">
          <div class="acta-sig-line"></div>
          <div><strong>Técnico Responsable</strong></div>
          <div style="font-size:0.875rem; color:#6b7280;">${escapeHtml(tecnicoNombre)}</div>
          <div style="font-size:0.75rem; color:#9ca3af; margin-top:0.25rem;">${escapeHtml(tecnicoEspecialidad || 'Técnico de Mantenimiento')}</div>
        </div>
        <div class="acta-sig-block">
          <div class="acta-sig-line"></div>
          <div><strong>Supervisor / Cliente</strong></div>
          <div style="font-size:0.875rem; color:#6b7280;">________________________</div>
          <div style="font-size:0.75rem; color:#9ca3af; margin-top:0.25rem;">Firma y sello</div>
        </div>
      </div>
      ${firmaBase64 ? `
      <div style="margin-top:1.5rem; text-align:center;">
        <p style="font-size:0.75rem; color:#6b7280; margin-bottom:0.5rem;">Firma digital registrada:</p>
        <img src="data:image/png;base64,${firmaBase64}" alt="Firma digital" style="max-width:300px; max-height:100px; border:1px solid #d1d5db; border-radius:4px; background:#f9fafb;" />
      </div>
      ` : ''}
    </section>

    <!-- Footer -->
    <footer class="acta-footer">
      <p>Acta generada automáticamente por <strong>NEON</strong> — Sistema de Gestión de Mantenimiento Empresarial</p>
      <p>Fecha de generación: ${fechaActual} ${horaActual} | Orden: ${escapeHtml(orden.codigo)} | Documento oficial sin validez legal sin firma física.</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Abre el acta en una ventana nueva para imprimir / guardar como PDF.
 * @param {Object} params - Mismos parámetros que generarActaHTML
 */
export function abrirActaParaImprimir(params) {
  const html = generarActaHTML(params);
  const ventana = window.open('', '_blank', 'width=1000,height=800');
  if (!ventana) {
    alert('Por favor, permita ventanas emergentes para generar el acta.');
    return;
  }
  ventana.document.write(html);
  ventana.document.close();
  // Dar tiempo a que se renderice antes de imprimir
  setTimeout(() => {
    ventana.focus();
    ventana.print();
  }, 300);
}

export default { generarActaHTML, abrirActaParaImprimir };