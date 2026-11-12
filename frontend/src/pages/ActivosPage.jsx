import { useCallback, useMemo, useState } from 'react';
import { activosApi } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Badge, ErrorBanner, Field, Modal, PageHeader, Spinner } from '../components/ui.jsx';
import { GlassConfirmModal } from '../components/GlassConfirmModal.jsx';
import { CRITICIDADES, ESTADOS_ACTIVO, TIPOS_ACTIVO } from '../lib/catalogos.js';
import { labelEnum } from '../lib/format.js';

const FORM_VACIO = {
  codigo: '',
  nombre: '',
  tipo: 'equipo',
  marca: '',
  modelo: '',
  numero_serie: '',
  ubicacion: '',
  criticidad: 'media',
  estado: 'operativo',
  notas: '',
};

export default function ActivosPage() {
  const { isAdmin, canManage } = useAuth();
  const [filtros, setFiltros] = useState({ search: '', tipo: '', estado: '' });
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const query = useMemo(
    () => ({ search: filtros.search, tipo: filtros.tipo, estado: filtros.estado, limit: 100 }),
    [filtros.search, filtros.tipo, filtros.estado]
  );
  const fetcher = useCallback(() => activosApi.list(query), [query]);
  const { data, loading, error: errorLista, reload } = useResource(fetcher);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError(null);
    setModal(true);
  };

  const abrirEditar = (activo) => {
    setEditando(activo);
    setForm({ ...FORM_VACIO, ...activo });
    setError(null);
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const cuerpo = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      marca: form.marca.trim() || undefined,
      modelo: form.modelo.trim() || undefined,
      numero_serie: form.numero_serie.trim() || undefined,
      ubicacion: form.ubicacion.trim() || undefined,
      criticidad: form.criticidad,
      estado: form.estado,
      notas: form.notas.trim() || undefined,
    };
    try {
      if (editando) await activosApi.update(editando.id, cuerpo);
      else await activosApi.create(cuerpo);
      setModal(false);
      await reload();
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (activo) => {
    setConfirmTarget(activo);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    await activosApi.remove(confirmTarget.id);
    await reload();
    setConfirmOpen(false);
  };

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  return (
    <>
      <PageHeader
        title="Activos"
        subtitle="Catálogo de equipos, maquinaria e instalaciones"
        actions={
          canManage ? (
            <button type="button" className="btn btn-primary" onClick={abrirCrear}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo activo
            </button>
          ) : null
        }
      />

      {/* Toolbar de filtros */}
      <div className="toolbar stagger-item" style={{'--staggerIndex': 0}}>
        <input
          className="input"
          placeholder="Buscar por nombre o código…"
          value={filtros.search}
          onChange={(e) => setFiltros((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="input"
          value={filtros.tipo}
          onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
          style={{minWidth: '160px'}}
        >
          <option value="">Todos los tipos</option>
          {TIPOS_ACTIVO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {labelEnum(tipo)}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filtros.estado}
          onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
          style={{minWidth: '160px'}}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_ACTIVO.map((estado) => (
            <option key={estado} value={estado}>
              {labelEnum(estado)}
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
          <div className="bento-grid" role="region" aria-label="Estadísticas de activos">
            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 1}}>
              <div className="card-head">
                <h3 className="card-title">Total Activos</h3>
                <span className="card-badge">{data?.total || 0}</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.length || 0}</p>
                <p className="kpi-label">Mostrando {data?.items?.length || 0} de {data?.total || 0}</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 2}}>
              <div className="card-head">
                <h3 className="card-title">Operativos</h3>
                <span className="badge badge-operativo">OPERATIVO</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.filter(a => a.estado === 'operativo').length || 0}</p>
                <p className="kpi-label">En funcionamiento</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 3}}>
              <div className="card-head">
                <h3 className="card-title">En Mantenimiento</h3>
                <span className="badge badge-en_mantenimiento">EN_MANTENIMIENTO</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.filter(a => a.estado === 'en_mantenimiento').length || 0}</p>
                <p className="kpi-label">Requieren atención</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 4}}>
              <div className="card-head">
                <h3 className="card-title">Críticos</h3>
                <span className="badge" style={{background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)'}}>ALTA</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.filter(a => a.criticidad === 'alta').length || 0}</p>
                <p className="kpi-label">Criticidad alta</p>
              </div>
            </div>
          </div>

          {/* Tabla de activos */}
          <div className="bento-grid" role="region" aria-label="Listado de activos">
            <div className="bento-card wide spotlight-card stagger-item" style={{'--staggerIndex': 5}}>
              <div className="card-head">
                <h3 className="card-title">Listado de Activos</h3>
              </div>
              <div className="card-body">
                {!data || data.items.length === 0 ? (
                  <p className="muted" style={{padding: '2rem', textAlign: 'center'}}>No hay activos que coincidan con el filtro.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Tipo</th>
                          <th>Criticidad</th>
                          <th>Estado</th>
                          <th>Ubicación</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((activo, idx) => (
                          <tr key={activo.id} className="stagger-item" style={{'--staggerIndex': idx}}>
                            <td>{activo.codigo}</td>
                            <td>{activo.nombre}</td>
                            <td>{labelEnum(activo.tipo)}</td>
                            <td>{labelEnum(activo.criticidad)}</td>
                            <td>
                              <Badge value={activo.estado} />
                            </td>
                            <td>{activo.ubicacion || '—'}</td>
                            <td className="row-actions">
                              {canManage && (
                                <button type="button" className="btn btn-ghost" onClick={() => abrirEditar(activo)}>
                                  Editar
                                </button>
                              )}
                              {isAdmin && (
                                <button type="button" className="btn btn-ghost danger" onClick={() => eliminar(activo)}>
                                  Eliminar
                                </button>
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
        <Modal title={editando ? 'Editar activo' : 'Nuevo activo'} onClose={() => setModal(false)}>
          <ErrorBanner error={error} onClose={() => setError(null)} />
          <form className="form" onSubmit={guardar}>
            <div className="grid-2">
              <Field label="Código">
                <input value={form.codigo} onChange={set('codigo')} minLength={2} required />
              </Field>
              <Field label="Nombre">
                <input value={form.nombre} onChange={set('nombre')} minLength={2} required />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Tipo">
                <select value={form.tipo} onChange={set('tipo')}>
                  {TIPOS_ACTIVO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {labelEnum(tipo)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Criticidad">
                <select value={form.criticidad} onChange={set('criticidad')}>
                  {CRITICIDADES.map((c) => (
                    <option key={c} value={c}>
                      {labelEnum(c)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Marca">
                <input value={form.marca} onChange={set('marca')} />
              </Field>
              <Field label="Modelo">
                <input value={form.modelo} onChange={set('modelo')} />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Número de serie">
                <input value={form.numero_serie} onChange={set('numero_serie')} />
              </Field>
              <Field label="Ubicación">
                <input value={form.ubicacion} onChange={set('ubicacion')} />
              </Field>
            </div>
            <Field label="Estado">
              <select value={form.estado} onChange={set('estado')}>
                {ESTADOS_ACTIVO.map((estado) => (
                  <option key={estado} value={estado}>
                    {labelEnum(estado)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notas">
              <textarea rows={2} value={form.notas} onChange={set('notas')} />
            </Field>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear activo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <GlassConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar activo"
        message={`¿Eliminar el activo "${confirmTarget?.nombre}"?`}
        identifier={confirmTarget?.nombre}
        type="danger"
      />
    </>
  );
}