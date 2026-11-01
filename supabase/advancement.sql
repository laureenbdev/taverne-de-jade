-- Cases cochées de la page Progression, une ligne par compte.
-- À coller dans le SQL Editor de Supabase, puis Run. Le script peut être relancé.
-- Les prochaines entrées de la liste n'ont pas besoin d'une nouvelle colonne.

create table if not exists public.advancement_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  checked_ids text[] not null default '{}'
);

alter table public.advancement_progress enable row level security;

grant select, insert, update, delete on table public.advancement_progress to authenticated;

drop policy if exists "advancement_select_own" on public.advancement_progress;
create policy "advancement_select_own"
  on public.advancement_progress for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "advancement_insert_own" on public.advancement_progress;
create policy "advancement_insert_own"
  on public.advancement_progress for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "advancement_update_own" on public.advancement_progress;
create policy "advancement_update_own"
  on public.advancement_progress for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "advancement_delete_own" on public.advancement_progress;
create policy "advancement_delete_own"
  on public.advancement_progress for delete to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
