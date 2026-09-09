import { setCorsHeaders, getErrorMessage, type VercelRequest, type VercelResponse } from './_lib/types.js';
import { verifyUser, AuthError } from './_lib/verifyUser.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { isAdmin } from './_lib/isAdmin.js';
import { sendPush } from './_lib/webpush.js';

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'OPTIONS,POST');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { user } = await verifyUser(req.headers.authorization);
    const adminClient = getSupabaseAdmin();

    if (!(await isAdmin(adminClient, user.id))) {
      return res.status(403).json({ error: 'Prohibido: No tienes permisos de administrador.' });
    }

    const { title, body } = req.body as { title?: string; body?: string };
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Falta title o body' });
    }

    const { data: subs, error: subsError } = await adminClient
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth_key');
    if (subsError) throw subsError;

    let sent = 0;
    let cleaned = 0;

    for (const sub of (subs ?? []) as PushSubscriptionRow[]) {
      const result = await sendPush(sub, { title, body });
      if (result.ok) {
        sent++;
      } else if (result.statusCode === 404 || result.statusCode === 410) {
        await adminClient.from('push_subscriptions').delete().eq('id', sub.id);
        cleaned++;
      }
    }

    return res.status(200).json({ targeted: subs?.length ?? 0, sent, cleaned });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en /api/admin-broadcast-push:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
