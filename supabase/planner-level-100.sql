-- Niveaux personnage 95 et 100 (Stella Fortuna orpheline). Les armes restent à 90.

alter table public.planner_characters drop constraint if exists planner_characters_current_level_check;
alter table public.planner_characters add constraint planner_characters_current_level_check
  check (current_level in (1, 20, 40, 50, 60, 70, 80, 90, 95, 100));

alter table public.planner_characters drop constraint if exists planner_characters_target_level_check;
alter table public.planner_characters add constraint planner_characters_target_level_check
  check (target_level in (1, 20, 40, 50, 60, 70, 80, 90, 95, 100));

notify pgrst, 'reload schema';
