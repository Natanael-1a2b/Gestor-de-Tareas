-- Carpetas de notas (una carpeta por nota, no etiquetas multiples).
-- Correr manualmente en el SQL Editor de Supabase (no hay migraciones automatizadas en este repo).

create table if not exists public.note_folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#3b82f6',
  created_at timestamptz not null default now()
);

create index if not exists idx_note_folders_user_id on public.note_folders(user_id);

alter table public.note_folders enable row level security;

drop policy if exists "note_folders_select_own" on public.note_folders;
create policy "note_folders_select_own"
  on public.note_folders for select
  using (auth.uid() = user_id);

drop policy if exists "note_folders_insert_own" on public.note_folders;
create policy "note_folders_insert_own"
  on public.note_folders for insert
  with check (auth.uid() = user_id);

drop policy if exists "note_folders_update_own" on public.note_folders;
create policy "note_folders_update_own"
  on public.note_folders for update
  using (auth.uid() = user_id);

drop policy if exists "note_folders_delete_own" on public.note_folders;
create policy "note_folders_delete_own"
  on public.note_folders for delete
  using (auth.uid() = user_id);

-- notes.folder_id: una nota pertenece a lo sumo a una carpeta.
-- Desviacion deliberada de la convencion "on delete cascade" usada en las
-- otras tablas de este repo: al borrar una carpeta NO queremos borrar las
-- notas que contiene, solo desvincularlas (vuelven a "sin carpeta").
alter table public.notes
  add column if not exists folder_id uuid references public.note_folders(id) on delete set null;

create index if not exists idx_notes_folder_id on public.notes(folder_id);
