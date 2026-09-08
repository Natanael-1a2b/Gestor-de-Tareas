import { setCorsHeaders, getErrorMessage, type VercelRequest, type VercelResponse } from './_lib/types.js';
import { verifyUser, AuthError } from './_lib/verifyUser.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { isAdmin } from './_lib/isAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { user } = await verifyUser(req.headers.authorization);
    const adminClient = getSupabaseAdmin();

    if (!(await isAdmin(adminClient, user.id))) {
      return res.status(403).json({ error: 'Prohibido: No tienes permisos de administrador.' });
    }

    const { data, error } = await adminClient
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.status(200).json(data);

  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error de API:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
