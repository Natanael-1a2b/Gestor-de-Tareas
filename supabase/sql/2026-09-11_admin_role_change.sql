-- Permite que la auditoria registre cuando un admin le da o le quita el rol
-- de admin a otro usuario (ver api/admin-roles.ts). No se toca RLS de
-- admin_users: sigue sin policy de insert/delete para "authenticated" a
-- proposito (nadie se auto-promueve); estos cambios los hace el endpoint
-- con la service_role key, ya gateado por isAdmin().
-- Correr manualmente en el SQL Editor de Supabase.

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check
  check (action in ('update_email', 'delete_user', 'grant_admin', 'revoke_admin'));
