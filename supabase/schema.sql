-- QuestLift Supabase Schema

-- Users table linking to Supabase Auth
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text not null,
  avatar_url text,
  level integer default 1,
  xp_current integer default 0,
  class_name text, -- 'Tank', 'Rogue', 'Paladin', etc.
  str_volume_lifetime bigint default 0, -- Used for STR level
  dex_minutes_lifetime integer default 0, -- Used for DEX level
  con_sets_lifetime integer default 0, -- Used for CON level
  iron_scraps integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exercises directory
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null, -- 'Chest', 'Back', 'Legs', etc.
  equipment text, -- 'Barbell', 'Dumbbell', 'Machine', 'Bodyweight'
  exercise_type text not null, -- 'Strength', 'Cardio', 'Mobility'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workouts (sessions)
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  name text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  total_volume bigint default 0,
  xp_earned integer default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout Sets
create table public.workout_sets (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts on delete cascade not null,
  exercise_id uuid references public.exercises on delete cascade not null,
  set_order integer not null,
  weight numeric, -- Can be null for bodyweight or cardio
  reps integer, -- Or duration for cardio
  rpe numeric,
  is_pr boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

-- Policies

-- Users: Users can read and update their own profile, can read others.
create policy "Users can view all profiles" on users for select using (true);
create policy "Users can insert own profile" on users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Exercises: Read-only for all authenticated users
create policy "Exercises are viewable by all users" on exercises for select using (true);

-- Workouts: Users can only see and modify their own workouts
create policy "Users can view own workouts" on workouts for select using (auth.uid() = user_id);
create policy "Users can insert own workouts" on workouts for insert with check (auth.uid() = user_id);
create policy "Users can update own workouts" on workouts for update using (auth.uid() = user_id);
create policy "Users can delete own workouts" on workouts for delete using (auth.uid() = user_id);

-- Workout Sets: Access controlled through the parent workout's user_id
create policy "Users can view own workout sets" on workout_sets for select using (
  exists (select 1 from workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid())
);
create policy "Users can insert own workout sets" on workout_sets for insert with check (
  exists (select 1 from workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid())
);
create policy "Users can update own workout sets" on workout_sets for update using (
  exists (select 1 from workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid())
);
create policy "Users can delete own workout sets" on workout_sets for delete using (
  exists (select 1 from workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid())
);

-- Trigger to create user automatically on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
