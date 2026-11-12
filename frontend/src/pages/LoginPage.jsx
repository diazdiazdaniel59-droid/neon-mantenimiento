import { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

// Canvas interactivo de fondo estilo Silvana - Nodos industriales con parallax
function LoginCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animationRef = useRef(null);
  const nodesRef = useRef([]);
  const timeRef = useRef(0);

  // Inicializar nodos
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Generar nodos (puntos industriales)
    const generateNodes = (width, height) => {
      const nodes = [];
      const count = Math.min(60, Math.floor((width * height) / 15000));

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 2 + 1,
          baseRadius: Math.random() * 2 + 1,
          hue: Math.random() * 30 + 15, // tonos naranja/ámbar
          opacity: Math.random() * 0.4 + 0.15,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.005 + 0.002,
        });
      }
      return nodes;
    };

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(dpr, dpr);
      nodesRef.current = generateNodes(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse parallax
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Animación
    const animate = (timestamp) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Fondo con gradiente sutil
      const gradient = ctx.createRadialGradient(
        width * 0.3, height * 0.3, 0,
        width * 0.3, height * 0.3, Math.max(width, height)
      );
      gradient.addColorStop(0, 'rgba(10, 5, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(5, 5, 5, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Actualizar tiempo
      timeRef.current = timestamp * 0.001;

      // Parallax offset basado en mouse
      const parallaxX = (mouseRef.current.x - 0.5) * 40;
      const parallaxY = (mouseRef.current.y - 0.5) * 40;

      // Dibujar conexiones y nodos
      const nodes = nodesRef.current;

      // Conexiones entre nodos cercanos
      ctx.strokeStyle = 'rgba(255, 94, 0, 0.08)';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];

        // Pulso de radio
        a.radius = a.baseRadius + Math.sin(timeRef.current * a.pulseSpeed * 1000 + a.pulsePhase) * 0.5;

        // Movimiento con parallax
        a.x += a.vx + parallaxX * 0.01;
        a.y += a.vy + parallaxY * 0.01;

        // Wrap around
        if (a.x < -50) a.x = width + 50;
        if (a.x > width + 50) a.x = -50;
        if (a.y < -50) a.y = height + 50;
        if (a.y > height + 50) a.y = -50;

        // Conexiones
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            const opacity = (1 - dist / 180) * 0.15;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Dibujar nodos
      for (const node of nodes) {
        const pulseOpacity = node.opacity + Math.sin(timeRef.current * node.pulseSpeed * 1000 + node.pulsePhase) * 0.1;
        ctx.globalAlpha = Math.max(0, Math.min(1, pulseOpacity));

        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius * 3
        );
        gradient.addColorStop(0, `hsla(${node.hue}, 100%, 60%, 1)`);
        gradient.addColorStop(1, `hsla(${node.hue}, 100%, 40%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo brillante
        ctx.globalAlpha = Math.max(0, Math.min(1, pulseOpacity * 1.5));
        ctx.fillStyle = `hsla(${node.hue}, 100%, 70%, 1)`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // Líneas de cuadrícula sutiles (estilo industrial)
      ctx.strokeStyle = 'rgba(255, 94, 0, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      const offsetX = (timeRef.current * 10) % gridSize;
      const offsetY = (timeRef.current * 5) % gridSize;

      for (let x = -offsetX; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = -offsetY; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="login-canvas" aria-hidden="true" />;
}

// Hero editorial lado izquierdo (estilo Silvana)
function LoginHero() {
  return (
    <div className="login-hero" aria-hidden="true">
      {/* Brand header */}
      <div className="brand-header">
        <span className="brand-mark">N</span>
        <span className="brand-text">NEON</span>
      </div>

      {/* Contenido hero */}
      <div className="login-hero-content">
        <h1 className="login-hero-title">Tu operación, bajo control.</h1>
        <p className="login-hero-subtitle">
          Sistema integral de gestión de mantenimiento para equipos industriales.
          Órdenes, activos, inventario y técnicos en una sola plataforma.
        </p>
      </div>

      {/* Footer con ambiente y avatares del equipo */}
      <div className="login-hero-footer">
        <span className="env-badge">Ambiente de demostración</span>
        <div className="team-avatars" role="img" aria-label="Equipo de desarrollo: Juan Luis De La Espriella y Daniel Díaz">
          <div className="team-avatar" title="Juan Luis De La Espriella">JL</div>
          <div className="team-avatar" title="Daniel Díaz">DD</div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const destino = location.state?.from?.pathname || '/';
  if (user) return <Navigate to={destino} replace />;

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      if (modo === 'login') await login(form.email, form.password);
      else await register(form.nombre, form.email, form.password);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err);
      setCargando(false);
    }
  };

  return (
    <div className="auth-screen">
      {/* Canvas interactivo de fondo */}
      <LoginCanvas />

      {/* Hero editorial (lado izquierdo en desktop) */}
      <LoginHero />

      {/* Tarjeta Glass flotante (lado derecho / centrada en móvil) */}
      <div className="auth-card" role="main">
        {/* Header de marca (visible solo en móvil/centrado) */}
        <div className="brand-header" style={{ marginBottom: '1.5rem' }}>
          <span className="brand-mark">N</span>
          <span className="brand-text">NEON</span>
        </div>

        {/* Subtítulo del sistema */}
        <p className="subtitle">Sistema de Gestión de Mantenimiento</p>

        {/* Selector de modo (segmented pill toggle) */}
        <div className="segmented-pill" role="tablist" aria-label="Modo de acceso">
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'login'}
            className={`pill-btn ${modo === 'login' ? 'active' : ''}`}
            onClick={() => {
              setModo('login');
              setError(null);
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'register'}
            className={`pill-btn ${modo === 'register' ? 'active' : ''}`}
            onClick={() => {
              setModo('register');
              setError(null);
            }}
          >
            Registrarse
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="banner banner-error mt-4" role="alert">
            {error.message || String(error)}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={onSubmit} className="auth-form">
          {modo === 'register' && (
            <>
              <label className="field">
                <span className="field-label">Nombre</span>
                <input
                  name="nombre"
                  className="auth-input"
                  value={form.nombre}
                  onChange={onChange}
                  minLength={2}
                  required
                  autoComplete="name"
                  placeholder="Tu nombre completo"
                />
              </label>
            </>
          )}
          <label className="field">
            <span className="field-label">Correo electrónico</span>
            <input
              name="email"
              type="email"
              className="auth-input"
              value={form.email}
              onChange={onChange}
              required
              autoComplete={modo === 'login' ? 'username' : 'email'}
              placeholder="correo@ejemplo.com"
            />
          </label>
          <label className="field">
            <span className="field-label">Contraseña</span>
            <input
              name="password"
              type="password"
              className="auth-input"
              value={form.password}
              onChange={onChange}
              required
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              minLength={modo === 'register' ? 8 : 1}
            />
          </label>

          <button
            type="submit"
            className="btn-auth"
            disabled={cargando}
          >
            {cargando ? (
              <>
                <span className="btn-spinner" style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle'
                }} />
                Procesando…
              </>
            ) : modo === 'login' ? (
              'Iniciar sesión →'
            ) : (
              'Crear cuenta →'
            )}
          </button>
        </form>

        {/* Footer de desarrollo */}
        <p className="footer-text">
          Administrador de desarrollo: <code>admin@neon.local</code> / <code>Admin12345</code>
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}