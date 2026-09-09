-- Extiende la papelera con restaurar (ver 2026-09-10_trash_soft_delete.sql)
-- a Habitos. Los habit_logs de un habito trasheado no necesitan tratamiento
-- especial: al desaparecer el habito de la lista activa, sus logs quedan
-- sin usar hasta que se restaure, y vuelven a verse tal cual estaban.
-- Correr manualmente en el SQL Editor de Supabase.

alter table public.habits add column if not exists deleted_at timestamptz;
create index if not exists idx_habits_deleted_at on public.habits(deleted_at);
