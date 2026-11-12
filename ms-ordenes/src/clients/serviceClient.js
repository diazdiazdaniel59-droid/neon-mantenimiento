'use strict';

// =============================================================================
// NEON :: ms-ordenes - Cliente HTTP para integraciones síncronas con otros microservicios
// Usa fetch nativo (Node 18+) con timeouts y reintentos básicos.
// =============================================================================

const { config } = require('../config');
const { logger } = require('../utils/logger');

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;

function getServiceBaseUrl(service) {
  const urls = {
    activos: config.services?.activos || process.env.ACTIVOS_SERVICE_URL || 'http://localhost:3002',
    inventario: config.services?.inventario || process.env.INVENTARIO_SERVICE_URL || 'http://localhost:3004',
    usuarios: config.services?.usuarios || process.env.USUARIOS_SERVICE_URL || 'http://localhost:3001',
  };
  return urls[service];
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (retries > 0 && (err.name === 'AbortError' || err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED'))) {
      logger.warn(`Reintentando llamada a ${url} (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`, { error: err.message });
      await new Promise(r => setTimeout(r, 500 * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(url, options, retries - 1);
    }

    throw err;
  }
}

// --- ms-activos ---

async function getActivoById(activoId, authHeaders = {}) {
  const baseUrl = getServiceBaseUrl('activos');
  const url = `${baseUrl}/activos/${activoId}`;
  return fetchWithRetry(url, { method: 'GET', headers: authHeaders });
}

async function updateActivoEstado(activoId, estado, authHeaders = {}) {
  const baseUrl = getServiceBaseUrl('activos');
  const url = `${baseUrl}/activos/${activoId}/estado`;
  return fetchWithRetry(url, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ estado }),
  });
}

// --- ms-inventario ---

async function descontarInventario({ repuestoId, cantidad, ordenId }, authHeaders = {}) {
  const baseUrl = getServiceBaseUrl('inventario');
  const url = `${baseUrl}/inventario/descontar`;
  return fetchWithRetry(url, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ repuestoId, cantidad, ordenId }),
  });
}

// --- ms-usuarios ---

async function getTecnicoById(tecnicoId, authHeaders = {}) {
  const baseUrl = getServiceBaseUrl('usuarios');
  const url = `${baseUrl}/usuarios/${tecnicoId}`;
  return fetchWithRetry(url, { method: 'GET', headers: authHeaders });
}

async function listTecnicos(authHeaders = {}) {
  const baseUrl = getServiceBaseUrl('usuarios');
  const url = `${baseUrl}/usuarios/tecnicos`;
  return fetchWithRetry(url, { method: 'GET', headers: authHeaders });
}

module.exports = {
  getActivoById,
  updateActivoEstado,
  descontarInventario,
  getTecnicoById,
  listTecnicos,
};