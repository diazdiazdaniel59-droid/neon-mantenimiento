'use strict';

// =============================================================================
// NEON :: ms-ordenes - Constructor de eventos de dominio (funciones puras).
// Los eventos se publican al exchange topic `neon_events` con routing keys
// `orden.creada`, `orden.cerrada`, `orden.cancelada` y `repuesto.asignado`
// (consumidos por ms-notificaciones).
// =============================================================================

const ROUTING_KEYS = {
  creada: 'orden.creada',
  repuestoAsignado: 'repuesto.asignado',
  cerrada: 'orden.cerrada',
  cancelada: 'orden.cancelada',
};

function base(orden) {
  return {
    ordenId: orden.id,
    clienteId: orden.cliente_id,
    titulo: orden.descripcion,
    descripcion: orden.descripcion,
    tipo: orden.tipo,
    prioridad: orden.prioridad,
    estado: orden.estado,
  };
}

function ordenCreada(orden) {
  return {
    routingKey: ROUTING_KEYS.creada,
    payload: {
      event: ROUTING_KEYS.creada,
      ...base(orden),
      tecnicoId: orden.tecnico_id || null,
      fechaCreacion: orden.fecha_solicitud || orden.created_at,
    },
  };
}

function repuestoAsignado(orden, repuesto) {
  return {
    routingKey: ROUTING_KEYS.repuestoAsignado,
    payload: {
      event: ROUTING_KEYS.repuestoAsignado,
      ...base(orden),
      repuestoId: repuesto.repuesto_id,
      cantidad: repuesto.cantidad,
      nota: repuesto.nota || null,
      fechaAsignacion: repuesto.created_at,
    },
  };
}

function ordenCerrada(orden) {
  return {
    routingKey: ROUTING_KEYS.cerrada,
    payload: {
      event: ROUTING_KEYS.cerrada,
      ...base(orden),
      tecnicoId: orden.tecnico_id || null,
      solucion: orden.descripcion || null,
      fechaCierre: orden.fecha_cierre,
    },
  };
}

function ordenCancelada(orden, canceladoPor) {
  return {
    routingKey: ROUTING_KEYS.cancelada,
    payload: {
      event: ROUTING_KEYS.cancelada,
      ...base(orden),
      canceladoPor: canceladoPor || null,
      fechaCierre: orden.fecha_cierre,
    },
  };
}

module.exports = {
  ROUTING_KEYS,
  ordenCreada,
  repuestoAsignado,
  ordenCerrada,
  ordenCancelada,
};
