import { useCallback, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordenesApi, inventarioApi } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { Badge, ErrorBanner, Field, Modal, PageHeader, Spinner } from '../components/ui.jsx';
import { ESTADOS_ORDEN_ABIERTOS } from '../lib/catalogos.js';
import { formatFechaHora, labelEnum, formatMoneda } from '../lib/format.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { toast } from '../lib/toast.js';
import { playSound } from '../lib/sound.js';
import { abrirActaParaImprimir } from '../lib/actaGenerator.js';

export default function OrdenDetallePage() {
  const { id } = useParams();
  const { user, isTecnico } = useAuth();

  // Estado para consumo de repuestos
  const [modalConsumo, setModalConsumo] = useState(false);
  const [repuestosDisponibles, setRepuestosDisponibles] = useState([]);
  const [cargandoRepuestos, setCargandoRepuestos] = useState(false);
  const [consumoForm, setConsumoForm] = useState({ repuesto_id: '', cantidad: 1, nota: '' });
  const [consumosRegistrados] = useState([]);
  const [consumoError, setConsumoError] = useState(null);

  // Orden principal
  const fetcher = useCallback(() => ordenesApi.get(id), [id]);
  const { data, loading, error, reload } = useResource(fetcher);

  const [accionError, setAccionError] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [btnExito, setBtnExito] = useState(null);
  const [modalCierre, setModalCierre] = useState(false);
  const [solucion, setSolucion] = useState('');
  const [evidencia, setEvidencia] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const orden = data?.orden;
  const abierta = orden && ESTADOS_ORDEN_ABIERTOS.includes(orden.estado);

  // Cargar repuestos disponibles al abrir modal de consumo
  const cargarRepuestos = useCallback(async () => {
    setCargandoRepuestos(true);
    try {
      const res = await inventarioApi.repuestos({ limit: 200, activo: true });
      // Filtrar solo los que tienen stock > 0
      const conStock = res.items.filter((r) => (r.stock_actual ?? r.stock ?? 0) > 0);
      setRepuestosDisponibles(conStock);
      setConsumoForm({ repuesto_id: conStock[0]?.id || '', cantidad: 1, nota: '' });
    } catch (err) {
      setConsumoError(err);
      toast({ title: 'Error', message: 'No se pudieron cargar los repuestos.', type: 'error' });
    } finally {
      setCargandoRepuestos(false);
    }
  }, []);

  useEffect(() => {
    if (modalConsumo && repuestosDisponibles.length === 0) {
      cargarRepuestos();
    }
  }, [modalConsumo, cargarRepuestos]);

  const ejecutar = async (fn, tipoExito, mensajeToast) => {
    setAccionError(null);
    setOcupado(true);
    try {
      await fn();
      await reload();
      setBtnExito(tipoExito);
      playSound('success');
      toast({ title: 'Éxito', message: mensajeToast, type: 'success', duration: 2500 });
      setTimeout(() => setBtnExito(null), 1800);
    } catch (err) {
      setAccionError(err);
      playSound('warning');
      toast({ title: 'Error', message: err.message || 'Ocurrió un error.', type: 'error' });
    } finally {
      setOcupado(false);
    }
  };

  const descargarActa = async () => {
    setAccionError(null);
    try {
      // Preparar repuestos consumidos para el acta
      const repuestosParaActa = consumosRegistrados.map((c) => ({
        repuesto: c.repuesto,
        cantidad: c.cantidad,
        precio_unitario: c.repuesto?.precio_unitario || 0,
      }));
      await abrirActaParaImprimir({
        orden,
        activo: data?.activo,
        repuestosConsumidos: repuestosParaActa,
      });
      setBtnExito('acta');
      playSound('success');
      toast({ title: 'Acta generada', message: 'Acta técnica abierta para impresión/PDF.', type: 'success', duration: 2500 });
      setTimeout(() => setBtnExito(null), 1800);
    } catch (err) {
      setAccionError(err);
      playSound('warning');
      toast({ title: 'Error', message: err.message || 'No se pudo generar el acta.', type: 'error' });
    }
  };

  const handleEvidenciaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAccionError(new Error('Solo se permiten archivos de imagen.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEvidencia({ nombre: file.name, base64: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const cerrarConEvidencia = async () => {
    setAccionError(null);
    setModalCierre(false);
    try {
      const updates = { estado: 'cerrada', descripcion: solucion.trim() };
      if (evidencia) {
        updates.evidencia_base64 = evidencia.base64;
        updates.evidencia_nombre = evidencia.nombre;
      }
      await ordenesApi.update(id, updates);
      await reload();
      setEvidencia(null);
      setSolucion('');
      setBtnExito('cerrar');
      playSound('success');
      toast({ title: 'Orden cerrada', message: 'Evidencia y solución guardadas exitosamente.', type: 'success', duration: 2500 });
      setTimeout(() => setBtnExito(null), 1800);
    } catch (err) {
      setAccionError(err);
      playSound('warning');
      toast({ title: 'Error', message: err.message || 'No se pudo cerrar la orden.', type: 'error' });
    } finally {
      setOcupado(false);
    }
  };

  // === Consumo de repuestos ===
  const registrarConsumo = async () => {
    if (!consumoForm.repuesto_id || !consumoForm.cantidad || Number(consumoForm.cantidad) < 1) {
      setConsumoError(new Error('Seleccione un repuesto y una cantidad válida.'));
      return;
    }
    setConsumoError(null);
    setOcupado(true);
    try {
      const repuesto = repuestosDisponibles.find((r) => r.id === consumoForm.repuesto_id);
      if (!repuesto) throw new Error('Repuesto no encontrado');

      const stockActual = repuesto.stock_actual ?? repuesto.stock ?? 0;
      const cantidad = Number(consumoForm.cantidad);
      if (cantidad > stockActual) {
        throw new Error(`Stock insuficiente. Disponible: ${stockActual} ${repuesto.unidad}`);
      }

      // 1. Descontar stock en ms-inventario (movimiento de salida)
      await inventarioApi.crearMovimiento(repuesto.id, {
        tipo_movimiento: 'salida',
        cantidad,
        motivo: `Consumo en orden ${orden.codigo}${consumoForm.nota ? ': ' + consumoForm.nota : ''}`,
      });

      // 2. Registrar consumo en la orden (ms-ordenes)
      // Usamos PATCH en la orden para añadir el repuesto consumido
      await ordenesApi.agregarRepuestoConsumido(orden.id, {
        repuesto_id: repuesto.id,
        cantidad,
        nota: consumoForm.nota || undefined,
      });

      // 3. Recargar datos para mostrar en UI
      await reload();
      await cargarRepuestos(); // refrescar stock

      setModalConsumo(false);
      setConsumoForm({ repuesto_id: '', cantidad: 1, nota: '' });
      playSound('success');
      toast({
        title: 'Repuesto consumido',
        message: `${repuesto.nombre} (${cantidad} ${repuesto.unidad}) descontado del inventario.`,
        type: 'success',
      });
    } catch (err) {
      setConsumoError(err);
      playSound('warning');
      toast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setOcupado(false);
    }
  };

  const abrirLightbox = (ordenData) => {
    const src = ordenData.evidencia_base64 || evidencia?.base64;
    setLightbox({
      src,
      orden: ordenData.id,
      activo: ordenData.activo_nombre || ordenData.activo_id,
      diagnostico: ordenData.descripcion || '—',
      prioridad: ordenData.prioridad || '—',
      fecha: ordenData.fecha_cierre || ordenData.created_at,
    });
  };

  const cerrarLightbox = () => setLightbox(null);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner error={error} />;
  if (!orden) return <p className="muted">Orden no encontrada.</p>;

  const tecnicoId = user?.id || '';
  const puedeEditar = isTecnico ? orden.tecnico_id === tecnicoId : true;

  // Extraer consumos registrados de la respuesta del backend
  const consumos = data?.consumos || consumosRegistrados;

  return (
    <>
      <PageHeader
        title={orden.titulo}
        subtitle={`Orden ${orden.id}`}
        actions={
          <Link className="btn btn-ghost" to="/ordenes">
            Volver
          </Link>
        }
      />

      <ErrorBanner error={accionError} onClose={() => setAccionError(null)} />

      {/* Tarjeta principal con spotlight */}
      <section className="card spotlight-card" style={{ '--mouse-x': '50%', '--mouse-y': '50%' }} onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }}>
        <div className="card-head">
          <h2>Detalle</h2>
          <Badge value={orden.estado} />
        </div>

        <dl className="detail-grid">
          <div>
            <dt>Tipo</dt>
            <dd>{labelEnum(orden.tipo)}</dd>
          </div>
          <div>
            <dt>Prioridad</dt>
            <dd>{labelEnum(orden.prioridad)}</dd>
          </div>
          <div>
            <dt>Activo</dt>
            <dd>{orden.activo_nombre || orden.activo_id}</dd>
          </div>
          <div>
            <dt>Técnico</dt>
            <dd>{orden.tecnico_email || '—'}</dd>
          </div>
          <div>
            <dt>Fecha programada</dt>
            <dd>{formatFechaHora(orden.fecha_programada)}</dd>
          </div>
          <div>
            <dt>Fecha de inicio</dt>
            <dd>{formatFechaHora(orden.fecha_inicio)}</dd>
          </div>
          <div>
            <dt>Fecha de cierre</dt>
            <dd>{formatFechaHora(orden.fecha_cierre)}</dd>
          </div>
          <div>
            <dt>Creada</dt>
            <dd>{formatFechaHora(orden.created_at)}</dd>
          </div>
        </dl>

        {orden.descripcion && (
          <>
            <h3 className="section-title">Descripción</h3>
            <p className="preserve">{orden.descripcion}</p>
          </>
        )}

        {orden.solucion && (
          <>
            <h3 className="section-title">Solución aplicada</h3>
            <p className="preserve">{orden.solucion}</p>
          </>
        )}

        {/* Evidencia fotográfica */}
        {orden.evidencia_base64 && (
          <>
            <h3 className="section-title">Evidencia Fotográfica</h3>
            <div className="evidencia-row">
              <img
                className="thumb-evidencia"
                src={orden.evidencia_base64}
                alt="Evidencia"
                onClick={() => abrirLightbox(orden)}
              />
              <span className="muted small">{orden.evidencia_nombre || 'imagen'}</span>
            </div>
          </>
        )}

        {/* Subir evidencia (solo técnico asignado y orden abierta) */}
        {puedeEditar && abierta && (
          <>
            <h3 className="section-title">Subir Evidencia de Reparación</h3>
            <label className="field">
              <input
                type="file"
                accept="image/*"
                className="file-input"
                onChange={handleEvidenciaChange}
              />
            </label>
            {evidencia && (
              <div className="evidencia-preview">
                <img className="thumb-evidencia" src={evidencia.base64} alt="Preview" />
                <span>{evidencia.nombre}</span>
                <button
                  type="button"
                  className="btn btn-ghost danger"
                  onClick={() => setEvidencia(null)}
                >
                  ×
                </button>
              </div>
            )}
          </>
        )}

        {/* Repuestos consumidos en esta orden */}
        {consumos.length > 0 && (
          <>
            <h3 className="section-title">Repuestos Consumidos</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>P. Unitario</th>
                    <th>Subtotal</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {consumos.map((c, i) => (
                    <tr key={c.id || i} className="stagger-item" style={{ '--stagger-index': i }}>
                      <td>{c.repuesto?.nombre || c.repuesto_nombre || 'Repuesto'}</td>
                      <td>{labelEnum(c.repuesto?.tipo || c.repuesto_tipo || 'repuesto')}</td>
                      <td style="text-align:center;">{c.cantidad}</td>
                      <td style="text-align:right;">{formatMoneda(c.repuesto?.precio_unitario || c.precio_unitario || 0)}</td>
                      <td style="text-align:right; font-weight:600;">{formatMoneda(Number(c.cantidad) * Number(c.repuesto?.precio_unitario || c.precio_unitario || 0))}</td>
                      <td className="muted small">{c.nota || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style="display:flex; justify-content:flex-end; margin-top:0.75rem; font-weight:600;">
              Total: {formatMoneda(consumos.reduce((acc, c) => acc + Number(c.cantidad) * Number(c.repuesto?.precio_unitario || c.precio_unitario || 0), 0))}
            </div>
          </>
        )}

        {/* Acciones */}
        <div className="actions-row">
          {abierta && puedeEditar && (
            <button
              type="button"
              className={`btn btn-primary ${btnExito === 'iniciar' ? 'btn-success' : ''} ${ocupado ? 'btn-loading' : ''}`}
              disabled={ocupado}
              onClick={() => ejecutar(() => ordenesApi.iniciar(orden.id), 'iniciar', 'Orden puesta en proceso.')}
            >
              {ocupado ? (
                <>
                  <span className="btn-spinner" style={{ width: 14, height: 14 }}></span>
                  Iniciando…
                </>
              ) : btnExito === 'iniciar' ? (
                '¡Listo! ✓'
              ) : (
                'Iniciar orden'
              )}
            </button>
          )}
          {abierta && puedeEditar && (
            <button
              type="button"
              className={`btn ${btnExito === 'cerrar' ? 'btn-success' : ''} ${ocupado ? 'btn-loading' : ''}`}
              disabled={ocupado}
              onClick={() => {
                setSolucion('');
                setModalCierre(true);
              }}
            >
              {ocupado ? 'Cerrando…' : btnExito === 'cerrar' ? '¡Listo! ✓' : 'Cerrar orden'}
            </button>
          )}
          {abierta && puedeEditar && (
            <button
              type="button"
              className={`btn btn-primary ${ocupado ? 'btn-loading' : ''}`}
              disabled={ocupado || cargandoRepuestos}
              onClick={() => setModalConsumo(true)}
            >
              {cargandoRepuestos ? (
                <>
                  <span className="btn-spinner" style={{ width: 14, height: 14 }}></span>
                  Cargando…
                </>
              ) : (
                '+ Consumir Repuesto'
              )}
            </button>
          )}
          {orden.estado === 'cerrada' && (
            <button
              type="button"
              className={`btn btn-primary ${btnExito === 'acta' ? 'btn-success' : ''}`}
              onClick={descargarActa}
            >
              {btnExito === 'acta' ? '¡Listo! ✓' : '📄 Descargar Acta Técnica'}
            </button>
          )}
        </div>
      </section>

      {/* Modal de cierre con evidencia */}
      {modalCierre && (
        <Modal title="Cerrar orden de mantenimiento" onClose={() => setModalCierre(false)}>
          <ErrorBanner error={accionError} onClose={() => setAccionError(null)} />
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              cerrarConEvidencia();
            }}
          >
            <Field label="Solución aplicada" hint="Describa el trabajo realizado.">
              <textarea rows={4} value={solucion} onChange={(e) => setSolucion(e.target.value)} />
            </Field>
            <Field label="Evidencia (opcional)" hint="Foto del daño reparado o trabajo finalizado.">
              <input
                type="file"
                accept="image/*"
                className="file-input"
                onChange={handleEvidenciaChange}
              />
              {evidencia && (
                <div className="evidencia-preview">
                  <img className="thumb-evidencia" src={evidencia.base64} alt="Preview" />
                  <span>{evidencia.nombre}</span>
                </div>
              )}
            </Field>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalCierre(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={ocupado}>
                {ocupado ? 'Cerrando…' : 'Cerrar orden'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de consumo de repuesto */}
      {modalConsumo && (
        <Modal title={`Consumir Repuesto · Orden ${orden.codigo}`} onClose={() => setModalConsumo(false)}>
          <ErrorBanner error={consumoError} onClose={() => setConsumoError(null)} />
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              registrarConsumo();
            }}
          >
            <Field label="Repuesto" hint="Solo se muestran repuestos con stock > 0.">
              {cargandoRepuestos ? (
                <div className="skeleton skeleton-text short" style={{ height: '42px' }} />
              ) : (
                <select
                  value={consumoForm.repuesto_id}
                  onChange={(e) => setConsumoForm((f) => ({ ...f, repuesto_id: e.target.value }))}
                  required
                  disabled={repuestosDisponibles.length === 0}
                >
                  <option value="">Seleccionar repuesto</option>
                  {repuestosDisponibles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} (SKU: {r.sku || r.codigo}) — Stock: {r.stock_actual ?? r.stock ?? 0} {r.unidad}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <div className="grid-2">
              <Field label="Cantidad">
                <input
                  type="number"
                  min="1"
                  value={consumoForm.cantidad}
                  onChange={(e) => setConsumoForm((f) => ({ ...f, cantidad: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Nota (opcional)">
                <input
                  value={consumoForm.nota}
                  onChange={(e) => setConsumoForm((f) => ({ ...f, nota: e.target.value }))}
                  placeholder="Ej: Cambio de filtro, reparación fuga..."
                />
              </Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalConsumo(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={ocupado || cargandoRepuestos}>
                {ocupado ? 'Registrando…' : 'Registrar consumo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox de evidencia */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={cerrarLightbox}>
          <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-body">
              {lightbox.src ? (
                <img src={lightbox.src} alt="Evidencia" />
              ) : (
                <div className="center" style={{ padding: '4rem' }}>
                  <p className="muted">No hay imagen disponible.</p>
                </div>
              )}
            </div>
            <div className="lightbox-foot">
              <button type="button" className="btn btn-ghost" onClick={cerrarLightbox}>
                × Cerrar
              </button>
              <div className="lightbox-meta">
                <div><span className="meta-label">Orden</span><span className="meta-value">{lightbox.orden}</span></div>
                <div><span className="meta-label">Activo</span><span className="meta-value">{lightbox.activo}</span></div>
                <div><span className="meta-label">Diagnóstico</span><span className="meta-value">{lightbox.diagnostico}</span></div>
                <div><span className="meta-label">Prioridad</span><span className="meta-value">{labelEnum(lightbox.prioridad)}</span></div>
                <div><span className="meta-label">Fecha</span><span className="meta-value">{formatFechaHora(lightbox.fecha)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}