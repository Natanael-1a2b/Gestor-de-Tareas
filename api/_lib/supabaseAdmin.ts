import { createClient } from '@supabase/supabase-js';

declare const process: { env: Record<string, string | undefined> };

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!serviceKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.');
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
