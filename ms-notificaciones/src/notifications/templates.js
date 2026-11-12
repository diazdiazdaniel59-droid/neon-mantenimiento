'use strict';

// =============================================================================
// NEON :: ms-notificaciones - Plantillas de mensajes (funciones puras)
// Traducen un evento de dominio (RabbitMQ) a una notificacion lista para enviar.
// =============================================================================

function line(label, value) {
  return value === undefined || value === null || value === '' ? null : `${label}: ${value}`;
}

function compose(lines) {
  return lines.filter(Boolean).join('\n');
}

function buildNotification(event = {}) {
  const titulo = event.titulo || event.descripcion || '(sin titulo)';
  const base = [
    line('Orden', event.ordenId),
    line('Cliente', event.clienteId),
    line('Activo', event.activoId),
    line('Titulo', event.titulo || event.descripcion),
    line('Tipo', event.tipo),
    line('Prioridad', event.prioridad),
  ];

  switch (event.event) {
    case 'orden.creada':
      return {
        event: event.event,
        subject: `[NEON] Nueva orden creada: ${titulo}`,
        text: compose([
          'Se registro una nueva orden de mantenimiento.',
          '',
          ...base,
          line('Estado', event.estado),
          line('Programada', event.fechaProgramada),
          line('Tecnico', event.tecnicoEmail),
        ]),
      };

    case 'orden.cerrada':
      return {
        event: event.event,
        subject: `[NEON] Orden cerrada: ${titulo}`,
        text: compose([
          'Una orden de mantenimiento fue cerrada.',
          '',
          ...base,
          line('Estado', event.estado),
          line('Fecha de cierre', event.fechaCierre),
          line('Solucion', event.solucion),
        ]),
      };

    case 'orden.cancelada':
      return {
        event: event.event,
        subject: `[NEON] Orden cancelada: ${titulo}`,
        text: compose([
          'Una orden de mantenimiento fue cancelada.',
          '',
          ...base,
          line('Estado', event.estado),
          line('Fecha de cierre', event.fechaCierre),
          line('Cancelada por', event.canceladoPor),
        ]),
      };

    default:
      return {
        event: event.event || 'desconocido',
        subject: `[NEON] Evento de orden: ${event.event || 'desconocido'}`,
        text: compose(['Evento de orden recibido.', '', JSON.stringify(event, null, 2)]),
      };
  }
}

module.exports = { buildNotification };
