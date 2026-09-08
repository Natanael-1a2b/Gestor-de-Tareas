-- Reemplaza el email de admin hardcodeado (VITE_ADMIN_EMAIL) por un allowlist
-- en base de datos, y agrega un log de auditoria para acciones de admin.
-- Correr manualmente en el SQL Editor de Supabase (no hay migraciones automatizadas en este repo).

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Unica policy: cada usuario autenticado solo puede ver SU PROPIA fila
-- (0 o 1 filas) -- suficiente para un check "soy admin?" en el cliente,
-- sin exponer el roster completo de admins a nadie.
-- Deliberadamente NO hay policy de insert/update/delete para "authenticated":
-- nadie puede auto-promoverse. Solo un humano corriendo SQL directo, o el
-- service_role key (usado por /api/users.ts y /api/admin-audit.ts), pueden
-- agregar/quitar admins.
drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own"
  on public.admin_users for select
  using (auth.uid() = user_id);

-- Bootstrap: agrega al admin actual (antes identificado por VITE_ADMIN_EMAIL)
-- para no perder acceso en el cutover. Descomenta y EDITA el email antes de
-- correr esto.
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'REEMPLAZA_CON_TU_EMAIL'
-- on conflict (user_id) do nothing;

create table if not exists public.admin_audit_log (
  id              uuid primary key default gen_random_uuid(),
  admin_email     text not null,
  action          text not null check (action in ('update_email', 'delete_user')),
  target_user_id  uuid,
  target_email    text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created_at on public.admin_audit_log(created_at);

-- RLS activo SIN policies: solo accesible por service_role (usado por
-- /api/users.ts y /api/admin-audit.ts). Ningun cliente consulta esta tabla
-- directamente, ni siquiera un admin autenticado via el cliente anon.
alter table public.admin_audit_log enable row level security;
