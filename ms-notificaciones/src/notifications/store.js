'use strict';

/**
 * NEON :: ms-notificaciones - Almacén en memoria de notificaciones (últimas 50)
 * No persiste en BD: solo para visualización en tiempo real durante la sustentación.
 */

const MAX_NOTIFICATIONS = 50;
const notifications = [];

function add(notification) {
  const entry = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...notification,
  };
  notifications.unshift(entry);
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications.pop();
  }
  return entry;
}

function getAll() {
  return [...notifications];
}

function clear() {
  notifications.length = 0;
}

module.exports = { add, getAll, clear, MAX_NOTIFICATIONS };