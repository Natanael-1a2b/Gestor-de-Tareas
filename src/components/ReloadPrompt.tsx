import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Loader2 } from 'lucide-react';

// Red de seguridad: si por lo que sea el navegador nunca dispara el evento
// "controlling" (ej. otra pestaña de la misma app bloqueando la activación del
// SW nuevo), forzamos igual el reload para que el botón nunca se sienta roto.
const FORCE_RELOAD_TIMEOUT_MS = 8000;

// Nota de diseño: este cartel lo dibuja el JS que YA está cargado (el viejo),
// antes de instalar el nuevo — así que nunca puede mostrar con certeza las
// notas de la versión que todavía no se descargó (el CHANGELOG importado acá
// quedaría congelado en el build viejo). El "qué hay de nuevo" real se
// muestra después de actualizar, ver WhatsNewNotice.tsx.

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Opcional: imprimir info sobre el SW
      console.log('SW Registered: ' + r);
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000); // Check every hour (mientras la pestaña siga abierta)

        // En PWA instaladas (mobile), el intervalo de arriba no alcanza: el SO
        // pausa los timers en segundo plano, así que la app puede quedarse
        // pegada en una versión vieja si nunca se la deja abierta 1h seguida.
        // Revisamos también cada vez que vuelve a primer plano.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            r.update();
          }
        });
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const close = () => {
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    setIsUpdating(true);
    updateServiceWorker(true);
    window.setTimeout(() => {
      window.location.reload();
    }, FORCE_RELOAD_TIMEOUT_MS);
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
            <p>Hay una versión nueva con novedades. Actualiza para verlas.</p>
          </div>
        </div>

        <div className="reload-prompt-actions">
          <button
            className="btn btn-secondary"
            onClick={close}
            disabled={isUpdating}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Más tarde
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpdate}
            disabled={isUpdating}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            {isUpdating ? (
              <>
                <Loader2 size={14} className="spin" style={{ marginRight: '6px' }} />
                Actualizando...
              </>
            ) : (
              'Actualizar ahora'
            )}
          </button>
        </div>

        <button className="reload-prompt-close" onClick={close} disabled={isUpdating} aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
