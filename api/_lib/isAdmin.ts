import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Consulta el allowlist admin_users usando el client de service-role ya
 * instanciado (bypassea RLS, no depende de ninguna policy).
 */
export async function isAdmin(adminClient: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await adminClient
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
