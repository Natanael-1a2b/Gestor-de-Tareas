import { useEffect } from 'react';
import { toast } from 'sonner';
import { CHANGELOG } from '../data/changelog';

const CHANGELOG_SEEN_KEY = 'gestor-changelog-seen';

/**
 * Muestra las novedades DESPUÉS de que la app ya se actualizó — a diferencia
 * de ReloadPrompt.tsx (que se dibuja con el código viejo, antes de instalar
 * la versión nueva), este componente corre ya con el código y el CHANGELOG
 * correctos, así que puede mostrar con certeza qué cambió.
 */
export function WhatsNewNotice() {
  useEffect(() => {
    const latest = CHANGELOG[0];
    if (!latest) return;

    let lastSeen: string | null = null;
    try {
      lastSeen = localStorage.getItem(CHANGELOG_SEEN_KEY);
    } catch {
      lastSeen = null;
    }

    // Primera visita registrada: no hay nada "nuevo" que anunciar todavía,
    // solo dejamos la marca para comparar contra la próxima actualización.
    if (lastSeen === null) {
      try {
        localStorage.setItem(CHANGELOG_SEEN_KEY, latest.date);
      } catch {
        // localStorage no disponible; no es crítico
      }
      return;
    }

    if (lastSeen === latest.date) return;

    const seenIndex = CHANGELOG.findIndex((entry) => entry.date === lastSeen);
    const unseenEntries = seenIndex === -1 ? CHANGELOG : CHANGELOG.slice(0, seenIndex);
    const unseenNotes = unseenEntries.flatMap((entry) => entry.notes);

    if (unseenNotes.length > 0) {
      toast.success('¡Novedades en esta actualización!', {
        description: unseenNotes.map((n) => `• ${n}`).join('\n'),
        duration: 10000,
      });
    }

    try {
      localStorage.setItem(CHANGELOG_SEEN_KEY, latest.date);
    } catch {
      // localStorage no disponible; no es crítico
    }
  }, []);

  return null;
}
