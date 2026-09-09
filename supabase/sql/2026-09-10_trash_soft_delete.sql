-- Papelera con restaurar para tareas y notas: en vez de un DELETE real,
-- "eliminar" pasa a marcar deleted_at. Un cron (api/cron/purge-trash.ts)
-- purga definitivamente lo que lleva mas de 30 dias marcado.
-- Correr manualmente en el SQL Editor de Supabase (no hay migraciones
-- automatizadas en este repo).

alter table public.tasks add column if not exists deleted_at timestamptz;
create index if not exists idx_tasks_deleted_at on public.tasks(deleted_at);

alter table public.notes add column if not exists deleted_at timestamptz;
create index if not exists idx_notes_deleted_at on public.notes(deleted_at);
