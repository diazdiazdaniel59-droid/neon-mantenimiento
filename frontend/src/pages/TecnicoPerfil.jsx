import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { ErrorBanner, Field, PageHeader } from '../components/ui.jsx';
import { toast } from '../lib/toast.js';
import { playSound } from '../lib/sound.js';

const ESPECIALIDADES = ['Mecánica', 'Eléctrica', 'Sistemas', 'Fontanería', 'Climatización', 'Otros'];

export default function TecnicoPerfil() {
  const { user, logout } = useAuth();
  const firmaCanvasRef = useRef(null);
  const [nombre, setNombre] = useState(localStorage.getItem('neon_tec_nombre') || user?.nombre || '');
  const [especialidad, setEspecialidad] = useState(localStorage.getItem('neon_tec_especialidad') || '');
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('neon_tec_avatar') || '');
  const [densidad, setDensidad] = useState(localStorage.getItem('neon_tec_densidad') || 'comoda');
  const [sonido, setSonido] = useState(localStorage.getItem('neon_tec_sonido') === 'true');
  const [firmaData, setFirmaData] = useState(localStorage.getItem('neon_tec_firma') || '');
  const [dibujando, setDibujando] = useState(false);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [shakeFirma, setShakeFirma] = useState(false);

  useEffect(() => {
    if (user) {
      if (!nombre) setNombre(user.nombre || '');
      if (!avatarUrl) setAvatarUrl(user.avatarUrl || '');
    }
  }, [user, nombre, avatarUrl]);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      localStorage.setItem('neon_tec_nombre', nombre);
      localStorage.setItem('neon_tec_especialidad', especialidad);
      localStorage.setItem('neon_tec_avatar', avatarUrl);
      localStorage.setItem('neon_tec_densidad', densidad);
      localStorage.setItem('neon_tec_sonido', String(sonido));
      if (firmaData) localStorage.setItem('neon_tec_firma', firmaData);
    } finally {
      setGuardando(false);
      playSound("success");
      toast({
        title: "Ajustes guardados",
        message: "Ajustes de perfil actualizados exitosamente",
      });
      setGuardadoExito(true);
      setTimeout(() => setGuardadoExito(false), 1800);
    }
  };

  const comenzarDibujo = (e) => {
    setDibujando(true);
    const canvas = firmaCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const dibujandoEnCanvas = (e) => {
    if (!dibujando || !firmaCanvasRef.current) return;
    const canvas = firmaCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    if (!ctx || !rect) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const terminarDibujo = () => {
    setDibujando(false);
    const canvas = firmaCanvasRef.current;
    if (canvas) {
      setFirmaData(canvas.toDataURL('image/png'));
    }
  };

  const limpiarFirma = () => {
    playSound("warning");
    setShakeFirma(true);
    setTimeout(() => setShakeFirma(false), 500);
    const canvas = firmaCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setFirmaData('');
  };

  const toggleSonido = () => {
    const next = !sonido;
    setSonido(next);
    localStorage.setItem('neon_tec_sonido', String(next));
  };

  return (
    <>
      <PageHeader
        title="Perfil del Técnico"
        subtitle="Configuración de identidad, firma y preferencias visuales"
      />

      <ErrorBanner error={error} />

      {/* Bento Grid para el perfil */}
      <div className="bento-grid">
        {/* Tarjeta principal: Info personal + Avatar + Firma */}
        <div className="bento-card wide spotlight-card stagger-item" style={{'--staggerIndex': 0}}>
          <div className="card-head">
            <h3 className="card-title">Identidad y Firma</h3>
          </div>
          <div className="card-body">
            <form className="form" onSubmit={guardar}>
              <div className="grid-2">
                <Field label="Nombre visible">
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Tu nombre completo"
                  />
                </Field>

                <Field label="Especialidad técnica">
                  <select
                    value={especialidad}
                    onChange={(e) => setEspecialidad(e.target.value)}
                  >
                    <option value="">Seleccionar especialidad</option>
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Avatar (URL de imagen)">
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
                  <input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://ejemplo.com/avatar.jpg"
                    style={{flex: 1, minWidth: '200px'}}
                  />
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      style={{width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-subtle)'}}
                    />
                  )}
                </div>
              </Field>

              <Field label="Firma digital (canvas)">
                <canvas
                  ref={firmaCanvasRef}
                  width={500}
                  height={160}
                  className={shakeFirma ? 'shake' : ''}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    background: '#0A0A0A',
                    cursor: 'crosshair',
                    width: '100%',
                    maxWidth: '100%'
                  }}
                  onMouseDown={comenzarDibujo}
                  onMouseMove={dibujandoEnCanvas}
                  onMouseUp={terminarDibujo}
                  onMouseLeave={terminarDibujo}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setDibujando(true);
                    const canvas = firmaCanvasRef.current;
                    const ctx = canvas?.getContext('2d');
                    if (ctx) {
                      const rect = canvas.getBoundingClientRect();
                      const touch = e.touches[0];
                      ctx.beginPath();
                      ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                    }
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (!dibujando || !firmaCanvasRef.current) return;
                    const canvas = firmaCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const rect = canvas.getBoundingClientRect();
                    if (!ctx || !rect) return;
                    const touch = e.touches[0];
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.strokeStyle = '#000000';
                    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                    ctx.stroke();
                  }}
                  onTouchEnd={terminarDibujo}
                />
                {firmaData && (
                  <div style={{marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
                    <img src={firmaData} alt="Firma" style={{maxWidth: '250px', height: 'auto', borderRadius: '4px', border: '1px solid var(--border)'}} />
                  </div>
                )}
                <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap'}}>
                  <button
                    type="button"
                    className="btn btn-ghost danger"
                    onClick={limpiarFirma}
                  >
                    Limpiar firma
                  </button>
                </div>
              </Field>

              <div className="modal-actions" style={{marginTop: '1rem'}}>
                <button type="button" className="btn btn-ghost" onClick={() => logout()}>
                  Cerrar sesión
                </button>
                <button
                  type="submit"
                  className={`btn ${guardadoExito ? 'btn-success' : 'btn-primary'}`}
                  disabled={guardando}
                >
                  {guardadoExito ? '¡Cambios guardados! ✓' : guardando ? 'Guardando…' : 'Guardar ajustes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Tarjeta: Preferencias visuales */}
        <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 1}}>
          <div className="card-head">
            <h3 className="card-title">Preferencias Visuales</h3>
          </div>
          <div className="card-body">
            <div className="form" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <Field label="Densidad de tablas">
                <select
                  value={densidad}
                  onChange={(e) => setDensidad(e.target.value)}
                >
                  <option value="comoda">Cómoda (más espacio)</option>
                  <option value="compacta">Compacta (más filas por pantalla)</option>
                </select>
                <span className="field-hint">Afecta el padding de las tablas en todo el sistema.</span>
              </Field>

              <Field label="Alertas sonoras">
                <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={sonido}
                    onChange={toggleSonido}
                    style={{accentColor: '#FF5E00', width: '18px', height: '18px'}}
                  />
                  <span>Activar sonidos de notificación</span>
                </label>
              </Field>
            </div>
          </div>
          <div className="card-foot">
            <span>Se guardan automáticamente</span>
          </div>
        </div>

        {/* Tarjeta: Info de cuenta */}
        <div className="bento-card spotlight-card stagger-item" style={{'--staggerIndex': 2}}>
          <div className="card-head">
            <h3 className="card-title">Cuenta</h3>
          </div>
          <div className="card-body">
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-input)', border: 'var(--border)'}}>
                <div style={{width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', color: 'var(--text-inverse)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '1.25rem'}}>
                  {user?.nombre?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{fontWeight: 600, color: 'var(--text)'}}>{user?.nombre || user?.email}</div>
                  <div style={{fontSize: '13px', color: 'var(--text-secondary)'}}>{user?.email}</div>
                  <div style={{fontSize: '12px', color: 'var(--text-muted)', marginTop: '0.25rem'}}>Rol: <span style={{textTransform: 'capitalize'}}>{user?.rol}</span></div>
                </div>
              </div>
              <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>
                <strong>Último acceso:</strong> {new Date().toLocaleDateString('es-ES', {year: 'numeric', month: 'long', day: 'numeric'})}
              </div>
            </div>
          </div>
          <div className="card-foot">
            <button type="button" className="btn btn-ghost" onClick={() => logout()} style={{fontSize: '12px'}}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
}