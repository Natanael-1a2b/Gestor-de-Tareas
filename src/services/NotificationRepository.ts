import { supabase } from './supabase';

export interface NotificationSettings {
  enabled: boolean;
  lead_days: number;
}

const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');
  return session.access_token;
};

async function parseError(response: Response, fallback: string): Promise<never> {
  const err = await response.json().catch(() => ({}));
  throw new Error(err.error || fallback);
}

export const notificationRepository = {
  async subscribe(subscription: PushSubscriptionJSON): Promise<void> {
    const token = await getAuthToken();
    const response = await fetch('/api/push-subscriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
    if (!response.ok) await parseError(response, 'Error al registrar la suscripción push');
  },

  async unsubscribe(endpoint: string): Promise<void> {
    const token = await getAuthToken();
    const response = await fetch(`/api/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) await parseError(response, 'Error al eliminar la suscripción push');
  },

  async getActiveSubscriptionsCount(): Promise<number> {
    const token = await getAuthToken();
    const response = await fetch('/api/push-subscriptions', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) await parseError(response, 'Error al consultar las suscripciones activas');
    const data = await response.json();
    return data.activeSubscriptionsCount ?? 0;
  },

  async getSettings(): Promise<NotificationSettings> {
    const token = await getAuthToken();
    const response = await fetch('/api/notification-settings', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) await parseError(response, 'Error al consultar las preferencias de notificación');
    return response.json();
  },

  async updateSettings(settings: NotificationSettings): Promise<void> {
    const token = await getAuthToken();
    const response = await fetch('/api/notification-settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) await parseError(response, 'Error al actualizar las preferencias de notificación');
  },
};
