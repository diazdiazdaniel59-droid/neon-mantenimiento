import { useCallback, useMemo, useState } from 'react';
import { usuariosApi } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Badge, ErrorBanner, Field, Modal, PageHeader, Spinner } from '../components/ui.jsx';
import { GlassConfirmModal } from '../components/GlassConfirmModal.jsx';
import { ROLES } from '../lib/catalogos.js';
import { formatFechaHora, labelEnum } from '../lib/format.js';

const USUARIO_VACIO = { nombre: '', email: '', password: '', rol: 'tecnico' };

export default function UsuariosPage() {
  const { isAdmin } = useAuth();
  const [filtros, setFiltros] = useState({ search: '', rol: '' });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(USUARIO_VACIO);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const query = useMemo(
    () => ({ search: filtros.search, rol: filtros.rol, limit: 100 }),
    [filtros.search, filtros.rol]
  );
  const fetcher = useCallback(() => usuariosApi.list(query), [query]);
  const { data, loading, error: errorLista, reload } = useResource(fetcher);

  const abrir = () => {
    setForm(USUARIO_VACIO);
    setError(null);
    setModal(true);
  };

  const crear = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await usuariosApi.create({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: form.rol,
      });
      setModal(false);
      await reload();
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarRol = async (usuario, rol) => {
    try {
      await usuariosApi.update(usuario.id, { rol });
      await reload();
    } catch (err) {
      setError(err);
    }
  };

  const alternarActivo = async (usuario) => {
    try {
      await usuariosApi.update(usuario.id, { activo: !usuario.activo });
      await reload();
    } catch (err) {
      setError(err);
    }
  };

  const eliminar = (usuario) => {
    setConfirmTarget(usuario);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    await usuariosApi.remove(confirmTarget.id);
    await reload();
    setConfirmOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de cuentas y roles"
        actions={
          isAdmin ? (
            <button type="button" className="btn btn-primary" onClick={abrir}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo usuario
            </button>
          ) : null
        }
      />

      {/* Toolbar de filtros */}
      <div className="toolbar stagger-item" style={{'--staggerIndex': 0}}>
        <input
          className="input"
          placeholder="Buscar por nombre o correo…"
          value={filtros.search}
          onChange={(e) => setFiltros((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="input"
          value={filtros.rol}
          onChange={(e) => setFiltros((f) => ({ ...f, rol: e.target.value }))}
          style={{minWidth: '160px'}}
        >
          <option value="">Todos los roles</option>
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>
              {labelEnum(rol)}
            </option>
          ))}
        </select>
      </div>

      <ErrorBanner error={errorLista || (modal ? null : error)} />

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Stats KPIs en Bento Grid */}
          <div className="bento-grid" role="region" aria-label="Estadísticas de usuarios">
            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 1}}>
              <div className="card-head">
                <h3 className="card-title">Total Usuarios</h3>
                <span className="card-badge">{data?.total || 0}</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.length || 0}</p>
                <p className="kpi-label">Mostrando {data?.items?.length || 0} de {data?.total || 0}</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 2}}>
              <div className="card-head">
                <h3 className="card-title">Activos</h3>
                <span className="badge badge-activo">ACTIVO</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.filter(u => u.activo).length || 0}</p>
                <p className="kpi-label">Cuentas habilitadas</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 3}}>
              <div className="card-head">
                <h3 className="card-title">Inactivos</h3>
                <span className="badge badge-inactivo">INACTIVO</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.filter(u => !u.activo).length || 0}</p>
                <p className="kpi-label">Cuentas deshabilitadas</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 4}}>
              <div className="card-head">
                <h3 className="card-title">Administradores</h3>
                <span className="badge badge-rol">ADMIN</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.filter(u => u.rol === 'admin').length || 0}</p>
                <p className="kpi-label">Con rol admin</p>
              </div>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="bento-grid" role="region" aria-label="Listado de usuarios">
            <div className="bento-card wide spotlight-card stagger-item" style={{'--staggerIndex': 5}}>
              <div className="card-head">
                <h3 className="card-title">Listado de Usuarios</h3>
              </div>
              <div className="card-body">
                {!data || data.items.length === 0 ? (
                  <p className="muted" style={{padding: '2rem', textAlign: 'center'}}>No hay usuarios que coincidan con el filtro.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Correo</th>
                          <th>Rol</th>
                          <th>Estado</th>
                          <th>Alta</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((usuario, idx) => (
                          <tr key={usuario.id} className="stagger-item" style={{'--staggerIndex': idx}}>
                            <td>{usuario.nombre}</td>
                            <td>{usuario.email}</td>
                            <td>
                              {isAdmin ? (
                                <select
                                  className="input input-sm"
                                  value={usuario.rol}
                                  onChange={(e) => cambiarRol(usuario, e.target.value)}
                                >
                                  {ROLES.map((rol) => (
                                    <option key={rol} value={rol}>
                                      {labelEnum(rol)}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Badge value={usuario.rol} tone="rol" />
                              )}
                            </td>
                            <td>
                              <Badge value={usuario.activo ? 'activo' : 'inactivo'} tone={usuario.activo ? '' : 'muted'} />
                            </td>
                            <td>{formatFechaHora(usuario.created_at)}</td>
                            <td className="row-actions">
                              {isAdmin && (
                                <>
                                  <button type="button" className="btn btn-ghost" onClick={() => alternarActivo(usuario)}>
                                    {usuario.activo ? 'Desactivar' : 'Activar'}
                                  </button>
                                  <button type="button" className="btn btn-ghost danger" onClick={() => eliminar(usuario)}>
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {modal && (
        <Modal title="Nuevo usuario" onClose={() => setModal(false)}>
          <ErrorBanner error={error} onClose={() => setError(null)} />
          <form className="form" onSubmit={crear}>
            <Field label="Nombre">
              <input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                minLength={2}
                required
              />
            </Field>
            <Field label="Correo electrónico">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </Field>
            <Field label="Rol">
              <select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>
                {ROLES.map((rol) => (
                  <option key={rol} value={rol}>
                    {labelEnum(rol)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <GlassConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar usuario"
        message={`¿Eliminar el usuario "${confirmTarget?.email}"?`}
        identifier={confirmTarget?.email}
        type="danger"
      />
    </>
  );
}