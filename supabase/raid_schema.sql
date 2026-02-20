-- QuestLift Phase 3: Raids Schema

-- Active and Past Raids
create table public.raids (
  id uuid default gen_random_uuid() primary key,
  party_id uuid references public.parties on delete cascade not null,
  boss_name text not null,
  boss_max_hp bigint not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null, -- usually Sunday midnight
  status text default 'active', -- 'active', 'defeated', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Damage dealt by users to specific raids
create table public.raid_damage (
  id uuid default gen_random_uuid() primary key,
  raid_id uuid references public.raids on delete cascade not null,
  user_id uuid references public.users on delete cascade not null,
  workout_id uuid references public.workouts on delete cascade not null,
  damage bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.raids enable row level security;
alter table public.raid_damage enable row level security;

-- Policies
create policy "Users can view raids for their party" on raids for select using (
  exists (select 1 from party_members pm where pm.party_id = raids.party_id and pm.user_id = auth.uid())
);

-- Raid damage: Users can insert damage for raids they belong to
create policy "Users can record raid damage" on raid_damage for insert with check (
  auth.uid() = user_id and
  exists (
    select 1 from raids r
    join party_members pm on r.party_id = pm.party_id
    where r.id = raid_damage.raid_id and pm.user_id = auth.uid()
  )
);

-- Raids: Party leaders can update raid status (e.g. defeated)
create policy "Users can update raids for their party" on raids for update using (
  exists (select 1 from party_members pm where pm.party_id = raids.party_id and pm.user_id = auth.uid())
);

create policy "Users can view damage for their party raids" on raid_damage for select using (
  exists (
    select 1 from raids r 
    join party_members pm on r.party_id = pm.party_id 
    where r.id = raid_damage.raid_id and pm.user_id = auth.uid()
  )
);
