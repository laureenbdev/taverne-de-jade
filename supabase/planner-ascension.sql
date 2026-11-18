alter table public.planner_characters
  add column if not exists current_ascended boolean not null default false,
  add column if not exists target_ascended boolean not null default false,
  add column if not exists weapon_current_ascended boolean,
  add column if not exists weapon_target_ascended boolean;

notify pgrst, 'reload schema';
