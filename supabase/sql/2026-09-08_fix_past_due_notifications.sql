-- Fix: las notificaciones seguian llegando para tareas/eventos con fecha limite
-- o programada YA PASADA. La v2 permitia due_date/scheduled_date hasta 30 dias
-- en el pasado ("red anti-flood tras un outage"), pero eso hace que cualquier
-- tarea vencida y no completada siga generando avisos de "proxima a vencer".
-- Correr DESPUES de 2026-09-07_push_notifications_v2_scheduled.sql.

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
    and t.due_date >= current_date

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
    and t.scheduled_date >= current_date;
$$;

revoke all on function public.get_pending_due_notifications() from public, anon, authenticated;
grant execute on function public.get_pending_due_notifications() to service_role;
