import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute.jsx';
import { Layout } from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OrdenesPage from './pages/OrdenesPage.jsx';
import OrdenDetallePage from './pages/OrdenDetallePage.jsx';
import ActivosPage from './pages/ActivosPage.jsx';
import InventarioPage from './pages/InventarioPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';
import TecnicoPerfil from './pages/TecnicoPerfil.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="ordenes" element={<OrdenesPage />} />
        <Route path="ordenes/:id" element={<OrdenDetallePage />} />
        <Route path="activos" element={<ActivosPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route
          path="usuarios"
          element={
            <ProtectedRoute roles={['admin', 'supervisor']}>
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route path="tecnico/perfil" element={<TecnicoPerfil />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
