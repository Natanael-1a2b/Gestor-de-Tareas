import { createClient } from '@supabase/supabase-js';

declare const process: { env: Record<string, string | undefined> };

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Valida el JWT del usuario y devuelve un cliente Supabase "scoped" (anon key +
 * el JWT del usuario en el header Authorization), para que sus queries respeten
 * RLS de forma nativa. NUNCA usa la service role key.
 */
export async function verifyUser(authHeader: string | string[] | undefined) {
  if (!authHeader || Array.isArray(authHeader)) {
    throw new AuthError(401, 'Falta el encabezado Authorization');
  }

  const token = authHeader.replace('Bearer ', '');
  const url = process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  const authClient = createClient(url, anonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);

  if (error || !user) {
    throw new AuthError(401, 'Token inválido o expirado');
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  return { user, userClient };
}
