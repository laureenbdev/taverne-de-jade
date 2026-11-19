-- Droits + RLS pour que le client Supabase (anon / authenticated) puisse
-- lire et écrire les tables utilisées par l'app.
-- À exécuter une fois dans : Supabase Dashboard → SQL Editor → Run

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.profiles to anon, authenticated;
grant select, insert, update, delete on table public.wishes to anon, authenticated;
grant select, insert, update, delete on table public.planner_characters to anon, authenticated;
grant select, insert, update, delete on table public.wishlist_items to anon, authenticated;
grant select, insert, update, delete on table public.advancement_progress to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.wishes enable row level security;
alter table public.planner_characters enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.advancement_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "wishes_select_own" on public.wishes;
drop policy if exists "wishes_insert_own" on public.wishes;
drop policy if exists "wishes_update_own" on public.wishes;
drop policy if exists "wishes_delete_own" on public.wishes;
create policy "wishes_select_own" on public.wishes
  for select to authenticated using (auth.uid() = user_id);
create policy "wishes_insert_own" on public.wishes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "wishes_update_own" on public.wishes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wishes_delete_own" on public.wishes
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "planner_select_own" on public.planner_characters;
drop policy if exists "planner_insert_own" on public.planner_characters;
drop policy if exists "planner_update_own" on public.planner_characters;
drop policy if exists "planner_delete_own" on public.planner_characters;
create policy "planner_select_own" on public.planner_characters
  for select to authenticated using (auth.uid() = user_id);
create policy "planner_insert_own" on public.planner_characters
  for insert to authenticated with check (auth.uid() = user_id);
create policy "planner_update_own" on public.planner_characters
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "planner_delete_own" on public.planner_characters
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "wishlist_select_own" on public.wishlist_items;
drop policy if exists "wishlist_insert_own" on public.wishlist_items;
drop policy if exists "wishlist_update_own" on public.wishlist_items;
drop policy if exists "wishlist_delete_own" on public.wishlist_items;
create policy "wishlist_select_own" on public.wishlist_items
  for select to authenticated using (auth.uid() = user_id);
create policy "wishlist_insert_own" on public.wishlist_items
  for insert to authenticated with check (auth.uid() = user_id);
create policy "wishlist_update_own" on public.wishlist_items
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wishlist_delete_own" on public.wishlist_items
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "advancement_select_own" on public.advancement_progress;
drop policy if exists "advancement_insert_own" on public.advancement_progress;
drop policy if exists "advancement_update_own" on public.advancement_progress;
drop policy if exists "advancement_delete_own" on public.advancement_progress;
create policy "advancement_select_own" on public.advancement_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "advancement_insert_own" on public.advancement_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "advancement_update_own" on public.advancement_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "advancement_delete_own" on public.advancement_progress
  for delete to authenticated using (auth.uid() = user_id);
