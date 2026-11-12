import { useCallback, useMemo, useState } from 'react';
import { inventarioApi } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { ErrorBanner, Field, Modal, PageHeader, Spinner } from '../components/ui.jsx';
import { GlassConfirmModal } from '../components/GlassConfirmModal.jsx';
import { TIPOS_ITEM, TIPOS_MOVIMIENTO, UNIDADES } from '../lib/catalogos.js';
import { formatMoneda, labelEnum } from '../lib/format.js';
import { toast } from '../lib/toast.js';
import { playSound } from '../lib/sound.js';

const REPUESTO_VACIO = {
  sku: '',
  nombre: '',
  tipo: 'repuesto',
  unidad: 'pieza',
  stock_actual: 0,
  stock_minimo: 0,
  precio_unitario: '',
  ubicacion: '',
};

const MOVIMIENTO_VACIO = { tipo: 'entrada', cantidad: 1, motivo: '' };

// Lecturas tolerantes: aceptan tanto el contrato actual del backend
// (sku, tipo, stock_actual) como nombres heredados (codigo, categoria, stock).
const skuDe = (item) => item?.sku ?? item?.codigo ?? '';
const tipoDe = (item) => item?.tipo ?? item?.categoria ?? 'repuesto';
const stockDe = (item) => item?.stock_actual ?? item?.stock ?? 0;
const stockMinimoDe = (item) => item?.stock_minimo ?? 0;
const ubicacionDe = (item) => item?.ubicacion ?? '';

export default function InventarioPage() {
  const { isAdmin, canManage } = useAuth();
  const [filtros, setFiltros] = useState({ search: '', lowStock: false });
  const [modalRepuesto, setModalRepuesto] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [editando, setEditando] = useState(null);
  const [repuestoActivo, setRepuestoActivo] = useState(null);
  const [formRepuesto, setFormRepuesto] = useState(REPUESTO_VACIO);
  const [formMovimiento, setFormMovimiento] = useState(MOVIMIENTO_VACIO);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [btnExito, setBtnExito] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const query = useMemo(
    () => ({ search: filtros.search, low_stock: filtros.lowStock || undefined, limit: 100 }),
    [filtros.search, filtros.lowStock]
  );
  const fetcher = useCallback(() => inventarioApi.repuestos(query), [query]);
  const { data, loading, error: errorLista, reload } = useResource(fetcher);

  const abrirRepuesto = () => {
    setEditando(null);
    setFormRepuesto(REPUESTO_VACIO);
    setError(null);
    setBtnExito(false);
    setModalRepuesto(true);
  };

  const abrirEditar = (repuesto) => {
    setEditando(repuesto);
    setFormRepuesto({
      sku: skuDe(repuesto),
      nombre: repuesto.nombre ?? '',
      tipo: tipoDe(repuesto),
      unidad: repuesto.unidad ?? 'pieza',
      stock_actual: stockDe(repuesto),
      stock_minimo: stockMinimoDe(repuesto),
      precio_unitario: repuesto.precio_unitario ?? '',
      ubicacion: ubicacionDe(repuesto),
    });
    setError(null);
    setBtnExito(false);
    setModalRepuesto(true);
  };

  const cerrarModalRepuesto = () => {
    setModalRepuesto(false);
    setEditando(null);
    setBtnExito(false);
  };

  const abrirMovimiento = (repuesto) => {
    setRepuestoActivo(repuesto);
    setFormMovimiento(MOVIMIENTO_VACIO);
    setError(null);
    setModalMovimiento(true);
  };

  const guardarRepuesto = async (e) => {
    e.preventDefault();
    const esEdicion = Boolean(editando);
    setError(null);
    setGuardando(true);
    const payload = {
      sku: formRepuesto.sku.trim(),
      nombre: formRepuesto.nombre.trim(),
      tipo: formRepuesto.tipo,
      unidad: formRepuesto.unidad,
      stock_actual: Number(formRepuesto.stock_actual) || 0,
      stock_minimo: Number(formRepuesto.stock_minimo) || 0,
      precio_unitario: formRepuesto.precio_unitario === '' ? 0 : Number(formRepuesto.precio_unitario),
      ubicacion: formRepuesto.ubicacion.trim() || undefined,
    };
    try {
      if (esEdicion) await inventarioApi.actualizarRepuesto(editando.id, payload);
      else await inventarioApi.crearRepuesto(payload);
      setModalRepuesto(false);
      setEditando(null);
      await reload();
      playSound('success');
      toast({
        title: esEdicion ? 'Repuesto actualizado' : 'Repuesto creado',
        message: `${payload.nombre} se guardó correctamente.`,
        type: 'success',
      });
      setBtnExito(true);
      setTimeout(() => setBtnExito(false), 1800);
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  };

  const guardarMovimiento = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await inventarioApi.crearMovimiento(repuestoActivo.id, {
        tipo_movimiento: formMovimiento.tipo,
        cantidad: Number(formMovimiento.cantidad),
        motivo: formMovimiento.motivo.trim() || undefined,
      });
      setModalMovimiento(false);
      await reload();
      playSound('success');
      toast({
        title: 'Movimiento registrado',
        message: `Stock de ${repuestoActivo.nombre} actualizado.`,
        type: 'success',
      });
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (repuesto) => {
    playSound('warning');
    setConfirmTarget(repuesto);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await inventarioApi.eliminarRepuesto(confirmTarget.id);
      await reload();
      playSound('success');
      toast({
        title: 'Repuesto eliminado',
        message: `${confirmTarget.nombre} fue desactivado.`,
        type: 'success',
      });
    } catch (err) {
      setError(err);
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Repuestos, existencias y movimientos de stock"
        actions={
          canManage ? (
            <button type="button" className="btn btn-primary" onClick={abrirRepuesto}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo repuesto
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
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filtros.lowStock}
            onChange={(e) => setFiltros((f) => ({ ...f, lowStock: e.target.checked }))}
          />
          Solo stock bajo
        </label>
      </div>

      <ErrorBanner error={errorLista || (modalRepuesto || modalMovimiento ? null : error)} />

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Stats KPIs en Bento Grid */}
          <div className="bento-grid" role="region" aria-label="Estadísticas de inventario">
            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 1}}>
              <div className="card-head">
                <h3 className="card-title">Total Ítems</h3>
                <span className="card-badge">{data?.total || 0}</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{data?.items?.length || 0}</p>
                <p className="kpi-label">Mostrando {data?.items?.length || 0} de {data?.total || 0}</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 2}}>
              <div className="card-head">
                <h3 className="card-title">Stock Bajo</h3>
                <span className="badge" style={{background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)'}}>ALERTA</span>
              </div>
              <div className="card-body">
                <p className="kpi-value" style={{color: '#ff6b6b'}}>
                  {data?.items?.filter(r => stockDe(r) <= stockMinimoDe(r)).length || 0}
                </p>
                <p className="kpi-label">Por debajo del mínimo</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 3}}>
              <div className="card-head">
                <h3 className="card-title">Valor Total</h3>
                <span className="card-badge">Inventario</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">
                  {formatMoneda(data?.items?.reduce((sum, r) => sum + (stockDe(r) * (r.precio_unitario || 0)), 0) || 0)}
                </p>
                <p className="kpi-label">Stock × Precio unitario</p>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 4}}>
              <div className="card-head">
                <h3 className="card-title">Tipos</h3>
                <span className="card-badge">Categorías</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">
                  {new Set(data?.items?.map(r => tipoDe(r)) || []).size}
                </p>
                <p className="kpi-label">Familias distintas</p>
              </div>
            </div>
          </div>

          {/* Tabla de repuestos */}
          <div className="bento-grid" role="region" aria-label="Listado de repuestos">
            <div className="bento-card wide spotlight-card stagger-item" style={{'--staggerIndex': 5}}>
              <div className="card-head">
                <h3 className="card-title">Listado de Repuestos</h3>
              </div>
              <div className="card-body">
                {!data || data.items.length === 0 ? (
                  <p className="muted" style={{padding: '2rem', textAlign: 'center'}}>No hay repuestos que coincidan con el filtro.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Tipo</th>
                          <th>Unidad</th>
                          <th>Stock</th>
                          <th>Mínimo</th>
                          <th>Precio</th>
                          <th>Ubicación</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((repuesto, idx) => {
                          const stock = stockDe(repuesto);
                          const minimo = stockMinimoDe(repuesto);
                          const bajo = stock <= minimo;
                          return (
                            <tr key={repuesto.id} className={bajo ? 'row-low stagger-item' : 'stagger-item'} style={{'--staggerIndex': idx}}>
                              <td>{skuDe(repuesto)}</td>
                              <td>{repuesto.nombre}</td>
                              <td>{labelEnum(tipoDe(repuesto))}</td>
                              <td>{labelEnum(repuesto.unidad)}</td>
                              <td>
                                {stock}
                                {bajo && <span className="tag-warn">bajo</span>}
                              </td>
                              <td>{minimo}</td>
                              <td>{formatMoneda(repuesto.precio_unitario)}</td>
                              <td>{ubicacionDe(repuesto) || '—'}</td>
                              <td className="row-actions">
                                {canManage && (
                                  <button type="button" className="btn btn-ghost" onClick={() => abrirEditar(repuesto)}>
                                    Editar
                                  </button>
                                )}
                                <button type="button" className="btn btn-ghost" onClick={() => abrirMovimiento(repuesto)}>
                                  Movimiento
                                </button>
                                {isAdmin && (
                                  <button type="button" className="btn btn-ghost danger" onClick={() => eliminar(repuesto)}>
                                    Eliminar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {modalRepuesto && (
        <Modal title={editando ? 'Editar repuesto' : 'Nuevo repuesto'} onClose={cerrarModalRepuesto}>
          <ErrorBanner error={error} onClose={() => setError(null)} />
          <form className="form" onSubmit={guardarRepuesto}>
            <div className="grid-2">
              <Field label="Código (SKU)">
                <input
                  value={formRepuesto.sku}
                  onChange={(e) => setFormRepuesto((f) => ({ ...f, sku: e.target.value }))}
                  required
                  maxLength={50}
                />
              </Field>
              <Field label="Nombre">
                <input
                  value={formRepuesto.nombre}
                  onChange={(e) => setFormRepuesto((f) => ({ ...f, nombre: e.target.value }))}
                  minLength={2}
                  required
                />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Tipo">
                <select
                  value={formRepuesto.tipo}
                  onChange={(e) => setFormRepuesto((f) => ({ ...f, tipo: e.target.value }))}
                  required
                >
                  {TIPOS_ITEM.map((t) => (
                    <option key={t} value={t}>
                      {labelEnum(t)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unidad">
                <select
                  value={formRepuesto.unidad}
                  onChange={(e) => setFormRepuesto((f) => ({ ...f, unidad: e.target.value }))}
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {labelEnum(u)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Stock actual">
                <input
                  type="number"
                  min="0"
                  value={formRepuesto.stock_actual}
                  onChange={(e) => setFormRepuesto((f) => ({ ...f, stock_actual: e.target.value }))}
                />
              </Field>
              <Field label="Stock mínimo">
                <input
                  type="number"
                  min="0"
                  value={formRepuesto.stock_minimo}
                  onChange={(e) => setFormRepuesto((f) => ({ ...f, stock_minimo: e.target.value }))}
                />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Precio unitario">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formRepuesto.precio_unitario}
                  onChange={(e) => setFormRepuesto((f) => ({ ...f, precio_unitario: e.target.value }))}
                />
              </Field>
              <Field label="Ubicación">
                <input
                  value={formRepuesto.ubicacion}
                  onChange={(e) => setFormRepuesto((f) => ({ ...f, ubicacion: e.target.value }))}
                  maxLength={120}
                />
              </Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={cerrarModalRepuesto}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn ${btnExito ? 'btn-success' : 'btn-primary'}`}
                disabled={guardando}
              >
                {btnExito ? '¡Listo! ✓' : guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear repuesto'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalMovimiento && repuestoActivo && (
        <Modal
          title={`Movimiento de stock · ${repuestoActivo.nombre}`}
          onClose={() => setModalMovimiento(false)}
        >
          <ErrorBanner error={error} onClose={() => setError(null)} />
          <p className="muted small">
            Stock actual: <strong>{stockDe(repuestoActivo)}</strong> · Unidad: {labelEnum(repuestoActivo.unidad)}
          </p>
          <form className="form" onSubmit={guardarMovimiento}>
            <Field
              label="Tipo de movimiento"
              hint="Ajuste fija el stock al valor contado (inventario físico)."
            >
              <select
                value={formMovimiento.tipo}
                onChange={(e) => setFormMovimiento((f) => ({ ...f, tipo: e.target.value }))}
              >
                {TIPOS_MOVIMIENTO.map((t) => (
                  <option key={t} value={t}>
                    {labelEnum(t)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cantidad">
              <input
                type="number"
                min="1"
                value={formMovimiento.cantidad}
                onChange={(e) => setFormMovimiento((f) => ({ ...f, cantidad: e.target.value }))}
                required
              />
            </Field>
            <Field label="Motivo">
              <input
                value={formMovimiento.motivo}
                onChange={(e) => setFormMovimiento((f) => ({ ...f, motivo: e.target.value }))}
              />
            </Field>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalMovimiento(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Registrando…' : 'Registrar movimiento'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <GlassConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar repuesto"
        message={`¿Eliminar el repuesto "${confirmTarget?.nombre}"?`}
        identifier={confirmTarget?.nombre}
        type="danger"
      />
    </>
  );
}