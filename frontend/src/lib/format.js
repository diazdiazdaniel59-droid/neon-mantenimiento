// =============================================================================
// NEON :: frontend - Utilidades de formato (funciones puras, testables)
// =============================================================================

export function formatFecha(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES');
}

export function formatFechaHora(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES');
}

export function formatMoneda(value) {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });
}

export function labelEnum(value) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
