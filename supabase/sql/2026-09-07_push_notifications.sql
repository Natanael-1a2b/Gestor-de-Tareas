-- Notificaciones push para tareas próximas a vencer
-- Correr manualmente en el SQL Editor de Supabase (no hay migraciones automatizadas en este repo).

-- =========================================================
-- 1. Suscripciones push (múltiples por usuario/dispositivo)
-- =========================================================
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth_key     text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- =========================================================
-- 2. Preferencias de notificación por usuario
-- =========================================================
create table if not exists public.notification_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  enabled    boolean not null default false,
  lead_days  integer not null default 1 check (lead_days >= 0 and lead_days <= 30),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "notification_settings_select_own" on public.notification_settings;
create policy "notification_settings_select_own"
  on public.notification_settings for select
  using (auth.uid() = user_id);

drop policy if exists "notification_settings_insert_own" on public.notification_settings;
create policy "notification_settings_insert_own"
  on public.notification_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "notification_settings_update_own" on public.notification_settings;
create policy "notification_settings_update_own"
  on public.notification_settings for update
  using (auth.uid() = user_id);

-- =========================================================
-- 3. Deduplicación de avisos (tabla separada, NO columna en tasks)
-- =========================================================
create table if not exists public.task_due_notifications (
  task_id           uuid primary key references public.tasks(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  due_date_notified date not null,
  notified_at       timestamptz not null default now()
);

-- RLS activo SIN políticas: acceso denegado por defecto para anon/authenticated,
-- solo accesible por service_role (usado por el cron), que bypassea RLS.
alter table public.task_due_notifications enable row level security;

-- =========================================================
-- 4. Función que arma la lista de "candidatas a notificar" (usada solo por el cron)
-- =========================================================
create or replace function public.get_pending_due_notifications()
returns table (
  task_id    uuid,
  user_id    uuid,
  title      text,
  due_date   date,
  lead_days  int
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.user_id, t.title, t.due_date, ns.lead_days
  from public.tasks t
  join public.notification_settings ns
    on ns.user_id = t.user_id and ns.enabled = true
  left join public.task_due_notifications tdn
    on tdn.task_id = t.id and tdn.due_date_notified = t.due_date
  where t.due_date is not null
    and t.status not in ('Completadas', 'Canceladas', 'Archivada')
    and tdn.task_id is null
    and t.due_date <= (current_date + ns.lead_days)
    and t.due_date >= (current_date - 30); -- red de seguridad anti-flood tras un outage largo
$$;

revoke all on function public.get_pending_due_notifications() from public, anon, authenticated;
grant execute on function public.get_pending_due_notifications() to service_role;
