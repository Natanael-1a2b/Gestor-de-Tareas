import * as webpush from 'web-push';

declare const process: { env: Record<string, string | undefined> };

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const contactEmail = process.env.VAPID_CONTACT_EMAIL || process.env.VITE_ADMIN_EMAIL || '';

  if (!publicKey || !privateKey) {
    throw new Error('Faltan VITE_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en las variables de entorno.');
  }

  webpush.setVapidDetails(`mailto:${contactEmail}`, publicKey, privateKey);
  configured = true;
}

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export interface PushResult {
  ok: boolean;
  statusCode?: number;
}

export async function sendPush(sub: PushSubscriptionRow, payload: object): Promise<PushResult> {
  ensureConfigured();

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    return { ok: false, statusCode };
  }
}
