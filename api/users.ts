import { setCorsHeaders, getErrorMessage, type VercelRequest, type VercelResponse } from './_lib/types.js';
import { verifyUser, AuthError } from './_lib/verifyUser.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { isAdmin } from './_lib/isAdmin.js';

type AuditAction = 'update_email' | 'delete_user';

async function logAdminAction(
  adminClient: ReturnType<typeof getSupabaseAdmin>,
  entry: { adminEmail: string; action: AuditAction; targetUserId: string; targetEmail: string | null }
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
  setCorsHeaders(res, 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verificar quién está haciendo la solicitud
    const { user } = await verifyUser(req.headers.authorization);

    // Cliente de administración (puede saltarse el RLS)
    const adminClient = getSupabaseAdmin();

    // Verificar si el usuario es administrador (allowlist en la tabla admin_users)
    if (!(await isAdmin(adminClient, user.id))) {
      return res.status(403).json({ error: 'Prohibido: No tienes permisos de administrador.' });
    }

    // OBTENER LISTA DE USUARIOS
    if (req.method === 'GET') {
      const { data, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;
      return res.status(200).json(data.users);
    }

    // ACTUALIZAR CORREO DE UN USUARIO
    else if (req.method === 'PATCH') {
      const { id, email } = req.body;
      if (!id || !email) return res.status(400).json({ error: 'Falta el id o el email' });

      const { data, error } = await adminClient.auth.admin.updateUserById(id as string, { email: email as string });
      if (error) throw error;
      await logAdminAction(adminClient, {
        adminEmail: user.email ?? '',
        action: 'update_email',
        targetUserId: id as string,
        targetEmail: email as string,
      });
      return res.status(200).json({ success: true, user: data.user });
    }

    // ELIMINAR UN USUARIO
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta el id del usuario' });

      const { data: targetUser } = await adminClient.auth.admin.getUserById(id as string);
      const targetEmail = targetUser?.user?.email ?? null;

      const { error } = await adminClient.auth.admin.deleteUser(id as string);
      if (error) throw error;
      await logAdminAction(adminClient, {
        adminEmail: user.email ?? '',
        action: 'delete_user',
        targetUserId: id as string,
        targetEmail,
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error de API:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
