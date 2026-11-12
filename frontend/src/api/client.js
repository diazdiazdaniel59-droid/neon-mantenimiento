// =============================================================================
// NEON :: frontend - Cliente HTTP hacia el API Gateway (punto unico de entrada)
// El JWT se adjunta como Bearer en cada peticion autenticada.
// =============================================================================

const BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

let tokenGetter = () => null;
export function setTokenGetter(fn) {
  tokenGetter = fn;
}

function buildUrl(path, query) {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function request(path, { method = 'GET', body, query, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = tokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const mensaje = (data && data.error && data.error.message) || `Error ${res.status}`;
    const error = new Error(mensaje);
    error.status = res.status;
    error.details = data && data.error ? data.error.details : undefined;
    throw error;
  }

  return data;
}

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (nombre, email, password) =>
    request('/auth/register', { method: 'POST', body: { nombre, email, password }, auth: false }),
  me: () => request('/auth/me'),
};

export const usuariosApi = {
  list: (query) => request('/usuarios', { query }),
  get: (id) => request(`/usuarios/${id}`),
  create: (body) => request('/usuarios', { method: 'POST', body }),
  update: (id, body) => request(`/usuarios/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
};

export const activosApi = {
  list: (query) => request('/activos', { query }),
  get: (id) => request(`/activos/${id}`),
  create: (body) => request('/activos', { method: 'POST', body }),
  update: (id, body) => request(`/activos/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/activos/${id}`, { method: 'DELETE' }),
};

export const ordenesApi = {
  list: (query) => request('/ordenes', { query }),
  misOrdenes: (query) => request('/ordenes/mis-ordenes', { query }),
  get: (id) => request(`/ordenes/${id}`),
  create: (body) => request('/ordenes', { method: 'POST', body }),
  update: (id, body) => request(`/ordenes/${id}`, { method: 'PATCH', body }),
  iniciar: (id) => request(`/ordenes/${id}`, { method: 'PATCH', body: { estado: 'en_proceso' } }),
  cerrar: (id, solucion) => request(`/ordenes/${id}`, { method: 'PATCH', body: { estado: 'cerrada', descripcion: solucion } }),
  agregarRepuestoConsumido: (id, body) => request(`/ordenes/${id}/repuestos`, { method: 'POST', body }),
  remove: (id) => request(`/ordenes/${id}`, { method: 'DELETE' }),
};

export const inventarioApi = {
  repuestos: (query) => request('/inventario/catalogo', { query }),
  getRepuesto: (id) => request(`/inventario/${id}`),
  crearRepuesto: (body) => request('/inventario', { method: 'POST', body }),
  actualizarRepuesto: (id, body) => request(`/inventario/${id}`, { method: 'PATCH', body }),
  eliminarRepuesto: (id) => request(`/inventario/${id}`, { method: 'DELETE' }),
  movimientos: (id, query) => request(`/inventario/${id}/movimientos`, { query }),
  crearMovimiento: (id, body) => request(`/inventario/${id}/stock`, { method: 'POST', body }),
  movimientosGlobal: (query) => request('/inventario', { query }),
};

export const notificacionesApi = {
  list: (query) => request('/notificaciones', { query }),
};
