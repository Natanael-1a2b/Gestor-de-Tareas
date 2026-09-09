import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Loader2, Sparkles } from 'lucide-react';
import { CHANGELOG } from '../data/changelog';

// Red de seguridad: si por lo que sea el navegador nunca dispara el evento
// "controlling" (ej. otra pestaña de la misma app bloqueando la activación del
// SW nuevo), forzamos igual el reload para que el botón nunca se sienta roto.
const FORCE_RELOAD_TIMEOUT_MS = 8000;
const CHANGELOG_SEEN_KEY = 'gestor-changelog-seen';

// Junta las notas de todas las entradas mas nuevas que la ultima que el
// usuario llego a ver, en vez de mostrar solo CHANGELOG[0] — asi no se pierden
// novedades de deploys intermedios si postergo la actualizacion varias veces.
function getUnseenNotes(): string[] {
  let lastSeen: string | null = null;
  try {
    lastSeen = localStorage.getItem(CHANGELOG_SEEN_KEY);
  } catch {
    lastSeen = null;
  }

  if (lastSeen === null) {
    return CHANGELOG[0]?.notes ?? [];
  }

  const seenIndex = CHANGELOG.findIndex((entry) => entry.date === lastSeen);
  const unseenEntries = seenIndex === -1 ? CHANGELOG : CHANGELOG.slice(0, seenIndex);
  return unseenEntries.flatMap((entry) => entry.notes);
}

function markChangelogSeen(): void {
  try {
    if (CHANGELOG[0]) localStorage.setItem(CHANGELOG_SEEN_KEY, CHANGELOG[0].date);
  } catch {
    // localStorage no disponible; no es critico
  }
}

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
    markChangelogSeen();
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    markChangelogSeen();
    setIsUpdating(true);
    updateServiceWorker(true);
    window.setTimeout(() => {
      window.location.reload();
    }, FORCE_RELOAD_TIMEOUT_MS);
  };

  if (!needRefresh) return null;

  const latestNotes = getUnseenNotes();

  return (
    <div className="reload-prompt-container">
      <div className="reload-prompt-card">
        <div className="reload-prompt-content">
          <div className="reload-prompt-icon">
            <RefreshCw size={24} className="spin-slow" />
          </div>
          <div className="reload-prompt-text">
            <h4>¡Nueva actualización disponible!</h4>
            <p>Hay una versión nueva de la app lista para instalar.</p>
          </div>
        </div>

        {latestNotes.length > 0 && (
          <div className="reload-prompt-notes">
            <span className="reload-prompt-notes-title">
              <Sparkles size={13} /> Novedades
            </span>
            <ul>
              {latestNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}

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
