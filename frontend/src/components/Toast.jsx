// =============================================================================
// NEON :: frontend - Componente Toast (lista de notificaciones flotantes)
// =============================================================================

import { useEffect, useState } from 'react';
import { onToastChange, toast } from '../lib/toast.js';

const TYPE_CONFIG = {
  success: { borderColor: '#10b981', titleColor: '#10b981' },
  error: { borderColor: '#ff6b6b', titleColor: '#ff6b6b' },
  info: { borderColor: '#FF5E00', titleColor: '#FF5E00' },
};

export function ToastList() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = onToastChange((change) => {
      setToasts((prev) => {
        if (change.type === 'add') return [...prev, change.entry];
        return prev.filter((t) => t.id !== change.id);
      });
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.info;
        return (
          <div
            key={t.id}
            className="toast"
            role="alert"
            aria-live="polite"
          >
            <div className="toast-title" style={{ color: cfg.titleColor }}>
              {t.title}
            </div>
            {t.message && <div className="toast-message">{t.message}</div>}
          </div>
        );
      })}
    </div>
  );
}

export { toast };
