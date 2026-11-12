import { useEffect, useRef } from 'react';

const STYLE_ID = 'glass-confirm-modal-styles';

const STYLE_CSS = `
  @keyframes glassConfirmIn {
    from { transform: scale(0.92); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes glassConfirmPulse {
    0% { box-shadow: 0 0 0 0 var(--glass-pulse-color); }
    70% { box-shadow: 0 0 0 14px var(--glass-pulse-color); }
    100% { box-shadow: 0 0 0 0 var(--glass-pulse-color); }
  }
`;

/**
 * Modal de confirmacion con estetica glassmorphism.
 * Props: isOpen, onClose, onConfirm, title, message, identifier (opcional),
 * type ("danger" | "warning", default "danger").
 */
export function GlassConfirmModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirmar accion',
  message = '',
  identifier,
  type = 'danger',
}) {
  const isDanger = type === 'danger';
  const overlayRef = useRef(null);

  const dangerColor = '#ef4444';
  const warningColor = '#f59e0b';
  const iconColor = isDanger ? dangerColor : warningColor;
  const confirmColor = isDanger ? dangerColor : '#2563eb';

  // Inyectar keyframes una sola vez
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = STYLE_CSS;
      document.head.appendChild(style);
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (event) => {
    // Clic fuera de la tarjeta cierra el modal
    if (event.target === overlayRef.current) {
      onClose?.();
    }
  };

  const handleCardClick = (event) => {
    event.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="glass-confirm-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        outline: 'none',
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          background: 'rgba(20, 20, 24, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow:
            'inset 0 0 24px rgba(255, 255, 255, 0.12), 0 20px 40px rgba(0, 0, 0, 0.55)',
          padding: '1.5rem',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          color: '#ffffff',
          animation: 'glassConfirmIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={handleCardClick}
      >
        {/* Icono animado superior */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: `2px solid ${iconColor}`,
            margin: '0 auto 1rem',
            boxShadow: isDanger ? `0 0 0 0 ${dangerColor}` : undefined,
            animation: isDanger ? 'glassConfirmPulse 2s infinite' : undefined,
            '--glass-pulse-color': isDanger ? dangerColor : warningColor,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'block' }}
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>

        <h2
          id="glass-confirm-modal-title"
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            margin: '0 0 0.5rem',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.5',
            margin: '0 0 1rem',
          }}
        >
          {message}
        </p>

        {/* Badge con el identificador (opcional) */}
        {identifier && (
          <span
            style={{
              display: 'inline-block',
              marginBottom: '1rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.06)',
              fontSize: '0.7rem',
              fontWeight: '600',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            {identifier}
          </span>
        )}

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              padding: '0.625rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onConfirm?.();
            }}
            style={{
              background: confirmColor,
              border: 'none',
              color: '#ffffff',
              padding: '0.625rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow:
                isDanger ? `0 0 16px rgba(239, 68, 68, 0.55)` : '0 0 12px rgba(37, 99, 235, 0.45)',
            }}
          >
            Confirmar Accion
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlassConfirmModal;
