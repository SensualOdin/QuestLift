# CrossFit WOD System & Exercise Data Overhaul

**Date:** 2026-03-06
**Status:** Design Approved

## Problem

1. **Exercise type mismatches** — Bodyweight exercises (Push-ups, Pull-ups, Plank) show weight fields. Mobility exercises typed as 'Strength'. Timed exercises (Plank) forced into reps tracking.
2. **Missing CrossFit exercises** — No Olympic lifts, gymnastics movements, or common CF movements (Thrusters, Wall Balls, Burpees, Double Unders, KB Swings, etc.).
3. **No WOD structure** — No way to do AMRAP, EMOM, For Time, Chipper, or Tabata workouts.

## Solution

### 1. Exercise Data Fixes

**New `tracking_mode` column on `exercises` table:**

| tracking_mode | Logger fields | Used by |
|---|---|---|
| `weight_reps` | Weight + Reps + RPE | Barbell/Dumbbell/Cable/Machine lifts |
| `reps_only` | Reps + RPE (no weight) | Push-ups, Pull-ups, Muscle-ups, Burpees, HSPU, Toes-to-Bar, Pistols |
| `duration` | Minutes + RPE | Plank, Side Plank, Running, Cycling, all cardio |
| `reps_or_duration` | Toggle reps/duration | Double Unders, Jump Rope, Wall Balls |

**Exercise type fixes:**
- Mobility exercises: `exercise_type` → `'Mobility'`
- Plank, Side Plank: `tracking_mode` → `'duration'`
- Push-ups, Pull-ups, Dips, etc.: `tracking_mode` → `'reps_only'`

**New categories:** `Olympic`, `Gymnastics`

**~40 new exercises:**

Olympic:
- Power Clean, Hang Clean, Squat Clean, Clean & Jerk
- Power Snatch, Hang Snatch, Squat Snatch
- Push Jerk, Split Jerk
- Thruster, Cluster, Overhead Squat
- Sumo Deadlift High Pull, Medicine Ball Clean

Gymnastics:
- Bar Muscle-up, Ring Muscle-up
- Kipping Pull-up, Chest-to-Bar Pull-up, Butterfly Pull-up
- Handstand Push-up, Strict HSPU, Deficit HSPU
- Toes-to-Bar, Knees-to-Elbows
- Pistol Squat, Ring Dip, L-sit
- Handstand Walk, Rope Climb, Wall Walk

CrossFit Cardio/Misc:
- Burpee, Burpee Box Jump-Over
- Double Under, Single Under
- Wall Ball Shot, Kettlebell Swing, Kettlebell Snatch
- Box Jump, Box Step-Up
- Assault Bike (cal), Rowing (cal), Ski Erg
- Sled Push, Farmers Carry
- Turkish Get-Up, GHD Sit-Up
- Air Squat

### 2. WOD Templates Table

```sql
create table public.wod_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  wod_type text not null,        -- 'amrap' | 'emom' | 'for_time' | 'chipper' | 'tabata'
  time_cap_seconds integer,
  rounds integer,
  is_benchmark boolean default false,
  created_by uuid references public.users on delete cascade,
  movements jsonb not null,      -- [{exercise_name, reps, weight_lbs, notes}]
  created_at timestamptz default now()
);
```

**movements JSONB example (Fran):**
```json
[
  {"exercise_name": "Thruster", "reps": 21, "weight_lbs": 95, "notes": "21-15-9"},
  {"exercise_name": "Pull-ups", "reps": 21, "weight_lbs": null, "notes": "21-15-9"}
]
```

### 3. Benchmark WODs (15 seeded)

| Name | Type | Structure |
|---|---|---|
| Fran | For Time | 21-15-9 Thrusters (95/65) + Pull-ups |
| Grace | For Time | 30 Clean & Jerks (135/95) |
| Murph | For Time | 1mi Run, 100 Pull-ups, 200 Push-ups, 300 Squats, 1mi Run |
| Cindy | AMRAP 20 | 5 Pull-ups, 10 Push-ups, 15 Air Squats |
| Helen | For Time (3 rds) | 400m Run, 21 KB Swings (53/35), 12 Pull-ups |
| Diane | For Time | 21-15-9 Deadlifts (225/155) + HSPU |
| Elizabeth | For Time | 21-15-9 Cleans (135/95) + Ring Dips |
| Isabel | For Time | 30 Snatches (135/95) |
| Jackie | For Time | 1000m Row, 50 Thrusters (45/35), 30 Pull-ups |
| Karen | For Time | 150 Wall Balls (20/14) |
| Annie | For Time | 50-40-30-20-10 DUs + Sit-ups |
| Mary | AMRAP 20 | 5 HSPU, 10 Pistols, 15 Pull-ups |
| DT | For Time (5 rds) | 12 DL, 9 Hang Clean, 6 Push Jerk (155/105) |
| Amanda | For Time | 9-7-5 Muscle-ups + Squat Snatches (135/95) |
| Filthy Fifty | Chipper | 50 of 10 different movements |

### 4. WOD Page (`/dashboard/wod`)

**Navigation:** New "WOD" tab in sidebar/bottom nav with Flame/Zap icon.

**Page flow:**

1. **WOD Picker** — Grid of benchmark cards + "Create Custom WOD" button
   - Custom builder: pick type, set time cap, add movements with reps/weight

2. **Active WOD Screen:**
   - Header with WOD name + type badge
   - Large central timer:
     - AMRAP: Countdown (20:00 → 0:00)
     - For Time: Count-up stopwatch (0:00 →)
     - EMOM: Interval timer (current minute + countdown)
     - Tabata: 20s work / 10s rest
   - Movement list with prescribed reps/weight
   - Round counter (tap to increment for AMRAP, auto for EMOM)
   - Start / Pause / Finish controls

3. **WOD Results:**
   - AMRAP: Records rounds + extra reps
   - For Time: Records completion time
   - EMOM: Records completed intervals
   - Saves to existing `workouts` + `workout_sets` tables
   - Battle log modal + XP (same formula)

**Color scheme:** Orange/amber accent for WOD (vs indigo for lifting).

### 5. Logger Updates

Existing workout logger updated to respect `tracking_mode`:
- `weight_reps`: No change (weight + reps + RPE)
- `reps_only`: Hide weight column, show Reps + RPE only
- `duration`: Show Minutes + RPE only (current cardio behavior)
- `reps_or_duration`: Small toggle letting user pick reps or duration

Exercise picker modal categories updated:
```
All | Chest | Back | Legs | Shoulders | Arms | Core | Olympic | Gymnastics | Cardio | Mobility
```

### 6. XP Changes

- Bodyweight exercises (`reps_only`): **2 XP per rep** (flat rate)
- Weighted exercises: Same formula (`weight * reps / 100 * intensity`)
- Cardio/duration: Same formula (`minutes * effort_multiplier`)
- WOD XP: Sum of all movement XP using same formulas above
- No changes to level thresholds, class bonuses, or consistency bonuses

### 7. WOD Results Storage

WOD results use existing tables:
- `workouts` row: `name = 'WOD: Fran'`, `notes` stores JSON metadata `{wod_type, time_seconds, rounds_completed, extra_reps}`
- `workout_sets` rows: One per movement performed, with weight/reps as applicable
- XP calculated using same per-set formulas

## Out of Scope

- WOD leaderboard / social comparison
- WOD history / PR tracking for specific benchmark times
- Scaling options (Rx/Scaled/Beginner) per WOD
- Custom WOD sharing between users

## Sources

- [CrossFit Official Movement List](https://www.crossfit.com/crossfit-movements)
- [CrossFit Movement Modalities](https://www.crossfit.com/essentials/programming-lecture-movement-modalities)
- [5 Types of CrossFit Workouts](https://adamascrossfit.com/5-types-of-crossfit-workouts-explained/)
- [BOXROX CrossFit Explained](https://www.boxrox.com/crossfit-explained-amrap-emom-wod/)
