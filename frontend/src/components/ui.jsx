// =============================================================================
// NEON :: frontend - Componentes de UI reutilizables
// =============================================================================

export function Badge({ value, tone }) {
  const clase = tone ? `badge badge-${tone}` : `badge badge-${String(value).toLowerCase()}`;
  return <span className={clase}>{String(value).replace(/_/g, ' ')}</span>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Spinner({ label = 'Cargando…' }) {
  return <div className="center muted" data-testid="spinner">{label}</div>;
}

export function ErrorBanner({ error, onClose }) {
  if (!error) return null;
  return (
    <div className="banner banner-error" role="alert">
      <span>{error.message || String(error)}</span>
      {onClose && (
        <button type="button" className="banner-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="center muted empty">{children}</div>;
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="banner-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint muted">{hint}</span>}
    </label>
  );
}
