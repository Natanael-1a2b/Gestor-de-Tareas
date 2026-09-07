import { setCorsHeaders, type VercelRequest, type VercelResponse } from './_lib/types';
import { verifyUser, AuthError } from './_lib/verifyUser';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

declare const process: { env: Record<string, string | undefined> };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const adminEmail = process.env.VITE_ADMIN_EMAIL;

    // Verificar quién está haciendo la solicitud
    const { user } = await verifyUser(req.headers.authorization);

    // Verificar si el usuario es el administrador
    if (user.email !== adminEmail) {
      return res.status(403).json({ error: 'Prohibido: No tienes permisos de administrador.' });
    }

    // Cliente de administración (puede saltarse el RLS)
    const adminClient = getSupabaseAdmin();

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
      return res.status(200).json({ success: true, user: data.user });
    }
    
    // ELIMINAR UN USUARIO
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta el id del usuario' });

      const { error } = await adminClient.auth.admin.deleteUser(id as string);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error de API:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Error interno del servidor' });
  }
}
