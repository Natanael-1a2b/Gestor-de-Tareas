import { setCorsHeaders, getErrorMessage, type VercelRequest, type VercelResponse } from './_lib/types.js';
import { verifyUser, AuthError } from './_lib/verifyUser.js';

interface SubscriptionBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'GET,OPTIONS,POST,DELETE');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { user, userClient } = await verifyUser(req.headers.authorization);

    if (req.method === 'POST') {
      const body = req.body as SubscriptionBody;
      const endpoint = body.endpoint;
      const p256dh = body.keys?.p256dh;
      const authKey = body.keys?.auth;

      if (!endpoint || !p256dh || !authKey) {
        return res.status(400).json({ error: 'Falta endpoint o keys (p256dh/auth) de la suscripción' });
      }

      const userAgent = req.headers['user-agent'];
      const { error } = await userClient.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth_key: authKey,
          user_agent: typeof userAgent === 'string' ? userAgent : null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const endpoint = req.query.endpoint;
      if (!endpoint || Array.isArray(endpoint)) {
        return res.status(400).json({ error: 'Falta el parámetro endpoint' });
      }

      const { error } = await userClient.from('push_subscriptions').delete().eq('endpoint', endpoint);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const { count, error } = await userClient
        .from('push_subscriptions')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      return res.status(200).json({ activeSubscriptionsCount: count ?? 0 });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en /api/push-subscriptions:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
