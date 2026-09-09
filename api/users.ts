import { setCorsHeaders, getErrorMessage, type VercelRequest, type VercelResponse } from './_lib/types.js';
import { verifyUser, AuthError } from './_lib/verifyUser.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { isAdmin } from './_lib/isAdmin.js';

type AuditAction = 'update_email' | 'delete_user' | 'update_name' | 'reset_password' | 'create_user';

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
    const { user } = await verifyUser(req.headers.authorization);
    const adminClient = getSupabaseAdmin();

    if (!(await isAdmin(adminClient, user.id))) {
      return res.status(403).json({ error: 'Prohibido: No tienes permisos de administrador.' });
    }

    // OBTENER LISTA DE USUARIOS
    if (req.method === 'GET') {
      const { data, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;
      return res.status(200).json(data.users);
    }

    // CREAR UN USUARIO NUEVO
    if (req.method === 'POST') {
      const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
      if (!email || !password) return res.status(400).json({ error: 'Falta el correo o la contraseña' });
      if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: name ? { full_name: name } : undefined,
      });
      if (error) throw error;

      await logAdminAction(adminClient, {
        adminEmail: user.email ?? '',
        action: 'create_user',
        targetUserId: data.user.id,
        targetEmail: email,
      });
      return res.status(200).json({ success: true, user: data.user });
    }

    // ACTUALIZAR CORREO / NOMBRE / CONTRASEÑA DE UN USUARIO
    else if (req.method === 'PATCH') {
      const { id, email, name, password } = req.body as { id?: string; email?: string; name?: string; password?: string };
      if (!id) return res.status(400).json({ error: 'Falta el id del usuario' });
      if (!email && name === undefined && !password) {
        return res.status(400).json({ error: 'No se envió ningún cambio' });
      }

      if (email) {
        const { data, error } = await adminClient.auth.admin.updateUserById(id, { email });
        if (error) throw error;
        await logAdminAction(adminClient, {
          adminEmail: user.email ?? '',
          action: 'update_email',
          targetUserId: id,
          targetEmail: email,
        });
        return res.status(200).json({ success: true, user: data.user });
      }

      if (name !== undefined) {
        const { data: existing, error: fetchError } = await adminClient.auth.admin.getUserById(id);
        if (fetchError) throw fetchError;

        const { data, error } = await adminClient.auth.admin.updateUserById(id, {
          user_metadata: { ...existing.user?.user_metadata, full_name: name },
        });
        if (error) throw error;
        await logAdminAction(adminClient, {
          adminEmail: user.email ?? '',
          action: 'update_name',
          targetUserId: id,
          targetEmail: data.user?.email ?? null,
        });
        return res.status(200).json({ success: true, user: data.user });
      }

      if (password) {
        if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

        const { data, error } = await adminClient.auth.admin.updateUserById(id, { password });
        if (error) throw error;
        await logAdminAction(adminClient, {
          adminEmail: user.email ?? '',
          action: 'reset_password',
          targetUserId: id,
          targetEmail: data.user?.email ?? null,
        });
        return res.status(200).json({ success: true, user: data.user });
      }

      return res.status(400).json({ error: 'No se envió ningún cambio' });
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
