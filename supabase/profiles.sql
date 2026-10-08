-- Profil joueur : nom, langue, UID et serveur.
-- À coller dans le SQL Editor de Supabase, puis Run. Le script peut être relancé.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  language text not null default 'en' check (language in ('en', 'fr')),
  uid text check (uid is null or uid ~ '^[0-9]{9}$'),
  server text check (server is null or server in ('america', 'europe', 'asia', 'tw')),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles drop constraint if exists profiles_display_name_check;
alter table public.profiles
  add constraint profiles_display_name_check
  check (display_name is null or char_length(btrim(display_name)) between 2 and 24);

alter table public.profiles enable row level security;

grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_profiles_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Comptes déjà créés avant ce trigger.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
