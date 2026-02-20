# Rotating Quest System Design

## Overview

Replace the 4 hardcoded quests with a rotating system that picks from a pool of ~15 quest templates. Daily quests rotate every day, weekly quests rotate every Monday. All rotation is client-side using a deterministic seed (userId + date) — no new database tables needed.

## Quest Pool

Each quest template has: `id`, `title`, `description`, `type` (daily/weekly), `total` (target value), and a `condition` key that maps to a Supabase query.

### Daily Quests (~8 in pool, pick 2 per day)

| ID | Title | Condition | Target |
|----|-------|-----------|--------|
| d-log-workout | Daily Grind | workouts today | 1 |
| d-volume-3k | Heavy Hitter | volume today >= 3,000 lbs | 3000 |
| d-volume-5k | Iron Pumper | volume today >= 5,000 lbs | 5000 |
| d-sets-10 | Set Stacker | complete 10 sets today | 10 |
| d-sets-15 | Rep Machine | complete 15 sets today | 15 |
| d-legs | Leg Day | log at least 1 Legs set today | 1 |
| d-chest | Chest Quest | log at least 1 Chest set today | 1 |
| d-back | Back Attack | log at least 1 Back set today | 1 |

### Weekly Quests (~7 in pool, pick 2 per week)

| ID | Title | Condition | Target |
|----|-------|-----------|--------|
| w-workouts-3 | Consistent | complete 3 workouts this week | 3 |
| w-workouts-5 | Weekly Warrior | complete 5 workouts this week | 5 |
| w-volume-15k | Iron Forge | lift 15,000 lbs this week | 15000 |
| w-volume-25k | Steel Temperer | lift 25,000 lbs this week | 25000 |
| w-prs-2 | PR Hunter | set 2 personal records this week | 2 |
| w-prs-5 | Record Breaker | set 5 personal records this week | 5 |
| w-weekend | Weekend Warrior | log a workout on Sat or Sun | 1 |

## Rotation Logic

Deterministic selection using a seeded hash:
- **Daily seed**: `hash(userId + "YYYY-MM-DD")` — same quests all day for a given user
- **Weekly seed**: `hash(userId + "YYYY-WW")` — same quests all week
- Different users get different quests
- Simple hash: sum char codes, modulo pool length, avoid duplicates

## Rewards

- Daily quest completion: 25-50 Iron Scraps each
- Weekly quest completion: 75-150 Iron Scraps each
- Awarded client-side when progress meets target (same pattern as achievements)

## Progress Computation

Same approach as current system — query Supabase on load:
- Workout counts (daily/weekly windows)
- Volume sums (daily/weekly windows)
- Set counts with optional category filter
- PR counts (weekly window)

## UI Changes

- Same `ActiveQuests` card on dashboard
- Add "Resets in Xh" / "Resets Mon" countdown text per quest type
- Completed quests show checkmark + "Completed" instead of progress bar
- Iron Scraps reward shown on each quest card

## Files to Modify

- `lib/supabase/data-hooks.ts` — replace hardcoded `fetchActiveQuests` with pool + seed selection
- `components/dashboard/active-quests.tsx` — add reset countdown, completion state, reward display
