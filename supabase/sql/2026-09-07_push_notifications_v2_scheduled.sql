-- v2: avisos independientes para "Fecha programada" (scheduled_date) ademas
-- de "Fecha limite" (due_date). Correr DESPUES de 2026-09-07_push_notifications.sql.
-- Reemplaza la tabla de deduplicacion y la funcion RPC del cron.

drop function if exists public.get_pending_due_notifications();
drop table if exists public.task_due_notifications;

create table public.task_due_notifications (
  task_id       uuid not null references public.tasks(id) on delete cascade,
  kind          text not null check (kind in ('scheduled', 'due')),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date_notified date not null,
  notified_at   timestamptz not null default now(),
  primary key (task_id, kind)
);

-- RLS activo SIN policies: solo accesible por service_role (usado por el cron).
alter table public.task_due_notifications enable row level security;

create or replace function public.get_pending_due_notifications()
returns table (
  task_id     uuid,
  user_id     uuid,
  title       text,
  kind        text,
  target_date date,
  lead_days   int
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.user_id, t.title, 'due'::text, t.due_date, ns.lead_days
  from public.tasks t
  join public.notification_settings ns
    on ns.user_id = t.user_id and ns.enabled = true
  left join public.task_due_notifications tdn
    on tdn.task_id = t.id and tdn.kind = 'due' and tdn.date_notified = t.due_date
  where t.due_date is not null
    and t.status not in ('Completadas', 'Canceladas', 'Archivada')
    and tdn.task_id is null
    and t.due_date <= (current_date + ns.lead_days)
    and t.due_date >= (current_date - 30)

  union all

  select t.id, t.user_id, t.title, 'scheduled'::text, t.scheduled_date, ns.lead_days
  from public.tasks t
  join public.notification_settings ns
    on ns.user_id = t.user_id and ns.enabled = true
  left join public.task_due_notifications tdn
    on tdn.task_id = t.id and tdn.kind = 'scheduled' and tdn.date_notified = t.scheduled_date
  where t.scheduled_date is not null
    and t.status not in ('Completadas', 'Canceladas', 'Archivada')
    and tdn.task_id is null
    and t.scheduled_date <= (current_date + ns.lead_days)
    and t.scheduled_date >= (current_date - 30);
$$;

revoke all on function public.get_pending_due_notifications() from public, anon, authenticated;
grant execute on function public.get_pending_due_notifications() to service_role;
