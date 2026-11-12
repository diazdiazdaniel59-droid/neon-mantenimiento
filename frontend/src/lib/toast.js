// =============================================================================
// NEON :: frontend - Sistema de notificaciones Toast (flotantes, esquina superior derecha)
// =============================================================================

let listeners = [];
let idCounter = 0;

export function toast({ title, message, type = 'info', duration = 3000 }) {
  const id = ++idCounter;
  const entry = { id, title, message, type };
  listeners.forEach((fn) => fn({ type: 'add', entry }));
  if (duration > 0) {
    setTimeout(() => {
      listeners.forEach((fn) => fn({ type: 'remove', id }));
    }, duration);
  }
  return id;
}

export function dismiss(id) {
  listeners.forEach((fn) => fn({ type: 'remove', id }));
}

export function onToastChange(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
