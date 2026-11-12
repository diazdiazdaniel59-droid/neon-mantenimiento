import { useCallback, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordenesApi, activosApi, inventarioApi, notificacionesApi } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { Badge, ErrorBanner, Spinner } from '../components/ui.jsx';
import { formatFecha, labelEnum } from '../lib/format.js';
import { useAuth } from '../auth/AuthContext.jsx';

// =============================================================================
// Dashboard del TECNICO (vista operativa) - Estilo Bento Grid
// =============================================================================

function TecnicoDashboard({ user }) {
  const [notifications, setNotifications] = useState([]);

  // Cargar órdenes asignadas al técnico
  const fetcher = useCallback(() => ordenesApi.misOrdenes({ limit: 50 }), []);
  const { data, loading, error } = useResource(fetcher);

  const ordenes = data?.items || [];
  const totalOrdenes = ordenes.length;

  // KPIs del técnico
  const pendientes = ordenes.filter((o) => o.estado === 'abierta').length;
  const enProceso = ordenes.filter((o) => o.estado === 'en_proceso').length;
  const urgentesSLA = ordenes.filter(
    (o) => o.prioridad === 'alta' && o.estado !== 'cerrada' && o.estado !== 'cancelada'
  ).length;
  const cerradas = ordenes.filter((o) => o.estado === 'cerrada').length;

  // 3 órdenes más urgentes (prioridad alta primero, luego fecha creación)
  const urgentes = useMemo(
    () =>
      [...ordenes]
        .filter((o) => o.estado !== 'cerrada' && o.estado !== 'cancelada')
        .sort((a, b) => {
          const pa = a.prioridad === 'alta' ? 3 : a.prioridad === 'urgente' ? 4 : a.prioridad === 'media' ? 2 : 1;
          const pb = b.prioridad === 'alta' ? 3 : b.prioridad === 'urgente' ? 4 : b.prioridad === 'media' ? 2 : 1;
          if (pb !== pa) return pb - pa;
          return new Date(b.created_at) - new Date(a.created_at);
        })
        .slice(0, 3),
    [ordenes]
  );

  // Distribución por prioridad para el gráfico
  const distribucion = useMemo(
    () => {
      const alta = ordenes.filter((o) => o.prioridad === 'alta').length;
      const media = ordenes.filter((o) => o.prioridad === 'media').length;
      const baja = ordenes.filter((o) => o.prioridad === 'baja').length;
      return { alta, media, baja };
    },
    [ordenes]
  );

  // --- Notificaciones (polling cada 10s) ---
  const cargarNotificaciones = useCallback(async () => {
    try {
      const data = await notificacionesApi.list({ limit: 10 });
      setNotifications(data?.items || []);
    } catch {
      // No bloquear si el servicio de notificaciones no responde
    }
  }, []);

  useEffect(() => {
    cargarNotificaciones();
    const t = setInterval(cargarNotificaciones, 10000);
    return () => clearInterval(t);
  }, [cargarNotificaciones]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner error={error} />;

  return (
    <>
      {/* Welcome Hero */}
      <div className="welcome-hero stagger-item" style={{'--staggerIndex': 0}}>
        <div className="welcome-text">
          <h1>Hola, {user?.nombre?.split(' ')[0] || 'Técnico'}.</h1>
          <p>Tu operación, desde una nueva perspectiva.</p>
        </div>
        <div className="welcome-action">
          <Link className="btn btn-primary" to="/ordenes">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva orden
          </Link>
        </div>
      </div>

      {/* Bento Grid - KPI Cards + Charts */}
      <div className="bento-grid" role="region" aria-label="Métricas operativas">
        {/* KPI: Pendientes */}
        <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 1}}>
          <div className="card-head">
            <h3 className="card-title">Órdenes Pendientes</h3>
            <span className="badge badge-activo">ABIERTA</span>
          </div>
          <div className="card-body">
            <p className="kpi-value">{pendientes}</p>
            <p className="kpi-label">Requieren atención inmediata</p>
          </div>
          <div className="card-foot">
            <span>{pendientes > 0 ? 'Acción requerida' : 'Todo al día'}</span>
          </div>
        </div>

        {/* KPI: En Proceso */}
        <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 2}}>
          <div className="card-head">
            <h3 className="card-title">En Proceso</h3>
            <span className="badge badge-en_proceso">EN_PROCESO</span>
          </div>
          <div className="card-body">
            <p className="kpi-value">{enProceso}</p>
            <p className="kpi-label">Órdenes en ejecución</p>
          </div>
          <div className="card-foot">
            <span>En curso</span>
          </div>
        </div>

        {/* KPI: Urgencias SLA */}
        <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 3}}>
          <div className="card-head">
            <h3 className="card-title">Urgencias SLA Crítico</h3>
            <span className="badge badge-alta">ALTA</span>
          </div>
          <div className="card-body">
            <p className="kpi-value" style={{color: urgentesSLA > 0 ? '#ff6b6b' : 'var(--text)'}}>{urgentesSLA}</p>
            <p className="kpi-label">Prioridad ALTA sin resolver</p>
          </div>
          <div className="card-foot">
            <span>{urgentesSLA > 0 ? '⚠ Atender ya' : 'Sin urgencias'}</span>
          </div>
        </div>

        {/* KPI: Cerradas */}
        <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 4}}>
          <div className="card-head">
            <h3 className="card-title">Finalizadas</h3>
            <span className="badge badge-cerrada">CERRADA</span>
          </div>
          <div className="card-body">
            <p className="kpi-value">{cerradas}</p>
            <p className="kpi-label">Órdenes completadas</p>
          </div>
          <div className="card-foot">
            <span>Historial</span>
          </div>
        </div>

        {/* Gráfico Donut - Carga de Trabajo */}
        <div className="bento-card tall spotlight-card stagger-item" style={{'--staggerIndex': 5}}>
          <div className="card-head">
            <h3 className="card-title">Carga por Prioridad</h3>
            <span className="card-badge">{totalOrdenes} total</span>
          </div>
          <div className="card-body">
            <div className="chart-donut">
              <div
                className="donut-ring"
                style={{
                  '--pct-alta': distribucion.alta,
                  '--pct-media': distribucion.media,
                  '--pct-baja': distribucion.baja,
                  '--color-alta': '#ff6b6b',
                  '--color-media': '#FF5E00',
                  '--color-baja': '#22C55E',
                }}
              />
              <div className="donut-center">
                <span className="donut-total">{totalOrdenes}</span>
                <span className="donut-label">órdenes</span>
              </div>
            </div>
            <div className="donut-legend">
              <span className="legend-item"><span className="legend-dot alta" /> Alta ({distribucion.alta})</span>
              <span className="legend-item"><span className="legend-dot media" /> Media ({distribucion.media})</span>
              <span className="legend-item"><span className="legend-dot baja" /> Baja ({distribucion.baja})</span>
            </div>
          </div>
        </div>

        {/* Feed Notificaciones RabbitMQ */}
        <div className="bento-card tall spotlight-card stagger-item" style={{'--staggerIndex': 6}}>
          <div className="card-head">
            <h3 className="card-title">Feed de Eventos</h3>
            <span className="card-badge" style={{background: 'rgba(255,94,0,0.1)', color: '#FF5E00', borderColor: 'rgba(255,94,0,0.3)'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: '4px'}}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              RabbitMQ
            </span>
          </div>
          <div className="card-body">
            {notifications.length === 0 ? (
              <p className="muted" style={{padding: '1.5rem', textAlign: 'center'}}>Sin eventos recientes del broker</p>
            ) : (
              <div className="notif-feed">
                {notifications.slice(0, 6).map((n, idx) => (
                  <div key={n.id} className="notif-item stagger-item" style={{'--staggerIndex': idx}}>
                    <div className="notif-time">{new Date(n.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="notif-body">
                      <div className="notif-title">{n.subject || n.event || 'Evento'}</div>
                      <div className="notif-text">{n.text || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card-foot">
            <span>{notifications.length} eventos recientes</span>
          </div>
        </div>
      </div>

      {/* Órdenes Urgentes - Acciones rápidas (Ley de Fitts) - Full width */}
      <div className="bento-grid" role="region" aria-label="Órdenes urgentes">
        <div className="bento-card wide spotlight-card stagger-item" style={{'--staggerIndex': 7}}>
          <div className="card-head">
            <h3 className="card-title">Órdenes Urgentes - Atender Ahora</h3>
            <span className="card-badge">{urgentes.length} pendientes</span>
          </div>
          <div className="card-body">
            {urgentes.length === 0 ? (
              <p className="muted" style={{padding: '1.5rem', textAlign: 'center'}}>No hay órdenes pendientes asignadas</p>
            ) : (
              <div className="urgent-list">
                {urgentes.map((orden, idx) => (
                  <div key={orden.id} className="urgent-card stagger-item" style={{'--staggerIndex': idx}}>
                    <div className="urgent-info">
                      <span className={`badge ${orden.prioridad === 'alta' ? 'badge-alta' : 'badge-media'}`}>
                        {labelEnum(orden.prioridad)}
                      </span>
                      <div className="urgent-title">{orden.titulo}</div>
                      <div className="urgent-meta">
                        {orden.activo_nombre || orden.activo_id} • {formatFecha(orden.created_at)}
                      </div>
                    </div>
                    <Link to={`/ordenes/${orden.id}`} className="btn btn-primary">
                      Atender Ahora
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Dashboard del ADMIN / SUPERVISOR (Bento Grid)
// =============================================================================

function AdminDashboard() {
  const cargar = useCallback(async () => {
    const [ordenes, activos, repuestos, stockBajo] = await Promise.all([
      ordenesApi.list({ limit: 5 }),
      activosApi.list({ limit: 1 }),
      inventarioApi.repuestos({ limit: 1 }),
      inventarioApi.repuestos({ low_stock: true, limit: 1 }),
    ]);
    return {
      ordenes,
      activosTotal: activos.total,
      repuestosTotal: repuestos.total,
      stockBajoTotal: stockBajo.total,
    };
  }, []);

  const { data, loading, error } = useResource(cargar);

  const ordenesRecientes = data?.ordenes?.items || [];
  const totalOrdenes = data?.ordenes?.total || 0;
  const totalActivos = data?.activosTotal || 0;
  const totalRepuestos = data?.repuestosTotal || 0;
  const totalStockBajo = data?.stockBajoTotal || 0;

  return (
    <>
      {/* Welcome Hero */}
      <div className="welcome-hero stagger-item" style={{'--staggerIndex': 0}}>
        <div className="welcome-text">
          <h1>Hola, Administrador.</h1>
          <p>Resumen operativo del sistema de mantenimiento.</p>
        </div>
        <div className="welcome-action">
          <Link className="btn btn-primary" to="/ordenes">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva orden
          </Link>
        </div>
      </div>

      <ErrorBanner error={error} />

      {loading && <Spinner />}

      {data && (
        <>
          {/* Bento Grid - KPIs principales */}
          <div className="bento-grid" role="region" aria-label="Métricas del sistema">
            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 1}}>
              <div className="card-head">
                <h3 className="card-title">Órdenes Registradas</h3>
                <span className="badge trend-badge trend-positive">▲ +12%</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{totalOrdenes}</p>
                <p className="kpi-label">Total en el sistema</p>
                <div className="bar-chart">
                  <div className="bar" style={{height: '45%'}} />
                  <div className="bar compare" style={{height: '30%'}} />
                  <div className="bar" style={{height: '60%'}} />
                  <div className="bar compare" style={{height: '40%'}} />
                  <div className="bar" style={{height: '75%'}} />
                </div>
              </div>
              <div className="card-foot">
                <Link to="/ordenes" className="foot-action">Ver todas →</Link>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 2}}>
              <div className="card-head">
                <h3 className="card-title">Activos</h3>
                <span className="badge trend-badge trend-positive">▲ +5%</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{totalActivos}</p>
                <p className="kpi-label">Equipos registrados</p>
                <div className="bar-chart">
                  <div className="bar" style={{height: '55%'}} />
                  <div className="bar compare" style={{height: '35%'}} />
                  <div className="bar" style={{height: '70%'}} />
                  <div className="bar compare" style={{height: '50%'}} />
                  <div className="bar" style={{height: '85%'}} />
                </div>
              </div>
              <div className="card-foot">
                <Link to="/activos" className="foot-action">Ver catálogo →</Link>
              </div>
            </div>

            <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 3}}>
              <div className="card-head">
                <h3 className="card-title">Repuestos</h3>
                <span className="badge trend-badge trend-positive">▲ +8%</span>
              </div>
              <div className="card-body">
                <p className="kpi-value">{totalRepuestos}</p>
                <p className="kpi-label">Ítems en inventario</p>
                <div className="bar-chart">
                  <div className="bar" style={{height: '35%'}} />
                  <div className="bar compare" style={{height: '25%'}} />
                  <div className="bar" style={{height: '50%'}} />
                  <div className="bar compare" style={{height: '45%'}} />
                  <div className="bar" style={{height: '65%'}} />
                </div>
              </div>
              <div className="card-foot">
                <Link to="/inventario" className="foot-action">Ver stock →</Link>
              </div>
            </div>

            <div className={`bento-card spotlight-card stagger-item ${totalStockBajo > 0 ? 'stat alert' : ''}`} style={{'--staggerIndex': 4}}>
              <div className="card-head">
                <h3 className="card-title">Stock Bajo</h3>
                <span className="badge trend-badge trend-positive">{totalStockBajo > 0 ? '▼' : '—'}</span>
              </div>
              <div className="card-body">
                <p className="kpi-value" style={{color: totalStockBajo > 0 ? '#ff6b6b' : 'var(--text)'}}>{totalStockBajo}</p>
                <p className="kpi-label">Repuestos por debajo del mínimo</p>
                {totalStockBajo > 0 && (
                  <div className="area-chart">
                    <div className="area-line" style={{width: '70%'}} />
                  </div>
                )}
              </div>
              <div className="card-foot">
                <Link to="/inventario?lowStock=true" className="foot-action">Revisar →</Link>
              </div>
            </div>
          </div>

          {/* Órdenes recientes - Full width */}
          <div className="bento-grid" role="region" aria-label="Órdenes recientes">
            <div className="bento-card wide spotlight-card stagger-item" style={{'--staggerIndex': 5}}>
              <div className="card-head">
                <h3 className="card-title">Órdenes Recientes</h3>
                <Link to="/ordenes" className="foot-action">Ver todas →</Link>
              </div>
              <div className="card-body">
                {ordenesRecientes.length === 0 ? (
                  <p className="muted" style={{padding: '1.5rem', textAlign: 'center'}}>Aún no hay órdenes registradas</p>
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
                        </tr>
                      </thead>
                      <tbody>
                        {ordenesRecientes.map((orden, idx) => (
                          <tr key={orden.id} className="stagger-item" style={{'--staggerIndex': idx}}>
                            <td><Link to={`/ordenes/${orden.id}`}>{orden.titulo}</Link></td>
                            <td>{orden.activo_nombre || orden.activo_id}</td>
                            <td>{labelEnum(orden.tipo)}</td>
                            <td>{labelEnum(orden.prioridad)}</td>
                            <td><Badge value={orden.estado} /></td>
                            <td>{formatFecha(orden.created_at)}</td>
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
    </>
  );
}

export default function DashboardPage() {
  const { user, isTecnico } = useAuth();

  if (isTecnico) {
    return <TecnicoDashboard user={user} />;
  }

  return <AdminDashboard />;
}