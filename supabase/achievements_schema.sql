-- =============================================================================
-- QuestLift Achievements Schema
-- =============================================================================

-- -----------------------------------------------------------------------------
-- achievements: master list of all earnable achievements
-- -----------------------------------------------------------------------------
create table public.achievements (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  icon text not null,                -- lucide icon name (e.g. 'sword', 'trophy', 'flame')
  category text not null,            -- 'workout', 'social', 'progression', 'raid'
  condition_type text not null,      -- type of check: 'workout_count', 'total_volume_single',
                                     -- 'streak_days', 'level_reached', 'pr_count',
                                     -- 'class_selected', 'raid_defeated', 'party_joined',
                                     -- 'comeback_triggered'
  condition_value integer not null,  -- threshold value
  reward_scraps integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -----------------------------------------------------------------------------
-- user_achievements: junction table tracking which users earned which achievements
-- -----------------------------------------------------------------------------
create table public.user_achievements (
  user_id uuid references public.users on delete cascade not null,
  achievement_id uuid references public.achievements on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, achievement_id)
);

-- =============================================================================
-- Row-Level Security
-- =============================================================================

-- achievements: public read access (anyone can browse the achievement catalogue)
alter table public.achievements enable row level security;

create policy "Achievements are viewable by everyone"
  on public.achievements
  for select
  using (true);

-- user_achievements: users can read and insert their own rows only
alter table public.user_achievements enable row level security;

create policy "Users can view their own earned achievements"
  on public.user_achievements
  for select
  using (auth.uid() = user_id);

create policy "Users can earn achievements for themselves"
  on public.user_achievements
  for insert
  with check (auth.uid() = user_id);
