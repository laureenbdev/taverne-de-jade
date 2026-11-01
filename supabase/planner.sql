-- Personnages du planificateur, liés au compte connecté.
-- À coller dans le SQL Editor de Supabase, puis Run. Le script peut être relancé.

create table if not exists public.planner_characters (
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id text not null check (char_length(btrim(character_id)) > 0),
  current_level integer not null check (current_level in (1, 20, 40, 50, 60, 70, 80, 90)),
  target_level integer not null check (target_level in (1, 20, 40, 50, 60, 70, 80, 90)),
  weapon_id text,
  weapon_level integer,
  weapon_current_level integer,
  weapon_target_level integer,
  talent_normal integer not null default 1,
  talent_skill integer not null default 1,
  talent_burst integer not null default 1,
  talent_normal_current integer not null default 1,
  talent_normal_target integer not null default 1,
  talent_skill_current integer not null default 1,
  talent_skill_target integer not null default 1,
  talent_burst_current integer not null default 1,
  talent_burst_target integer not null default 1,
  artifact_set text,
  primary key (user_id, character_id),
  check (target_level >= current_level)
);

alter table public.planner_characters
  add column if not exists weapon_id text,
  add column if not exists weapon_level integer,
  add column if not exists talent_normal integer not null default 1,
  add column if not exists talent_skill integer not null default 1,
  add column if not exists talent_burst integer not null default 1,
  add column if not exists artifact_set text;

alter table public.planner_characters drop constraint if exists planner_weapon_level_check;
alter table public.planner_characters add constraint planner_weapon_level_check
  check (weapon_level is null or weapon_level in (1, 20, 40, 50, 60, 70, 80, 90));

alter table public.planner_characters drop constraint if exists planner_talent_normal_check;
alter table public.planner_characters add constraint planner_talent_normal_check
  check (talent_normal between 1 and 10);

alter table public.planner_characters drop constraint if exists planner_talent_skill_check;
alter table public.planner_characters add constraint planner_talent_skill_check
  check (talent_skill between 1 and 10);

alter table public.planner_characters drop constraint if exists planner_talent_burst_check;
alter table public.planner_characters add constraint planner_talent_burst_check
  check (talent_burst between 1 and 10);

alter table public.planner_characters
  add column if not exists weapon_current_level integer,
  add column if not exists weapon_target_level integer,
  add column if not exists talent_normal_current integer not null default 1,
  add column if not exists talent_normal_target integer not null default 1,
  add column if not exists talent_skill_current integer not null default 1,
  add column if not exists talent_skill_target integer not null default 1,
  add column if not exists talent_burst_current integer not null default 1,
  add column if not exists talent_burst_target integer not null default 1;

update public.planner_characters
set
  weapon_target_level = coalesce(weapon_target_level, weapon_level),
  weapon_current_level = coalesce(weapon_current_level, 1)
where weapon_id is not null;

update public.planner_characters
set
  talent_normal_target = case when talent_normal_target = 1 and talent_normal > 1 then talent_normal else talent_normal_target end,
  talent_skill_target = case when talent_skill_target = 1 and talent_skill > 1 then talent_skill else talent_skill_target end,
  talent_burst_target = case when talent_burst_target = 1 and talent_burst > 1 then talent_burst else talent_burst_target end;

alter table public.planner_characters drop constraint if exists planner_weapon_current_level_check;
alter table public.planner_characters add constraint planner_weapon_current_level_check
  check (weapon_current_level is null or weapon_current_level in (1, 20, 40, 50, 60, 70, 80, 90));

alter table public.planner_characters drop constraint if exists planner_weapon_target_level_check;
alter table public.planner_characters add constraint planner_weapon_target_level_check
  check (weapon_target_level is null or weapon_target_level in (1, 20, 40, 50, 60, 70, 80, 90));

alter table public.planner_characters drop constraint if exists planner_talent_normal_current_check;
alter table public.planner_characters add constraint planner_talent_normal_current_check
  check (talent_normal_current between 1 and 10);

alter table public.planner_characters drop constraint if exists planner_talent_normal_target_check;
alter table public.planner_characters add constraint planner_talent_normal_target_check
  check (talent_normal_target between 1 and 10);

alter table public.planner_characters drop constraint if exists planner_talent_skill_current_check;
alter table public.planner_characters add constraint planner_talent_skill_current_check
  check (talent_skill_current between 1 and 10);

alter table public.planner_characters drop constraint if exists planner_talent_skill_target_check;
alter table public.planner_characters add constraint planner_talent_skill_target_check
  check (talent_skill_target between 1 and 10);

alter table public.planner_characters drop constraint if exists planner_talent_burst_current_check;
alter table public.planner_characters add constraint planner_talent_burst_current_check
  check (talent_burst_current between 1 and 10);

alter table public.planner_characters drop constraint if exists planner_talent_burst_target_check;
alter table public.planner_characters add constraint planner_talent_burst_target_check
  check (talent_burst_target between 1 and 10);

alter table public.planner_characters enable row level security;

grant select, insert, update, delete on table public.planner_characters to authenticated;

drop policy if exists "planner_select_own" on public.planner_characters;
create policy "planner_select_own"
  on public.planner_characters for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "planner_insert_own" on public.planner_characters;
create policy "planner_insert_own"
  on public.planner_characters for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "planner_update_own" on public.planner_characters;
create policy "planner_update_own"
  on public.planner_characters for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "planner_delete_own" on public.planner_characters;
create policy "planner_delete_own"
  on public.planner_characters for delete to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
