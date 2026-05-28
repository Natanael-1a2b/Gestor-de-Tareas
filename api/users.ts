import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const adminEmail = process.env.VITE_ADMIN_EMAIL;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Falta el encabezado Authorization' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseServiceKey) {
       return res.status(500).json({ error: 'Error del servidor: falta la clave de servicio (Service Role Key) en las variables de entorno.' });
    }

    // Verificar quién está haciendo la solicitud
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Verificar si el usuario es el administrador
    if (user.email !== adminEmail) {
      return res.status(403).json({ error: 'Prohibido: No tienes permisos de administrador.' });
    }

    // Cliente de administración (puede saltarse el RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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
      
      const { data, error } = await adminClient.auth.admin.updateUserById(id, { email });
      if (error) throw error;
      return res.status(200).json({ success: true, user: data.user });
    }
    
    // ELIMINAR UN USUARIO
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta el id del usuario' });

      const { data, error } = await adminClient.auth.admin.deleteUser(id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error de API:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
