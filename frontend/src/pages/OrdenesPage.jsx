import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordenesApi } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Badge, ErrorBanner, Field, Modal, PageHeader, Spinner } from '../components/ui.jsx';
import { ESTADOS_ORDEN, PRIORIDADES, TIPOS_ORDEN } from '../lib/catalogos.js';
import { formatFecha, labelEnum } from '../lib/format.js';

const FORM_INICIAL = {
  activo_id: '',
  activo_nombre: '',
  titulo: '',
  descripcion: '',
  tipo: 'correctivo',
  prioridad: 'media',
};

export default function OrdenesPage() {
  const { canManage, isTecnico } = useAuth();
  const [filtros, setFiltros] = useState({ estado: '', search: '' });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const query = useMemo(
    () => ({ estado: filtros.estado, search: filtros.search, limit: 100 }),
    [filtros.estado, filtros.search]
  );
  const fetcher = useCallback(() =>
    isTecnico ? ordenesApi.misOrdenes(query) : ordenesApi.list(query)
  , [query, isTecnico]);
  const { data, loading, error: errorLista, reload } = useResource(fetcher);

  const abrir = () => {
    setForm(FORM_INICIAL);
    setError(null);
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await ordenesApi.create({
        activo_id: form.activo_id.trim(),
        activo_nombre: form.activo_nombre.trim() || undefined,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        tipo: form.tipo,
        prioridad: form.prioridad,
      });
      setModal(false);
      await reload();
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Órdenes de Mantenimiento"
        subtitle="Creación y seguimiento de órdenes"
        actions={
          (canManage || isTecnico) ? (
            <button type="button" className="btn btn-primary" onClick={abrir}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva orden
            </button>
          ) : null
        }
      />

      {/* Toolbar de filtros */}
      <div className="toolbar stagger-item" style={{'--staggerIndex': 0}}>
        <input
          className="input"
          placeholder="Buscar por título o activo…"
          value={filtros.search}
          onChange={(e) => setFiltros((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="input"
          value={filtros.estado}
          onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
          style={{minWidth: '180px'}}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_ORDEN.map((estado) => (
            <option key={estado} value={estado}>
              {labelEnum(estado)}
            </option>
          ))}
        </select>
      </div>

      <ErrorBanner error={errorLista} />

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Stats KPIs en Bento Grid */}
          <div className="bento-grid" role="region" aria-label="Estadísticas de órdenes">
            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 1}}>
              <div className="card-head">
                <h3 className="card-title">Total Órdenes</h3>
                <span className="card-badge">{data?.total || 0}</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.length || 0}</p>
                <p className="kpi-label">Mostrando {data?.items?.length || 0} de {data?.total || 0}</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 2}}>
              <div className="card-head">
                <h3 className="card-title">Abiertas</h3>
                <span className="badge badge-abierta">ABIERTA</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.filter(o => o.estado === 'abierta').length || 0}</p>
                <p className="kpi-label">Pendientes de asignación</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 3}}>
              <div className="card-head">
                <h3 className="card-title">En Proceso</h3>
                <span className="badge badge-en_proceso">EN_PROCESO</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.filter(o => o.estado === 'en_proceso').length || 0}</p>
                <p className="kpi-label">En ejecución</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 4}}>
              <div className="card-head">
                <h3 className="card-title">Urgentes (ALTA)</h3>
                <span className="badge badge-alta">ALTA</span>
              </div>
              <div className="card-body">
                <p className="kpi-value" style={{color: '#ff6b6b'}}>{data?.items?.filter(o => o.prioridad === 'alta' && o.estado !== 'cerrada' && o.estado !== 'cancelada').length || 0}</p>
                <p className="kpi-label">SLA crítico</p>
              </div>
            </div>
          </div>

          {/* Tabla de órdenes */}
          <div className="bento-grid" role="region" aria-label="Listado de órdenes">
            <div className="bento-card wide spotlight-card stagger-item" style={{'--staggerIndex': 5}}>
              <div className="card-head">
                <h3 className="card-title">Listado de Órdenes</h3>
              </div>
              <div className="card-body">
                {!data || data.items.length === 0 ? (
                  <p className="muted" style={{padding: '2rem', textAlign: 'center'}}>No hay órdenes que coincidan con el filtro.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Activo</th>
                          <th>Tipo</th>
                          <th>Prioridad</th>
                          <th>Estado</th>
                          <th>Creación</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((orden, idx) => (
                          <tr key={orden.id} className="stagger-item" style={{'--staggerIndex': idx}}>
                            <td>{orden.titulo}</td>
                            <td>{orden.activo_nombre || orden.activo_id}</td>
                            <td>{labelEnum(orden.tipo)}</td>
                            <td>{labelEnum(orden.prioridad)}</td>
                            <td>
                              <Badge value={orden.estado} />
                            </td>
                            <td>{formatFecha(orden.created_at)}</td>
                            <td>
                              <Link className="btn btn-ghost" to={`/ordenes/${orden.id}`}>
                                Ver
                              </Link>
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
        <Modal title="Nueva orden de mantenimiento" onClose={() => setModal(false)}>
          <ErrorBanner error={error} onClose={() => setError(null)} />
          <form className="form" onSubmit={guardar}>
            <Field label="ID del activo" hint="Código o identificador del activo (ej. ACT-001)">
              <input
                value={form.activo_id}
                onChange={(e) => setForm((f) => ({ ...f, activo_id: e.target.value }))}
                required
              />
            </Field>
            <Field label="Nombre del activo">
              <input
                value={form.activo_nombre}
                onChange={(e) => setForm((f) => ({ ...f, activo_nombre: e.target.value }))}
              />
            </Field>
            <Field label="Título">
              <input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                minLength={3}
                required
              />
            </Field>
            <Field label="Descripción">
              <textarea
                rows={3}
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </Field>
            <div className="grid-2">
              <Field label="Tipo">
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                >
                  {TIPOS_ORDEN.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {labelEnum(tipo)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prioridad">
                <select
                  value={form.prioridad}
                  onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
                >
                  {PRIORIDADES.map((p) => (
                    <option key={p} value={p}>
                      {labelEnum(p)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Crear orden'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}