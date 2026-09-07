import { setCorsHeaders, type VercelRequest, type VercelResponse } from './_lib/types';
import { verifyUser, AuthError } from './_lib/verifyUser';

interface SettingsBody {
  enabled?: boolean;
  lead_days?: number;
}

const DEFAULT_SETTINGS = { enabled: false, lead_days: 1 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'GET,OPTIONS,PUT');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { user, userClient } = await verifyUser(req.headers.authorization);

    if (req.method === 'GET') {
      const { data, error } = await userClient
        .from('notification_settings')
        .select('enabled, lead_days')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return res.status(200).json(data ?? DEFAULT_SETTINGS);
    }

    if (req.method === 'PUT') {
      const body = req.body as SettingsBody;
      const enabled = Boolean(body.enabled);
      const leadDays = Number(body.lead_days);

      if (!Number.isInteger(leadDays) || leadDays < 0 || leadDays > 30) {
        return res.status(400).json({ error: 'lead_days debe ser un entero entre 0 y 30' });
      }

      const { error } = await userClient.from('notification_settings').upsert(
        {
          user_id: user.id,
          enabled,
          lead_days: leadDays,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en /api/notification-settings:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Error interno del servidor' });
  }
}
