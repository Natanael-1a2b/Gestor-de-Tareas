import { setCorsHeaders, getErrorMessage, type VercelRequest, type VercelResponse } from './_lib/types.js';
import { verifyUser, AuthError } from './_lib/verifyUser.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { isAdmin } from './_lib/isAdmin.js';

async function logAdminAction(
  adminClient: ReturnType<typeof getSupabaseAdmin>,
  entry: { adminEmail: string; action: 'grant_admin' | 'revoke_admin'; targetUserId: string; targetEmail: string | null }
): Promise<void> {
  const { error } = await adminClient.from('admin_audit_log').insert({
    admin_email: entry.adminEmail,
    action: entry.action,
    target_user_id: entry.targetUserId,
    target_email: entry.targetEmail,
  });
  if (error) console.error('Error al registrar auditoría de admin:', error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'GET,OPTIONS,POST,DELETE');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { user } = await verifyUser(req.headers.authorization);
    const adminClient = getSupabaseAdmin();

    if (!(await isAdmin(adminClient, user.id))) {
      return res.status(403).json({ error: 'Prohibido: No tienes permisos de administrador.' });
    }

    if (req.method === 'GET') {
      const { data, error } = await adminClient.from('admin_users').select('user_id');
      if (error) throw error;
      return res.status(200).json({ adminIds: (data ?? []).map((row) => row.user_id as string) });
    }

    if (req.method === 'POST') {
      const { userId, targetEmail } = req.body as { userId?: string; targetEmail?: string };
      if (!userId) return res.status(400).json({ error: 'Falta el userId' });

      const { error } = await adminClient.from('admin_users').upsert({ user_id: userId }, { onConflict: 'user_id' });
      if (error) throw error;

      await logAdminAction(adminClient, {
        adminEmail: user.email ?? '',
        action: 'grant_admin',
        targetUserId: userId,
        targetEmail: targetEmail ?? null,
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id, targetEmail } = req.query;
      if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Falta el id del usuario' });

      if (id === user.id) {
        return res.status(400).json({ error: 'No podés quitarte tu propio rol de administrador.' });
      }

      const { error } = await adminClient.from('admin_users').delete().eq('user_id', id);
      if (error) throw error;

      await logAdminAction(adminClient, {
        adminEmail: user.email ?? '',
        action: 'revoke_admin',
        targetUserId: id,
        targetEmail: typeof targetEmail === 'string' ? targetEmail : null,
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en /api/admin-roles:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
