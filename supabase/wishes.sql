-- Vœux et liste de souhaits, liés au compte connecté.
-- À coller dans le SQL Editor de Supabase, puis Run. Le script peut être relancé.

create table if not exists public.wishes (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  character_name text not null check (char_length(btrim(character_name)) > 0),
  total_wishes integer not null check (total_wishes >= 0),
  wished_on date not null,
  banner text not null default 'character',
  won boolean,
  primary key (user_id, id)
);

create table if not exists public.wishlist_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  item_type text not null check (item_type in ('character', 'weapon')),
  name text not null check (char_length(btrim(name)) > 0),
  target_count integer not null check (target_count between 1 and 7),
  estimated_release_date date,
  is_completed boolean not null default false,
  primary key (user_id, id)
);

alter table public.wishlist_items drop column if exists rarity;

alter table public.wishes add column if not exists won boolean;
alter table public.wishes alter column banner set default 'character';

update public.wishes
set banner = case lower(btrim(banner))
  when 'weapon' then 'weapon'
  when 'arme' then 'weapon'
  when 'standard' then 'standard'
  when 'perma' then 'standard'
  when 'chronicled' then 'chronicled'
  when 'nostalgie' then 'chronicled'
  when 'character' then 'character'
  when 'personnage' then 'character'
  else 'character'
end
where banner is null or banner not in ('character', 'weapon', 'standard', 'chronicled');

update public.wishes set won = null where banner = 'standard';
update public.wishes set won = true where banner <> 'standard' and won is null;

alter table public.wishes drop constraint if exists wishes_banner_check;
alter table public.wishes add constraint wishes_banner_check
  check (banner in ('character', 'weapon', 'standard', 'chronicled'));

alter table public.wishes enable row level security;
alter table public.wishlist_items enable row level security;

grant select, insert, update, delete on table public.wishes to authenticated;
grant select, insert, update, delete on table public.wishlist_items to authenticated;

drop policy if exists "wishes_select_own" on public.wishes;
create policy "wishes_select_own"
  on public.wishes for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "wishes_insert_own" on public.wishes;
create policy "wishes_insert_own"
  on public.wishes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "wishes_update_own" on public.wishes;
create policy "wishes_update_own"
  on public.wishes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "wishes_delete_own" on public.wishes;
create policy "wishes_delete_own"
  on public.wishes for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "wishlist_select_own" on public.wishlist_items;
create policy "wishlist_select_own"
  on public.wishlist_items for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "wishlist_insert_own" on public.wishlist_items;
create policy "wishlist_insert_own"
  on public.wishlist_items for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "wishlist_update_own" on public.wishlist_items;
create policy "wishlist_update_own"
  on public.wishlist_items for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "wishlist_delete_own" on public.wishlist_items;
create policy "wishlist_delete_own"
  on public.wishlist_items for delete to authenticated
  using (auth.uid() = user_id);
