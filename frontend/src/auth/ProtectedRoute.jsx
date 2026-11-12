import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Protege rutas: exige sesion valida y, opcionalmente, roles concretos.
export function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="center muted">Cargando…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && roles.length && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}
