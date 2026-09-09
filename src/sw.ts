/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Punto de inyección: vite-plugin-pwa reemplaza esto por el manifest de precache real en build.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

clientsClaim();

// No llamar self.skipWaiting() automáticamente: si lo hacemos, el SW nuevo se
// activa solo y nunca queda en estado "waiting", así que ReloadPrompt.tsx
// nunca detecta needRefresh y el usuario se queda con el bundle JS viejo en
// memoria sin que se le avise. Solo activamos cuando el usuario confirma
// "Actualizar ahora" (updateServiceWorker(true) manda este mensaje).
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

interface PushPayload {
  title?: string;
  body?: string;
  taskId?: string;
}

function parsePushPayload(event: PushEvent): PushPayload {
  try {
    return event.data ? (event.data.json() as PushPayload) : {};
  } catch {
    return { title: 'Gestor de Tareas', body: event.data?.text() || 'Tienes una nueva notificación.' };
  }
}

self.addEventListener('push', (event: PushEvent) => {
  const payload = parsePushPayload(event);

  const title = payload.title || 'Tarea próxima a vencer';
  const taskId = payload.taskId;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: taskId ? `task-${taskId}` : undefined,
      data: { taskId },
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const taskId = event.notification.data?.taskId;
  const targetUrl = taskId ? `/?taskId=${taskId}` : '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = allClients.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) {
        existing.focus();
        existing.postMessage({ type: 'OPEN_TASK', taskId });
      } else {
        self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// Red de seguridad: si el navegador rota la suscripción por su cuenta, hay que
// re-suscribir con la misma clave pública y avisarle al backend del nuevo endpoint.
self.addEventListener('pushsubscriptionchange', (event: Event) => {
  const pushEvent = event as unknown as { newSubscription?: PushSubscription; oldSubscription?: PushSubscription; waitUntil: (p: Promise<unknown>) => void };

  pushEvent.waitUntil(
    (async () => {
      const applicationServerKey = pushEvent.oldSubscription?.options?.applicationServerKey;
      if (!applicationServerKey) return;

      const newSubscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscription.toJSON()),
      }).catch(() => {
        // Sin sesión disponible en el SW para reautenticar; se perderá esta suscripción
        // y el usuario tendrá que reactivar manualmente desde /ajustes.
      });
    })()
  );
});
