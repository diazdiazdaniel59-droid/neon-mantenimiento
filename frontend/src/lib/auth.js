// =============================================================================
// NEON :: frontend - Utilidades de sesion/JWT (funciones puras, testables)
// El token se decodifica SOLO para leer sus claims (rol/email) en la UI; la
// verificacion real de la firma la hace el API Gateway y cada microservicio.
// =============================================================================

function base64UrlDecode(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  if (typeof atob === 'function') return atob(padded);
  return globalThis.Buffer.from(padded, 'base64').toString('binary');
}

export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = decodeURIComponent(
      base64UrlDecode(parts[1])
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// El claim `exp` es segundos desde epoch. Margen por defecto: 10s.
export function isTokenExpired(payload, margenSegundos = 10) {
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 <= Date.now() + margenSegundos * 1000;
}

export function usuarioDesdeToken(token) {
  const payload = decodeToken(token);
  if (!payload || isTokenExpired(payload)) return null;
  return { id: payload.sub, email: payload.email, rol: payload.rol };
}
