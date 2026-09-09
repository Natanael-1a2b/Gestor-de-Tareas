import { create } from 'zustand';
import { toast } from 'sonner';
import { notificationRepository } from '../services/NotificationRepository';
import { isPushSupported, isIosNotInstalled as checkIosNotInstalled, isBraveBrowser, urlBase64ToUint8Array } from '../utils/push';

async function resubscribeSilently(): Promise<PushSubscription | null> {
  try {
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) return null;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    });

    await notificationRepository.subscribe(subscription.toJSON() as unknown as PushSubscriptionJSON);
    return subscription;
  } catch (error) {
    console.error('Error al re-suscribir notificaciones automáticamente:', error);
    return null;
  }
}

type BrowserPermission = NotificationPermission | 'unsupported';

interface NotificationState {
  browserPermission: BrowserPermission;
  isIosNotInstalled: boolean;
  isSubscribedOnThisDevice: boolean;
  leadDays: number;
  activeSubscriptionsCount: number | null;
  loading: boolean;

  checkStatus: () => Promise<void>;
  enablePush: () => Promise<void>;
  disablePush: () => Promise<void>;
  updateLeadDays: (days: number) => Promise<void>;
}

async function getLocalSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  browserPermission: isPushSupported() ? Notification.permission : 'unsupported',
  isIosNotInstalled: checkIosNotInstalled(),
  isSubscribedOnThisDevice: false,
  leadDays: 1,
  activeSubscriptionsCount: null,
  loading: false,

  checkStatus: async () => {
    if (!isPushSupported()) {
      set({ browserPermission: 'unsupported' });
      return;
    }

    set({ loading: true });
    try {
      const isIosBlocked = checkIosNotInstalled();
      const permission = Notification.permission;
      let subscription = permission === 'granted' ? await getLocalSubscription() : null;

      const settings = await notificationRepository.getSettings();

      // El usuario ya activó notificaciones antes (queda guardado por cuenta en
      // notification_settings.enabled), pero este dispositivo no tiene una
      // suscripción viva (reinstaló la app, limpió datos del navegador, etc.).
      // Como el permiso del navegador ya está concedido, no hace falta pedirle
      // nada de nuevo: nos volvemos a suscribir solos para que la preferencia
      // guardada se siga respetando sin que tenga que tocar el switch.
      if (!subscription && permission === 'granted' && settings.enabled && !isIosBlocked) {
        subscription = await resubscribeSilently();
      }

      const activeSubscriptionsCount = await notificationRepository.getActiveSubscriptionsCount();

      set({
        browserPermission: permission,
        isIosNotInstalled: isIosBlocked,
        isSubscribedOnThisDevice: !!subscription,
        leadDays: settings.lead_days,
        activeSubscriptionsCount,
      });
    } catch (error) {
      console.error('Error al consultar el estado de notificaciones:', error);
    } finally {
      set({ loading: false });
    }
  },

  enablePush: async () => {
    if (!isPushSupported()) {
      toast.error('Tu navegador no soporta notificaciones push.');
      return;
    }
    if (checkIosNotInstalled()) {
      toast.error('En iPhone/iPad necesitás instalar la app en tu pantalla de inicio primero.');
      return;
    }
    if (Notification.permission === 'denied') {
      toast.error('Las notificaciones están bloqueadas. Habilitalas desde la configuración de tu navegador.');
      return;
    }

    set({ loading: true });
    try {
      const permission = await Notification.requestPermission();
      set({ browserPermission: permission });
      if (permission !== 'granted') {
        toast.error('No se concedió el permiso de notificaciones.');
        return;
      }

      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error('Falta configurar VITE_VAPID_PUBLIC_KEY');

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      try {
        await notificationRepository.subscribe(subscription.toJSON() as unknown as PushSubscriptionJSON);
      } catch (error) {
        await subscription.unsubscribe();
        throw error;
      }

      await notificationRepository.updateSettings({ enabled: true, lead_days: get().leadDays || 1 });

      const activeSubscriptionsCount = await notificationRepository.getActiveSubscriptionsCount();
      set({ isSubscribedOnThisDevice: true, activeSubscriptionsCount, leadDays: get().leadDays || 1 });
      toast.success('Notificaciones activadas en este dispositivo');
    } catch (error) {
      console.error('Error al activar notificaciones:', error);

      const isPushServiceError = error instanceof DOMException && error.name === 'AbortError';
      if (isPushServiceError && (await isBraveBrowser())) {
        toast.error(
          'Brave bloquea el servicio de notificaciones por defecto. Activá "Use Google services for push messaging" en brave://settings/privacy y volvé a intentar.',
          { duration: 8000 }
        );
      } else {
        toast.error('No se pudieron activar las notificaciones');
      }
    } finally {
      set({ loading: false });
    }
  },

  disablePush: async () => {
    set({ loading: true });
    try {
      const subscription = await getLocalSubscription();
      if (subscription) {
        await notificationRepository.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }

      const activeSubscriptionsCount = await notificationRepository.getActiveSubscriptionsCount();
      set({ isSubscribedOnThisDevice: false, activeSubscriptionsCount });
      toast.success('Notificaciones desactivadas en este dispositivo');
    } catch (error) {
      console.error('Error al desactivar notificaciones:', error);
      toast.error('No se pudieron desactivar las notificaciones');
    } finally {
      set({ loading: false });
    }
  },

  updateLeadDays: async (days: number) => {
    const prev = get().leadDays;
    set({ leadDays: days });
    try {
      await notificationRepository.updateSettings({ enabled: true, lead_days: days });
      toast.success('Preferencia actualizada');
    } catch (error) {
      set({ leadDays: prev });
      console.error('Error al actualizar la anticipación:', error);
      toast.error('No se pudo actualizar la anticipación');
    }
  },
}));
