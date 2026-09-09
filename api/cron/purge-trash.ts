import { getErrorMessage, type VercelRequest, type VercelResponse } from '../_lib/types.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

declare const process: { env: Record<string, string | undefined> };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const admin = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

    const { error: tasksError, count: tasksDeleted } = await admin
      .from('tasks')
      .delete({ count: 'exact' })
      .lt('deleted_at', cutoff);
    if (tasksError) throw tasksError;

    const { error: notesError, count: notesDeleted } = await admin
      .from('notes')
      .delete({ count: 'exact' })
      .lt('deleted_at', cutoff);
    if (notesError) throw notesError;

    return res.status(200).json({ tasksDeleted: tasksDeleted ?? 0, notesDeleted: notesDeleted ?? 0 });
  } catch (error: unknown) {
    console.error('Error en /api/cron/purge-trash:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
