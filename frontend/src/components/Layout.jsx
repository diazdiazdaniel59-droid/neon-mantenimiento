import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { notificacionesApi } from '../api/client.js';
import { ToastList } from './Toast.jsx';

// Iconos SVG estilo Lucide (inline para evitar dependencias)
const Icons = {
  Home: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  ListTodo: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7" />
      <path d="M5 21V7" />
      <path d="M3 7l9-5 9 5" />
    </svg>
  ),
  Box: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Package: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
      <path d="M12 18V2" />
      <path d="M8 14h8" />
      <path d="M8 10h8" />
      <path d="M4 14h2" />
      <path d="M4 10h2" />
      <path d="M18 10h2" />
      <path d="M18 14h2" />
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  UserCog: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="9" cy="7" r="4" />
      <path d="M10 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <path d="M22.7 19l-3 3" />
      <path d="M22 16l-3 3" />
      <path d="M21.7 19.7l-3 3" />
      <path d="M21 16.5l-3 3" />
    </svg>
  ),
  Bell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Sun: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Moon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  CircleCheck: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l2 2 4-4" />
    </svg>
  ),
  Menu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Wrench: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  LayoutDashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const NAV = [
  { to: '/', label: 'Panel', icon: Icons.LayoutDashboard, end: true, roles: ['admin', 'supervisor'] },
  { to: '/', label: 'Panel', icon: Icons.Activity, end: true, roles: ['tecnico'] },
  { to: '/ordenes', label: 'Órdenes', icon: Icons.ListTodo, roles: ['admin', 'supervisor', 'tecnico'] },
  { to: '/activos', label: 'Activos', icon: Icons.Box, roles: ['admin', 'supervisor'] },
  { to: '/inventario', label: 'Inventario', icon: Icons.Package, roles: ['admin', 'supervisor'] },
  { to: '/usuarios', label: 'Usuarios', icon: Icons.Users, roles: ['admin'] },
  { to: '/tecnico/perfil', label: 'Perfil Técnico', icon: Icons.UserCog, roles: ['tecnico'] },
];

// Items para bottom nav móvil (según rol)
const BOTTOM_NAV_ITEMS = {
  admin: [
    { to: '/', label: 'Panel', icon: Icons.LayoutDashboard },
    { to: '/ordenes', label: 'Órdenes', icon: Icons.ListTodo },
    { to: '/activos', label: 'Activos', icon: Icons.Box },
    { to: '/inventario', label: 'Inventario', icon: Icons.Package },
  ],
  supervisor: [
    { to: '/', label: 'Panel', icon: Icons.LayoutDashboard },
    { to: '/ordenes', label: 'Órdenes', icon: Icons.ListTodo },
    { to: '/activos', label: 'Activos', icon: Icons.Box },
    { to: '/inventario', label: 'Inventario', icon: Icons.Package },
  ],
  tecnico: [
    { to: '/', label: 'Panel', icon: Icons.Activity },
    { to: '/ordenes', label: 'Órdenes', icon: Icons.ListTodo },
    { to: '/tecnico/perfil', label: 'Perfil', icon: Icons.UserCog },
    { to: '/ordenes', label: 'Atender', icon: Icons.Wrench }, // acción contextual
  ],
};

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const visible = NAV.filter((item) => !item.roles || item.roles.includes(user?.rol));

  const [notifCount, setNotifCount] = useState(0);
  const [notifItems, setNotifItems] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('neon_theme');
    return saved === 'claro' ? 'claro' : 'oscuro';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('neon_sidebar_collapsed') === 'true';
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Aplicar tema al body y localStorage
  const toggleTheme = () => {
    const next = theme === 'oscuro' ? 'claro' : 'oscuro';
    setTheme(next);
    document.body.className = next === 'claro' ? 'modo-claro' : '';
    localStorage.setItem('neon_theme', next);
  };

  // Inicializar tema al montar
  useEffect(() => {
    document.body.className = theme === 'claro' ? 'modo-claro' : '';
  }, [theme]);

  // Persistir estado del sidebar
  useEffect(() => {
    localStorage.setItem('neon_sidebar_collapsed', String(sidebarCollapsed));
    // Aplicar clase al app-shell
    const shell = document.querySelector('.app-shell');
    if (shell) {
      shell.classList.toggle('sidebar-collapsed', sidebarCollapsed);
    }
  }, [sidebarCollapsed]);

  // Polling de notificaciones cada 10s
  const cargarNotificaciones = async () => {
    try {
      const data = await notificacionesApi.list({ limit: 10 });
      const items = data?.items || [];
      setNotifItems(items);
      setNotifCount(items.length);
    } catch {
      // No bloquear si el servicio no responde
    }
  };

  // Iniciar polling y cargar inicial
  useEffect(() => {
    cargarNotificaciones();
    const timer = setInterval(cargarNotificaciones, 10000);
    return () => clearInterval(timer);
  }, []);

  // Cerrar user menu al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  // Cerrar panel de notificaciones al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  // Toggle del panel de notificaciones (refresca al abrir)
  const toggleNotificaciones = () => {
    setNotifOpen((open) => !open);
    if (!notifOpen) cargarNotificaciones();
  };

  // Toggle drawer móvil
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  // Bottom nav items según rol
  const bottomNavItems = user ? BOTTOM_NAV_ITEMS[user.rol] || [] : [];

  // Breadcrumb basado en ruta actual
  const getBreadcrumb = () => {
    const path = location.pathname;
    const breadcrumbs = [{ label: 'Mi espacio', to: '/' }];

    if (path === '/') {
      return [...breadcrumbs, { label: 'Vista general', current: true }];
    }
    if (path.startsWith('/ordenes')) {
      if (path === '/ordenes') return [...breadcrumbs, { label: 'Órdenes', current: true }];
      return [...breadcrumbs, { label: 'Órdenes', to: '/ordenes' }, { label: 'Detalle', current: true }];
    }
    if (path === '/activos') return [...breadcrumbs, { label: 'Activos', current: true }];
    if (path === '/inventario') return [...breadcrumbs, { label: 'Inventario', current: true }];
    if (path === '/usuarios') return [...breadcrumbs, { label: 'Usuarios', current: true }];
    if (path === '/tecnico/perfil') return [...breadcrumbs, { label: 'Perfil Técnico', current: true }];

    return [...breadcrumbs, { label: 'Vista general', current: true }];
  };

  const breadcrumb = getBreadcrumb();

  // Hora en vivo (Montería, Colombia - UTC-5)
  const [liveTime, setLiveTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  const userInitial = user?.nombre?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const userAvatarUrl = user?.avatarUrl;

  return (
    <>
      {/* Mobile Hamburger Button (visible en topbar en móvil) */}
      <button
        type="button"
        className="mobile-hamburger"
        onClick={toggleDrawer}
        aria-label="Abrir menú"
        aria-expanded={drawerOpen}
      >
        <Icons.Menu />
      </button>

      {/* Drawer Overlay */}
      <div
        className={`drawer-overlay ${drawerOpen ? 'open' : ''}`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />

      {/* Main App Shell */}
      <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <aside
          className={`sidebar ${drawerOpen ? 'drawer-open' : ''}`}
          role="navigation"
          aria-label="Navegación principal"
        >
          {/* Sidebar Toggle Button (Desktop only) */}
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
          </button>

          {/* Brand */}
          <div className="brand">
            <span className="brand-mark">N</span>
            <span className="brand-text">NEON</span>
          </div>
          <div className="brand-subtitle">Gestión de mantenimiento</div>

          {/* Navigation */}
          <nav className="nav" aria-label="Menú principal">
            {visible.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeDrawer}
              >
                <item.icon />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer - User Card */}
          <div className="sidebar-foot">
            <div className="sidebar-user">
              <div className="user-avatar">
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt="" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.nombre || user?.email}</div>
                <div className="user-role">{user?.rol}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main">
          {/* Header Contextual (Topbar) */}
          <header className="topbar" role="banner">
            <div className="topbar-left">
              {/* Breadcrumb */}
              <nav className="breadcrumb" aria-label="Ruta de navegación">
                {breadcrumb.map((crumb, idx) => (
                  <span key={idx}>
                    {idx > 0 && <span className="breadcrumb-separator" aria-hidden="true">›</span>}
                    {crumb.to ? (
                      <NavLink to={crumb.to} className="breadcrumb-item" onClick={closeDrawer}>
                        {crumb.label}
                      </NavLink>
                    ) : (
                      <span className="breadcrumb-item current">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            <div className="topbar-center">
              {/* Ubicación y hora en vivo */}
              <div className="location-time">
                <Icons.MapPin />
                <span>Montería, Colombia</span>
                <span style={{color: 'var(--border-subtle)'}}>·</span>
                <span>{formatTime(liveTime)}</span>
              </div>

              {/* Estado del sistema */}
              <span className="status-pill">
                <Icons.CircleCheck />
                Gateway Activo
              </span>
            </div>

            <div className="topbar-right">
              {/* Campana de notificaciones + panel desplegable */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="topbar-btn"
                  title="Notificaciones"
                  aria-label={`Notificaciones${notifCount > 0 ? `, ${notifCount} nuevas` : ''}`}
                  aria-expanded={notifOpen}
                  onClick={toggleNotificaciones}
                >
                  <Icons.Bell />
                  {notifCount > 0 && (
                    <span className="notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '340px',
                      maxWidth: 'calc(100vw - 2rem)',
                      background: 'var(--glass-bg)',
                      backdropFilter: 'var(--glass-blur)',
                      border: 'var(--glass-border)',
                      borderRadius: 'var(--radius-card)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 100,
                      overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderBottom: 'var(--border-div)',
                      }}
                    >
                      <strong style={{ fontSize: '13px' }}>Notificaciones</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {notifCount} evento{notifCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                      {notifItems.length === 0 ? (
                        <p style={{ padding: '1.25rem 1rem', margin: 0, fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                          Sin notificaciones todavía. Se generan al crear, cerrar o cancelar órdenes.
                        </p>
                      ) : (
                        notifItems.map((n) => (
                          <div
                            key={n.id}
                            style={{
                              padding: '0.625rem 1rem',
                              borderBottom: 'var(--border-div)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                                {n.subject || n.event || 'Evento'}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {n.timestamp ? new Date(n.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            {n.text && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-wrap', maxHeight: '4.5em', overflow: 'hidden' }}>
                                {n.text}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                className="theme-toggle"
                title={theme === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                aria-label={theme === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                onClick={toggleTheme}
              >
                {theme === 'oscuro' ? <Icons.Sun /> : <Icons.Moon />}
              </button>

              {/* User Menu (el ref envuelve boton + dropdown para no cerrarlo antes del click) */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <div className="user-menu-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <div className="user-menu-avatar">
                    {userAvatarUrl ? <img src={userAvatarUrl} alt="" /> : userInitial}
                  </div>
                  <span className="user-menu-name">{user?.nombre || user?.email}</span>
                  <Icons.ChevronDown />
                </div>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    border: 'var(--glass-border)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.5rem',
                    minWidth: '200px',
                    zIndex: 100,
                    animation: 'fadeIn 0.15s ease'
                  }}
                >
                  <div style={{padding: '0.5rem 0.75rem', fontSize: '12px', color: 'var(--text-muted)', borderBottom: 'var(--border-div)', marginBottom: '0.25rem'}}>
                    {user?.email}
                  </div>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left'
                    }}
                    onClick={() => { setUserMenuOpen(false); navigate('/tecnico/perfil'); }}
                  >
                    <Icons.UserCog />
                    Perfil
                  </button>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#ff6b6b',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left'
                    }}
                    onClick={cerrarSesion}
                  >
                    <Icons.LogOut />
                    Cerrar sesión
                  </button>
                </div>
                )}
              </div>

              {/* Botón salir solo en desktop (redundante con user menu, pero lo mantenemos como fallback) */}
              {/* <button type="button" className="btn btn-ghost" onClick={cerrarSesion}>Salir</button> */}
            </div>
          </header>

          <main className="content" role="main">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom Navigation Bar (Móvil) */}
      <nav className="bottom-nav" aria-label="Navegación principal móvil">
        <div className="bottom-nav-inner">
          {bottomNavItems.map((item, idx) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={idx === 0}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={closeDrawer}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Toast container */}
      <div id="toast-root">
        <ToastList />
      </div>

      {/* Estilos inline para animación del dropdown */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}