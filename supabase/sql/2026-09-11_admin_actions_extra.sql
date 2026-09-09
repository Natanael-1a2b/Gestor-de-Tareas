-- Amplia la auditoria para las nuevas acciones del Panel Admin: editar
-- nombre, resetear contrasena y crear usuario (ver api/users.ts).
-- Correr DESPUES de 2026-09-11_admin_role_change.sql.

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check
  check (action in (
    'update_email', 'delete_user', 'grant_admin', 'revoke_admin',
    'update_name', 'reset_password', 'create_user'
  ));
