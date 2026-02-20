# QuestLift: Full Game Loop Completion Design

## Overview

Expand QuestLift from a functional workout tracker into a complete gamified fitness RPG by adding content depth, an achievement system, social engagement features, and onboarding polish.

---

## Pillar 1: Content Foundation

### Exercise Seed Data

Add 60+ exercises covering all categories. Stored as a SQL seed file to run after schema setup.

**Chest:** Barbell Bench Press, Incline Barbell Bench, Dumbbell Bench Press, Incline Dumbbell Press, Cable Fly, Pec Deck, Dips (Chest), Push-ups

**Back:** Barbell Row, Dumbbell Row, Pull-ups, Lat Pulldown, Cable Row, T-Bar Row, Face Pull, Deadlift

**Legs:** Barbell Squat, Front Squat, Romanian Deadlift, Leg Press, Leg Extension, Leg Curl, Bulgarian Split Squat, Calf Raise, Hip Thrust

**Shoulders:** Overhead Press, Dumbbell Shoulder Press, Lateral Raise, Front Raise, Reverse Fly, Arnold Press, Upright Row, Shrugs

**Arms:** Barbell Curl, Dumbbell Curl, Hammer Curl, Preacher Curl, Tricep Pushdown, Skull Crushers, Overhead Tricep Extension, Close Grip Bench

**Core:** Plank, Hanging Leg Raise, Cable Crunch, Ab Wheel, Russian Twist, Side Plank, Decline Sit-up

**Cardio:** Running, Cycling, Rowing Machine, Jump Rope, Stair Climber, Swimming, Elliptical, HIIT Circuit

### Workout Templates

6 pre-built templates stored in a new `workout_templates` table. Each template has a name, description, and a list of exercise IDs. Users can tap "Start Template" to auto-populate the logger.

| Template | Exercises |
|----------|-----------|
| Push Day | Barbell Bench, Incline DB Press, OHP, Lateral Raise, Tricep Pushdown, Cable Fly |
| Pull Day | Barbell Row, Pull-ups, Cable Row, Face Pull, Barbell Curl, Hammer Curl |
| Leg Day | Barbell Squat, Romanian Deadlift, Leg Press, Leg Curl, Bulgarian Split Squat, Calf Raise |
| Upper Body | Barbell Bench, Barbell Row, OHP, Pull-ups, Barbell Curl, Tricep Pushdown |
| Full Body | Barbell Squat, Barbell Bench, Deadlift, OHP, Barbell Row, Plank |
| Cardio Blast | Running, Jump Rope, Rowing Machine, HIIT Circuit |

### Exercise Selector Upgrade

Replace the flat scrollable button list in the workout logger with a modal/sheet that groups exercises by category, has a search bar, and shows equipment icons. Similar to the existing ExerciseLibrary page but as a selection dialog.

---

## Pillar 2: Quest & Achievement System

### Achievements Table

New `achievements` table with predefined milestones. New `user_achievements` junction table tracking which users have earned which achievements and when.

```sql
create table public.achievements (
  id uuid primary key,
  name text not null,
  description text not null,
  icon text not null,        -- lucide icon name
  category text not null,    -- 'workout', 'social', 'progression', 'raid'
  condition_type text not null, -- 'workout_count', 'total_volume', 'streak', 'level', 'pr_count', etc.
  condition_value integer not null,
  reward_scraps integer default 0
);

create table public.user_achievements (
  user_id uuid references users(id),
  achievement_id uuid references achievements(id),
  earned_at timestamp with time zone default now(),
  primary key (user_id, achievement_id)
);
```

### Achievement List

| Achievement | Condition | Icon | Scraps |
|------------|-----------|------|--------|
| First Blood | Complete 1 workout | Sword | 50 |
| Iron Regular | Complete 10 workouts | Dumbbell | 100 |
| Centurion | Complete 100 workouts | Shield | 500 |
| 1K Club | Lift 1,000 lbs total volume in a single session | Trophy | 200 |
| 10K Club | Lift 10,000 lbs total volume in a single session | Trophy | 500 |
| Iron Streak | 7 consecutive days with a workout | Flame | 300 |
| Forged in Fire | 30 consecutive days with a workout | Flame | 1000 |
| Class Chosen | Select a class at level 6 | Sword | 100 |
| PR Machine | Set 10 personal records | Trophy | 200 |
| PR Legend | Set 50 personal records | Trophy | 500 |
| Raid Slayer | Help defeat a raid boss | Swords | 300 |
| Party Animal | Join or create a party | Users | 100 |
| Level 10 | Reach level 10 | Star | 150 |
| Level 25 | Reach level 25 | Star | 300 |
| Level 50 | Reach level 50 | Star | 1000 |
| Comeback Kid | Trigger the Comeback Quest bonus | RefreshCcw | 100 |

### Achievement Checking

After each workout save, run an `checkAndAwardAchievements()` function that:
1. Fetches user stats (workout count, PR count, level, etc.)
2. Compares against all achievement conditions
3. Awards any newly-met achievements
4. Grants Iron Scraps rewards
5. Returns newly earned achievements to show a toast/modal

### Expanded Quests

Add these quest types to `fetchActiveQuests()`:

| Quest | Goal | Type | Reward |
|-------|------|------|--------|
| Volume Quest | Lift 10,000 lbs this week | weekly | 100 scraps |
| Cardio Quest | Log 60 min of cardio this week | weekly | 100 scraps |
| PR Hunter | Set a new PR this week | weekly | 150 scraps |
| Consistency Quest | Work out 3 days in a row | daily | 75 scraps |

Quest rewards are awarded when progress meets the goal. The quest system checks on each workout save.

---

## Pillar 3: Social & Engagement

### Party Activity Feed

New `party_activity` table (or compute from existing data). Shows a timeline on the party page:

- "Alex completed Leg Day and earned 342 XP"
- "Sam hit a PR on Bench Press: 225 lbs"
- "Jordan earned the Iron Streak achievement"

Implementation: Query recent workouts + PR sets + user_achievements for all party members, merge and sort by time. No new table needed - compute from existing data.

### Auto-Generated Roast Reports

Since there's no Supabase Edge Function cron in the project, implement client-side generation:

When a user views the party page and it's been 7+ days since the last roast report:
1. Query all party members' workouts from the past week
2. Find the MVP (most XP earned) and slacker (least workouts)
3. Count PRs for "Notable Feats"
4. Generate report text
5. Insert into `roast_reports` table

This means the first party member to check the party page after Sunday triggers the report generation.

### PR Hype System

When viewing the party activity feed:
- PR items show a "Hype" button
- Clicking inserts into `pr_hypes` table
- The PR owner earns +25 XP per hype
- Hype count shown on the PR item

---

## Pillar 4: Polish & Onboarding

### Onboarding Flow

After first login (when `user.level === 1` and no workouts exist), show a 3-step onboarding modal:

1. **Welcome** - "Welcome to QuestLift. Your quest begins now." Set your display name.
2. **How It Works** - Brief animated explanation: Log workouts -> Earn XP -> Level up -> Fight bosses
3. **First Quest** - Direct to the workout logger with a suggested template

### Progress Chart Exercise Picker

Add a dropdown/select at the top of the ProgressChart component that lists all exercises the user has logged. Selecting one filters the chart to that exercise's progression.

### Improved Empty States

For each empty state, add a clear call-to-action:

- **Dashboard (no workouts):** "Your adventure begins with a single rep. Start your first workout." [Button: Start Workout]
- **History (empty):** "No quests completed yet. Your story is waiting to be written." [Button: Log Workout]
- **Party (no party):** Already has create/join UI - good as is.
- **Raid (no raid, in party):** "The dungeon is quiet... for now. A boss will spawn at the start of next week."
- **Exercises (empty DB):** Should never happen after seeding, but: "The Grimoire is empty. Contact your admin."

---

## New Files

| File | Purpose |
|------|---------|
| `supabase/seed_exercises.sql` | 60+ exercise INSERT statements |
| `supabase/achievements_schema.sql` | achievements + user_achievements tables |
| `supabase/seed_achievements.sql` | Achievement definitions INSERT statements |
| `lib/achievements.ts` | Achievement checking logic |
| `components/workout/exercise-picker-modal.tsx` | Improved exercise selector for logger |
| `components/workout/template-picker.tsx` | Template selection UI |
| `components/dashboard/onboarding-modal.tsx` | 3-step onboarding wizard |
| `components/dashboard/achievement-toast.tsx` | Achievement earned notification |
| `components/social/party-activity-feed.tsx` | Party activity timeline |
| `components/social/hype-button.tsx` | PR hype interaction |
| `app/dashboard/achievements/page.tsx` | Achievement gallery page |

## Modified Files

| File | Changes |
|------|---------|
| `lib/supabase/data-hooks.ts` | Add achievement queries, expanded quests, party feed, roast report generation, template fetching |
| `components/workout/logger.tsx` | Use exercise picker modal, add template picker, trigger achievement check |
| `components/history/progress-chart.tsx` | Add exercise selector dropdown |
| `components/social/party-roster.tsx` | Add party activity feed section |
| `components/social/roast-report.tsx` | Add auto-generation logic |
| `components/dashboard/nav.tsx` | Add Achievements nav item |
| `components/dashboard/user-profile.tsx` | Show recent achievements, trigger onboarding |

---

## Implementation Order

1. Exercise seed data + templates schema (foundation for everything else)
2. Exercise picker modal (improves the logger immediately)
3. Template picker + workout page integration
4. Achievements schema + seed data + checking logic
5. Achievement gallery page + toast notifications
6. Expanded quests with rewards
7. Party activity feed
8. Roast report auto-generation
9. PR hype system
10. Onboarding flow
11. Progress chart exercise picker
12. Empty state improvements
