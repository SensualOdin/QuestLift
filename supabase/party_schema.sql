-- QuestFit Phase 2: Party & Social System Schema

-- Parties
create table public.parties (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  join_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Party Members
create table public.party_members (
  party_id uuid references public.parties on delete cascade not null,
  user_id uuid references public.users on delete cascade not null,
  role text default 'member', -- 'leader', 'member'
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (party_id, user_id)
);

-- Weekly Roast Reports (Generated server-side via Edge Function cron)
create table public.roast_reports (
  id uuid default gen_random_uuid() primary key,
  party_id uuid references public.parties on delete cascade not null,
  week_start timestamp with time zone not null,
  week_end timestamp with time zone not null,
  mvp_user_id uuid references public.users(id),
  slacker_user_id uuid references public.users(id),
  report_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Realtime PR Hypes (Ephemeral or persistent alerts)
create table public.pr_hypes (
  id uuid default gen_random_uuid() primary key,
  workout_set_id uuid references public.workout_sets on delete cascade not null,
  from_user_id uuid references public.users on delete cascade not null,
  to_user_id uuid references public.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (workout_set_id, from_user_id) -- one hype per set per user
);

-- Enable RLS
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.roast_reports enable row level security;
alter table public.pr_hypes enable row level security;

-- Policies
create policy "Users can view parties they belong to" on parties for select using (
  exists (select 1 from party_members pm where pm.party_id = id and pm.user_id = auth.uid())
);

create policy "Users can view members of their parties" on party_members for select using (
  exists (select 1 from party_members pm where pm.party_id = party_id and pm.user_id = auth.uid())
);

create policy "Users can view roast reports for their parties" on roast_reports for select using (
  exists (select 1 from party_members pm where pm.party_id = party_id and pm.user_id = auth.uid())
);

create policy "Users can hype PRs of their party members" on pr_hypes for insert with check (
  auth.uid() = from_user_id and
  exists (
    select 1 from party_members a join party_members b on a.party_id = b.party_id 
    where a.user_id = auth.uid() and b.user_id = to_user_id
  )
);
