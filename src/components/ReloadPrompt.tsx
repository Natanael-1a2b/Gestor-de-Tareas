import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Opcional: imprimir info sobre el SW
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="reload-prompt-container">
      <div className="reload-prompt-card">
        <div className="reload-prompt-content">
          <div className="reload-prompt-icon">
            <RefreshCw size={24} className="spin-slow" />
          </div>
          <div className="reload-prompt-text">
            <h4>¡Nueva actualización disponible!</h4>
            <p>Se han añadido nuevas funciones. Actualiza para verlas.</p>
          </div>
        </div>
        
        <div className="reload-prompt-actions">
          <button className="btn btn-secondary" onClick={close} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Más tarde
          </button>
          <button className="btn btn-primary" onClick={() => updateServiceWorker(true)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Actualizar ahora
          </button>
        </div>
        
        <button className="reload-prompt-close" onClick={close} aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
