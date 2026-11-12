// =============================================================================
// NEON :: frontend - Catalogos compartidos (deben coincidir con los backends)
// =============================================================================

export const ROLES = ['admin', 'supervisor', 'tecnico'];

export const TIPOS_ACTIVO = ['maquinaria', 'equipo', 'instalacion', 'vehiculo', 'herramienta', 'otro'];
export const CRITICIDADES = ['alta', 'media', 'baja'];
export const ESTADOS_ACTIVO = ['operativo', 'en_mantenimiento', 'fuera_servicio', 'baja'];

export const TIPOS_ORDEN = ['preventivo', 'correctivo', 'predictivo', 'mejora'];
export const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'];
export const ESTADOS_ORDEN = ['abierta', 'en_proceso', 'en_espera', 'cerrada', 'cancelada'];
export const ESTADOS_ORDEN_ABIERTOS = ['abierta', 'en_proceso', 'en_espera'];

export const TIPOS_ITEM = ['repuesto', 'herramienta', 'insumo', 'servicio'];
export const UNIDADES = ['pieza', 'litro', 'metro', 'kg', 'caja', 'rollo', 'juego'];
export const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'ajuste'];
