# CrossFit WOD System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add CrossFit exercise support with proper tracking modes, ~40 new exercises, and a dedicated WOD page with AMRAP/EMOM/For Time/Chipper/Tabata timers and 15 benchmark WODs.

**Architecture:** New `tracking_mode` column on `exercises` table drives UI field visibility in the logger. New `wod_templates` table stores benchmark and custom WODs. Dedicated `/dashboard/wod` page with timer engine. WOD results save to existing `workouts` + `workout_sets` tables. XP uses same formulas plus 2 XP/rep for bodyweight.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase (Postgres via MCP), Tailwind CSS 4, shadcn/ui, Framer Motion, Zustand, lucide-react

**Design Doc:** `docs/plans/2026-03-06-crossfit-wod-system-design.md`

---

### Task 1: Database Migration — Add `tracking_mode` Column & Fix Exercise Data

**Files:**
- Migration via Supabase MCP (`apply_migration`)

**Step 1: Apply migration to add `tracking_mode` column and update existing exercises**

Use Supabase MCP `apply_migration` with name `add_tracking_mode_and_fix_exercises`:

```sql
-- Add tracking_mode column with default for existing rows
ALTER TABLE public.exercises
ADD COLUMN tracking_mode text NOT NULL DEFAULT 'weight_reps';

-- Fix Mobility exercises: exercise_type was 'Strength', should be 'Mobility'
UPDATE public.exercises SET exercise_type = 'Mobility'
WHERE category = 'Mobility';

-- Fix Mobility tracking to duration
UPDATE public.exercises SET tracking_mode = 'duration'
WHERE category = 'Mobility';

-- Fix bodyweight strength exercises to reps_only
UPDATE public.exercises SET tracking_mode = 'reps_only'
WHERE equipment = 'Bodyweight' AND exercise_type = 'Strength'
AND name NOT IN ('Plank', 'Side Plank');

-- Fix timed exercises to duration
UPDATE public.exercises SET tracking_mode = 'duration'
WHERE name IN ('Plank', 'Side Plank');

-- Fix all cardio exercises to duration
UPDATE public.exercises SET tracking_mode = 'duration'
WHERE exercise_type = 'Cardio';

-- Fix specific cardio exercises that can be reps or duration
UPDATE public.exercises SET tracking_mode = 'reps_or_duration'
WHERE name IN ('Jump Rope', 'Box Jumps', 'Battle Ropes');
```

**Step 2: Verify migration**

Use Supabase MCP `execute_sql`:
```sql
SELECT name, category, equipment, exercise_type, tracking_mode
FROM public.exercises
ORDER BY category, name;
```

Verify:
- Push-ups → `tracking_mode = 'reps_only'`
- Pull-ups → `tracking_mode = 'reps_only'`
- Plank → `tracking_mode = 'duration'`
- Barbell Bench Press → `tracking_mode = 'weight_reps'`
- Running → `tracking_mode = 'duration'`
- Hip 90/90 Stretch → `exercise_type = 'Mobility'`, `tracking_mode = 'duration'`
- Jump Rope → `tracking_mode = 'reps_or_duration'`

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add tracking_mode column and fix exercise types"
```

---

### Task 2: Database Migration — Seed ~40 New CrossFit Exercises

**Files:**
- Migration via Supabase MCP (`apply_migration`)

**Step 1: Apply migration to insert new exercises**

Use Supabase MCP `apply_migration` with name `seed_crossfit_exercises`:

```sql
-- Olympic Lifts (14 exercises)
INSERT INTO public.exercises (name, category, equipment, exercise_type, tracking_mode) VALUES
  ('Power Clean',              'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Hang Clean',               'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Squat Clean',              'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Clean & Jerk',             'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Power Snatch',             'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Hang Snatch',              'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Squat Snatch',             'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Push Jerk',                'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Split Jerk',               'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Thruster',                 'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Cluster',                  'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Overhead Squat',           'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Sumo Deadlift High Pull',  'Olympic', 'Barbell',   'Strength', 'weight_reps'),
  ('Medicine Ball Clean',      'Olympic', NULL,         'Strength', 'weight_reps');

-- Gymnastics (17 exercises)
INSERT INTO public.exercises (name, category, equipment, exercise_type, tracking_mode) VALUES
  ('Bar Muscle-up',            'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Ring Muscle-up',           'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Kipping Pull-up',          'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Chest-to-Bar Pull-up',    'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Butterfly Pull-up',       'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Handstand Push-up',       'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Strict HSPU',              'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Deficit HSPU',             'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Toes-to-Bar',             'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Knees-to-Elbows',         'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Pistol Squat',            'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Ring Dip',                 'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('L-sit',                    'Gymnastics', 'Bodyweight', 'Strength', 'duration'),
  ('Handstand Walk',           'Gymnastics', 'Bodyweight', 'Strength', 'duration'),
  ('Rope Climb',               'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Wall Walk',                'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Air Squat',                'Gymnastics', 'Bodyweight', 'Strength', 'reps_only');

-- CrossFit Cardio/Misc (13 exercises)
INSERT INTO public.exercises (name, category, equipment, exercise_type, tracking_mode) VALUES
  ('Burpee',                   'Cardio', 'Bodyweight', 'Cardio', 'reps_or_duration'),
  ('Burpee Box Jump-Over',    'Cardio', 'Bodyweight', 'Cardio', 'reps_or_duration'),
  ('Double Under',             'Cardio', NULL,         'Cardio', 'reps_or_duration'),
  ('Single Under',             'Cardio', NULL,         'Cardio', 'reps_or_duration'),
  ('Wall Ball Shot',           'Cardio', NULL,         'Strength', 'weight_reps'),
  ('Kettlebell Swing',         'Cardio', NULL,         'Strength', 'weight_reps'),
  ('Kettlebell Snatch',        'Cardio', NULL,         'Strength', 'weight_reps'),
  ('Box Step-Up',              'Cardio', 'Bodyweight', 'Cardio', 'reps_or_duration'),
  ('Ski Erg',                  'Cardio', 'Machine',    'Cardio', 'duration'),
  ('Farmers Carry',            'Cardio', 'Dumbbell',   'Strength', 'duration'),
  ('Turkish Get-Up',           'Core', NULL,           'Strength', 'weight_reps'),
  ('GHD Sit-Up',               'Core', 'Machine',     'Strength', 'reps_only'),
  ('Rowing (Calories)',        'Cardio', 'Machine',    'Cardio', 'duration');
```

**Step 2: Verify new exercises exist**

Use Supabase MCP `execute_sql`:
```sql
SELECT category, COUNT(*) as count
FROM public.exercises
GROUP BY category
ORDER BY category;
```

Expected: `Olympic` = 14, `Gymnastics` = 17, and increased counts for Cardio, Core.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: seed 44 CrossFit exercises (Olympic, Gymnastics, CF cardio)"
```

---

### Task 3: Database Migration — Create `wod_templates` Table & Seed Benchmarks

**Files:**
- Migration via Supabase MCP (`apply_migration`)

**Step 1: Apply migration to create wod_templates table**

Use Supabase MCP `apply_migration` with name `create_wod_templates`:

```sql
CREATE TABLE public.wod_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  wod_type text NOT NULL,
  time_cap_seconds integer,
  rounds integer,
  is_benchmark boolean DEFAULT false,
  created_by uuid REFERENCES public.users ON DELETE CASCADE,
  movements jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.wod_templates ENABLE ROW LEVEL SECURITY;

-- Benchmarks visible to all
CREATE POLICY "Benchmark WODs are viewable by all"
  ON public.wod_templates FOR SELECT
  USING (is_benchmark = true);

-- Users can view their own custom WODs
CREATE POLICY "Users can view own WODs"
  ON public.wod_templates FOR SELECT
  USING (auth.uid() = created_by);

-- Users can create custom WODs
CREATE POLICY "Users can create WODs"
  ON public.wod_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own custom WODs
CREATE POLICY "Users can delete own WODs"
  ON public.wod_templates FOR DELETE
  USING (auth.uid() = created_by);
```

**Step 2: Apply migration to seed benchmark WODs**

Use Supabase MCP `apply_migration` with name `seed_benchmark_wods`:

```sql
INSERT INTO public.wod_templates (name, wod_type, time_cap_seconds, rounds, is_benchmark, created_by, movements) VALUES
(
  'Fran', 'for_time', 600, NULL, true, NULL,
  '[{"exercise_name":"Thruster","reps":21,"weight_lbs":95,"notes":"21-15-9"},{"exercise_name":"Pull-ups","reps":21,"weight_lbs":null,"notes":"21-15-9"}]'::jsonb
),
(
  'Grace', 'for_time', 600, NULL, true, NULL,
  '[{"exercise_name":"Clean & Jerk","reps":30,"weight_lbs":135,"notes":"30 reps for time"}]'::jsonb
),
(
  'Murph', 'for_time', 3600, NULL, true, NULL,
  '[{"exercise_name":"Running","reps":1,"weight_lbs":null,"notes":"1 mile"},{"exercise_name":"Pull-ups","reps":100,"weight_lbs":null,"notes":""},{"exercise_name":"Push-ups","reps":200,"weight_lbs":null,"notes":""},{"exercise_name":"Air Squat","reps":300,"weight_lbs":null,"notes":""},{"exercise_name":"Running","reps":1,"weight_lbs":null,"notes":"1 mile"}]'::jsonb
),
(
  'Cindy', 'amrap', 1200, NULL, true, NULL,
  '[{"exercise_name":"Pull-ups","reps":5,"weight_lbs":null,"notes":""},{"exercise_name":"Push-ups","reps":10,"weight_lbs":null,"notes":""},{"exercise_name":"Air Squat","reps":15,"weight_lbs":null,"notes":""}]'::jsonb
),
(
  'Helen', 'for_time', 900, 3, true, NULL,
  '[{"exercise_name":"Running","reps":1,"weight_lbs":null,"notes":"400m"},{"exercise_name":"Kettlebell Swing","reps":21,"weight_lbs":53,"notes":""},{"exercise_name":"Pull-ups","reps":12,"weight_lbs":null,"notes":""}]'::jsonb
),
(
  'Diane', 'for_time', 600, NULL, true, NULL,
  '[{"exercise_name":"Deadlift","reps":21,"weight_lbs":225,"notes":"21-15-9"},{"exercise_name":"Handstand Push-up","reps":21,"weight_lbs":null,"notes":"21-15-9"}]'::jsonb
),
(
  'Elizabeth', 'for_time', 600, NULL, true, NULL,
  '[{"exercise_name":"Squat Clean","reps":21,"weight_lbs":135,"notes":"21-15-9"},{"exercise_name":"Ring Dip","reps":21,"weight_lbs":null,"notes":"21-15-9"}]'::jsonb
),
(
  'Isabel', 'for_time', 600, NULL, true, NULL,
  '[{"exercise_name":"Power Snatch","reps":30,"weight_lbs":135,"notes":"30 reps for time"}]'::jsonb
),
(
  'Jackie', 'for_time', 900, NULL, true, NULL,
  '[{"exercise_name":"Rowing (Calories)","reps":1,"weight_lbs":null,"notes":"1000m row"},{"exercise_name":"Thruster","reps":50,"weight_lbs":45,"notes":""},{"exercise_name":"Pull-ups","reps":30,"weight_lbs":null,"notes":""}]'::jsonb
),
(
  'Karen', 'for_time', 900, NULL, true, NULL,
  '[{"exercise_name":"Wall Ball Shot","reps":150,"weight_lbs":20,"notes":"150 wall balls"}]'::jsonb
),
(
  'Annie', 'for_time', 600, NULL, true, NULL,
  '[{"exercise_name":"Double Under","reps":50,"weight_lbs":null,"notes":"50-40-30-20-10"},{"exercise_name":"Decline Sit-up","reps":50,"weight_lbs":null,"notes":"50-40-30-20-10"}]'::jsonb
),
(
  'Mary', 'amrap', 1200, NULL, true, NULL,
  '[{"exercise_name":"Handstand Push-up","reps":5,"weight_lbs":null,"notes":""},{"exercise_name":"Pistol Squat","reps":10,"weight_lbs":null,"notes":"alternating"},{"exercise_name":"Pull-ups","reps":15,"weight_lbs":null,"notes":""}]'::jsonb
),
(
  'DT', 'for_time', 900, 5, true, NULL,
  '[{"exercise_name":"Deadlift","reps":12,"weight_lbs":155,"notes":""},{"exercise_name":"Hang Clean","reps":9,"weight_lbs":155,"notes":""},{"exercise_name":"Push Jerk","reps":6,"weight_lbs":155,"notes":""}]'::jsonb
),
(
  'Amanda', 'for_time', 600, NULL, true, NULL,
  '[{"exercise_name":"Ring Muscle-up","reps":9,"weight_lbs":null,"notes":"9-7-5"},{"exercise_name":"Squat Snatch","reps":9,"weight_lbs":135,"notes":"9-7-5"}]'::jsonb
),
(
  'Filthy Fifty', 'chipper', 2400, NULL, true, NULL,
  '[{"exercise_name":"Box Jump","reps":50,"weight_lbs":null,"notes":"24in"},{"exercise_name":"Pull-ups","reps":50,"weight_lbs":null,"notes":"jumping"},{"exercise_name":"Kettlebell Swing","reps":50,"weight_lbs":35,"notes":""},{"exercise_name":"Walking Lunge","reps":50,"weight_lbs":null,"notes":"steps"},{"exercise_name":"Knees-to-Elbows","reps":50,"weight_lbs":null,"notes":""},{"exercise_name":"Push-ups","reps":50,"weight_lbs":null,"notes":"push press 45lb"},{"exercise_name":"Good Morning","reps":50,"weight_lbs":45,"notes":"back ext"},{"exercise_name":"Wall Ball Shot","reps":50,"weight_lbs":20,"notes":""},{"exercise_name":"Burpee","reps":50,"weight_lbs":null,"notes":""},{"exercise_name":"Double Under","reps":50,"weight_lbs":null,"notes":""}]'::jsonb
);
```

**Step 3: Verify benchmarks**

Use Supabase MCP `execute_sql`:
```sql
SELECT name, wod_type, time_cap_seconds, rounds FROM public.wod_templates WHERE is_benchmark = true ORDER BY name;
```

Expected: 15 rows.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: create wod_templates table and seed 15 benchmark WODs"
```

---

### Task 4: Regenerate TypeScript Types

**Files:**
- Modify: `lib/supabase-types.ts`

**Step 1: Regenerate types from Supabase MCP**

Use Supabase MCP `generate_typescript_types` to get the updated types that include:
- `exercises.tracking_mode` field
- New `wod_templates` table type

**Step 2: Replace `lib/supabase-types.ts` with the generated output**

Write the full generated types to `lib/supabase-types.ts`.

**Step 3: Verify the Exercise type now includes tracking_mode**

Read `lib/supabase-types.ts` and confirm the `exercises` table Row type contains:
```typescript
tracking_mode: string
```

And the new `wod_templates` table types exist.

**Step 4: Commit**

```bash
git add lib/supabase-types.ts && git commit -m "chore: regenerate Supabase types with tracking_mode and wod_templates"
```

---

### Task 5: Update XP Engine — Bodyweight XP Formula

**Files:**
- Modify: `lib/xp-engine.ts:1-50`

**Step 1: Add bodyweight XP function**

Add after `calculateCardioSetXP` (line 72) in `lib/xp-engine.ts`:

```typescript
/**
 * Calculates XP for a bodyweight (reps_only) set.
 * Flat rate of 2 XP per rep.
 */
export function calculateBodyweightSetXP(set: WorkoutSet, isClassSpecialty: boolean = false): number {
    if (!set.reps) return 0
    let xp = set.reps * 2
    if (isClassSpecialty) {
        xp *= 1.15
    }
    return xp
}
```

**Step 2: Update WorkoutType to include 'Bodyweight'**

Change line 3 of `lib/xp-engine.ts`:

```typescript
export type WorkoutType = 'Strength' | 'Cardio' | 'Mobility' | 'Recovery' | 'Bodyweight'
```

**Step 3: Update calculateSessionXP to handle Bodyweight type**

In `calculateSessionXP` (line 77), update the loop body (lines 83-89):

```typescript
    for (const set of sets) {
        if (set.type === 'Strength') {
            sessionBaseXP += calculateStrengthSetXP(set.data, set.isSpecialty)
        } else if (set.type === 'Bodyweight') {
            sessionBaseXP += calculateBodyweightSetXP(set.data, set.isSpecialty)
        } else {
            sessionBaseXP += calculateCardioSetXP(set.data, set.isSpecialty)
        }
    }
```

**Step 4: Commit**

```bash
git add lib/xp-engine.ts && git commit -m "feat: add bodyweight XP formula (2 XP per rep)"
```

---

### Task 6: Update Exercise Picker Modal — New Categories

**Files:**
- Modify: `components/workout/exercise-picker-modal.tsx:10`

**Step 1: Update CATEGORIES array**

Change line 10 of `components/workout/exercise-picker-modal.tsx`:

```typescript
const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Olympic", "Gymnastics", "Cardio", "Mobility"]
```

**Step 2: Update exercise type icon logic**

The current icon logic (line 109-111) only handles 'Strength' vs other. Update to handle Gymnastics with a different icon. In the exercise list button, replace the icon block:

```typescript
{exercise.exercise_type === 'Strength'
    ? <Dumbbell className="w-4 h-4" />
    : exercise.exercise_type === 'Mobility'
    ? <Activity className="w-4 h-4" />
    : <Activity className="w-4 h-4" />}
```

And update the color:
```typescript
<div className={`p-1.5 rounded-lg ${
    exercise.category === 'Olympic' ? 'bg-amber-500/10 text-amber-400' :
    exercise.category === 'Gymnastics' ? 'bg-rose-500/10 text-rose-400' :
    exercise.exercise_type === 'Strength' ? 'bg-indigo-500/10 text-indigo-400' :
    exercise.exercise_type === 'Mobility' ? 'bg-teal-500/10 text-teal-400' :
    'bg-emerald-500/10 text-emerald-400'
}`}>
```

**Step 3: Import needed icons**

Add `Flame` to the lucide-react import (line 4) for Olympic lifts:
```typescript
import { Search, Dumbbell, Activity, Plus, Flame } from "lucide-react"
```

Use `Flame` for Olympic, `Activity` for Gymnastics/Cardio, `Dumbbell` for Strength:
```typescript
{exercise.category === 'Olympic' ? <Flame className="w-4 h-4" /> :
 exercise.exercise_type === 'Strength' ? <Dumbbell className="w-4 h-4" /> :
 <Activity className="w-4 h-4" />}
```

**Step 4: Commit**

```bash
git add components/workout/exercise-picker-modal.tsx && git commit -m "feat: add Olympic, Gymnastics, Mobility categories to exercise picker"
```

---

### Task 7: Update Workout Logger — Respect `tracking_mode`

**Files:**
- Modify: `components/workout/logger.tsx`

**Step 1: Update the set rendering logic**

The current logger (lines 551-667) uses `isStrength` boolean to choose between weight+reps vs duration. Replace this with `tracking_mode`-based rendering.

In the exercise card render (inside `workoutExercises.map`), replace the `isStrength` const (line 552) with:

```typescript
const trackingMode = activeEx.exerciseDef.tracking_mode ||
    (activeEx.exerciseDef.exercise_type === 'Strength' ? 'weight_reps' : 'duration')
```

Update column headers (lines 582-596) to use trackingMode:

```typescript
{trackingMode === 'weight_reps' ? (
    <>
        <div className="flex-1 text-center">{isDumbbell ? 'lbs ea.' : 'lbs'}</div>
        <div className="flex-1 text-center">Reps</div>
        <div className="flex-1 text-center flex items-center justify-center gap-1">RPE <RPEInfoPopover /></div>
    </>
) : trackingMode === 'reps_only' ? (
    <>
        <div className="flex-1 text-center">Reps</div>
        <div className="flex-1 text-center flex items-center justify-center gap-1">RPE <RPEInfoPopover /></div>
    </>
) : trackingMode === 'duration' ? (
    <>
        <div className="flex-1 text-center">Min</div>
        <div className="flex-1 text-center flex items-center justify-center gap-1">RPE <RPEInfoPopover /></div>
    </>
) : /* reps_or_duration */ (
    <>
        <div className="flex-1 text-center">Reps / Min</div>
        <div className="flex-1 text-center flex items-center justify-center gap-1">RPE <RPEInfoPopover /></div>
    </>
)}
```

Update the set input fields (lines 619-643) similarly — show weight input ONLY for `weight_reps`, reps input for `weight_reps` and `reps_only`, duration input for `duration`, and a toggle for `reps_or_duration`.

For `reps_or_duration`, add a small toggle button above the inputs:

```typescript
{trackingMode === 'reps_or_duration' && (
    <button
        onClick={() => {/* toggle between reps and duration mode for this exercise */}}
        className="text-xs text-slate-400 hover:text-indigo-400"
    >
        {/* show current mode and allow toggle */}
    </button>
)}
```

**Step 2: Update exercise icon/color in card header**

Update the icon/color logic (line 563) to match the exercise picker colors:

```typescript
<div className={`p-2 rounded-lg ${
    activeEx.exerciseDef.category === 'Olympic' ? 'bg-amber-500/20 text-amber-400' :
    activeEx.exerciseDef.category === 'Gymnastics' ? 'bg-rose-500/20 text-rose-400' :
    trackingMode === 'weight_reps' || trackingMode === 'reps_only' ? 'bg-indigo-500/20 text-indigo-400' :
    'bg-emerald-500/20 text-emerald-400'
}`}>
```

**Step 3: Update the finishWorkout function**

In `finishWorkout` (lines 372-442), update XP calculation to use tracking_mode:

```typescript
const trackingMode = ex.exerciseDef.tracking_mode || 'weight_reps'
// ...
if (trackingMode === 'weight_reps') {
    totalVolume += (w * r)
}

allSetsToInsert.push({
    exercise_id: ex.exerciseDef.id,
    set_order: s.set_order,
    weight: trackingMode === 'weight_reps' ? w : null,
    reps: trackingMode === 'duration' ? dur : r,
    rpe: parseFloat(s.rpe) || null,
    is_pr: s.isPR && trackingMode === 'weight_reps'
})
```

And update `exerciseTypes` map to pass `'Bodyweight'` for `reps_only` tracking:
```typescript
const xpType = trackingMode === 'reps_only' ? 'Bodyweight' :
    (ex.exerciseDef.exercise_type || 'Strength')
exerciseTypes.set(ex.exerciseDef.id, xpType)
```

**Step 4: Update rest timer logic**

In `toggleSetComplete` (line 331), use tracking_mode for rest timer duration:
```typescript
const trackingMode = activeEx?.exerciseDef.tracking_mode || 'weight_reps'
startRestTimer(trackingMode === 'weight_reps' ? 120 : 60)
```

**Step 5: Commit**

```bash
git add components/workout/logger.tsx && git commit -m "feat: logger respects tracking_mode (reps_only, duration, reps_or_duration)"
```

---

### Task 8: Update `saveWorkoutSession` in data-hooks — Handle Bodyweight XP Type

**Files:**
- Modify: `lib/supabase/data-hooks.ts:890-950`

**Step 1: Update the exerciseTypes parameter usage**

In `saveWorkoutSession` (line 890), the `exerciseTypes` map is passed through to XP calculation. The logger (Task 7) will now pass `'Bodyweight'` as the type for `reps_only` exercises. The XP engine (Task 5) already handles this type.

No changes needed in `saveWorkoutSession` itself — the types flow through. But verify that the battle log grouping (lines 944-950) handles the new type correctly. If `exType === 'Bodyweight'`, volume calculation should use reps * 2 (matching XP engine):

```typescript
if (exType === 'Strength') {
    existing.totalVolume += w * r
} else if (exType === 'Bodyweight') {
    existing.totalVolume += r * 2 // bodyweight XP proxy
}
```

**Step 2: Commit**

```bash
git add lib/supabase/data-hooks.ts && git commit -m "feat: handle Bodyweight exercise type in battle log volume"
```

---

### Task 9: Add WOD Data Hooks

**Files:**
- Modify: `lib/supabase/data-hooks.ts` (add at bottom)

**Step 1: Add WOD template types and fetch functions**

Add to bottom of `lib/supabase/data-hooks.ts`:

```typescript
// --- WOD Templates ---

export type WodMovement = {
    exercise_name: string
    reps: number
    weight_lbs: number | null
    notes: string
}

export type WodTemplate = {
    id: string
    name: string
    wod_type: 'amrap' | 'emom' | 'for_time' | 'chipper' | 'tabata'
    time_cap_seconds: number | null
    rounds: number | null
    is_benchmark: boolean
    created_by: string | null
    movements: WodMovement[]
    created_at: string
}

export async function fetchBenchmarkWods(): Promise<WodTemplate[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('wod_templates')
        .select('*')
        .eq('is_benchmark', true)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching benchmark WODs:', error)
        return []
    }
    return (data || []) as WodTemplate[]
}

export async function fetchUserWods(userId: string): Promise<WodTemplate[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('wod_templates')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching user WODs:', error)
        return []
    }
    return (data || []) as WodTemplate[]
}

export async function createCustomWod(wod: {
    name: string
    wod_type: string
    time_cap_seconds: number | null
    rounds: number | null
    created_by: string
    movements: WodMovement[]
}): Promise<WodTemplate | null> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('wod_templates')
        .insert({
            ...wod,
            is_benchmark: false,
            movements: wod.movements as any
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating custom WOD:', error)
        return null
    }
    return data as WodTemplate
}

export async function deleteCustomWod(wodId: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
        .from('wod_templates')
        .delete()
        .eq('id', wodId)

    if (error) {
        console.error('Error deleting WOD:', error)
        return false
    }
    return true
}
```

**Step 2: Commit**

```bash
git add lib/supabase/data-hooks.ts && git commit -m "feat: add WOD template CRUD data hooks"
```

---

### Task 10: Create WOD Timer Hook

**Files:**
- Create: `lib/hooks/use-wod-timer.ts`

**Step 1: Create the timer hook**

Create `lib/hooks/use-wod-timer.ts`:

```typescript
"use client"

import { useState, useRef, useCallback, useEffect } from 'react'

export type WodTimerMode = 'amrap' | 'for_time' | 'emom' | 'tabata'

interface WodTimerState {
    isRunning: boolean
    isPaused: boolean
    elapsedMs: number
    remainingMs: number
    currentRound: number
    currentInterval: number // EMOM: current minute, Tabata: current interval
    isWorkPhase: boolean // Tabata: work vs rest
}

interface UseWodTimerOptions {
    mode: WodTimerMode
    timeCapMs: number // Total time in ms
    emomIntervalMs?: number // Usually 60000 (1 minute)
    tabataWorkMs?: number // Usually 20000 (20 seconds)
    tabataRestMs?: number // Usually 10000 (10 seconds)
    tabataRounds?: number // Usually 8
    onComplete?: () => void
    onIntervalChange?: (interval: number) => void
}

export function useWodTimer(options: UseWodTimerOptions) {
    const {
        mode,
        timeCapMs,
        emomIntervalMs = 60000,
        tabataWorkMs = 20000,
        tabataRestMs = 10000,
        tabataRounds = 8,
        onComplete,
        onIntervalChange,
    } = options

    const [state, setState] = useState<WodTimerState>({
        isRunning: false,
        isPaused: false,
        elapsedMs: 0,
        remainingMs: mode === 'for_time' ? 0 : timeCapMs,
        currentRound: 0,
        currentInterval: 1,
        isWorkPhase: true,
    })

    const startTimeRef = useRef<number>(0)
    const pausedElapsedRef = useRef<number>(0)
    const rafRef = useRef<number>(0)

    const tick = useCallback(() => {
        const now = Date.now()
        const elapsed = pausedElapsedRef.current + (now - startTimeRef.current)

        if (mode === 'amrap' || mode === 'emom') {
            const remaining = Math.max(0, timeCapMs - elapsed)
            const currentInterval = Math.floor(elapsed / emomIntervalMs) + 1

            setState(prev => {
                if (mode === 'emom' && currentInterval !== prev.currentInterval) {
                    onIntervalChange?.(currentInterval)
                }
                return {
                    ...prev,
                    elapsedMs: elapsed,
                    remainingMs: remaining,
                    currentInterval,
                }
            })

            if (remaining <= 0) {
                onComplete?.()
                return // stop ticking
            }
        } else if (mode === 'for_time') {
            const remaining = Math.max(0, timeCapMs - elapsed)
            setState(prev => ({
                ...prev,
                elapsedMs: elapsed,
                remainingMs: remaining,
            }))

            if (remaining <= 0) {
                onComplete?.()
                return
            }
        } else if (mode === 'tabata') {
            const intervalDuration = tabataWorkMs + tabataRestMs
            const totalDuration = intervalDuration * tabataRounds
            const remaining = Math.max(0, totalDuration - elapsed)
            const currentInterval = Math.min(Math.floor(elapsed / intervalDuration) + 1, tabataRounds)
            const withinInterval = elapsed % intervalDuration
            const isWork = withinInterval < tabataWorkMs

            setState(prev => ({
                ...prev,
                elapsedMs: elapsed,
                remainingMs: remaining,
                currentInterval,
                isWorkPhase: isWork,
            }))

            if (remaining <= 0) {
                onComplete?.()
                return
            }
        }

        rafRef.current = requestAnimationFrame(tick)
    }, [mode, timeCapMs, emomIntervalMs, tabataWorkMs, tabataRestMs, tabataRounds, onComplete, onIntervalChange])

    const start = useCallback(() => {
        startTimeRef.current = Date.now()
        pausedElapsedRef.current = 0
        setState(prev => ({ ...prev, isRunning: true, isPaused: false }))
        rafRef.current = requestAnimationFrame(tick)
    }, [tick])

    const pause = useCallback(() => {
        cancelAnimationFrame(rafRef.current)
        pausedElapsedRef.current += Date.now() - startTimeRef.current
        setState(prev => ({ ...prev, isPaused: true }))
    }, [])

    const resume = useCallback(() => {
        startTimeRef.current = Date.now()
        setState(prev => ({ ...prev, isPaused: false }))
        rafRef.current = requestAnimationFrame(tick)
    }, [tick])

    const stop = useCallback(() => {
        cancelAnimationFrame(rafRef.current)
        setState(prev => ({ ...prev, isRunning: false, isPaused: false }))
    }, [])

    const addRound = useCallback(() => {
        setState(prev => ({ ...prev, currentRound: prev.currentRound + 1 }))
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => cancelAnimationFrame(rafRef.current)
    }, [])

    return {
        ...state,
        start,
        pause,
        resume,
        stop,
        addRound,
    }
}
```

**Step 2: Commit**

```bash
git add lib/hooks/use-wod-timer.ts && git commit -m "feat: add useWodTimer hook (AMRAP, For Time, EMOM, Tabata)"
```

---

### Task 11: Create WOD Picker Component

**Files:**
- Create: `components/wod/wod-picker.tsx`

**Step 1: Create the WOD picker component**

Create `components/wod/wod-picker.tsx`:

```typescript
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flame, Clock, Repeat, Zap, Plus, ChevronRight } from "lucide-react"
import { fetchBenchmarkWods, fetchUserWods, type WodTemplate } from "@/lib/supabase/data-hooks"
import { useUserStore } from "@/lib/store/user-store"

const WOD_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Flame }> = {
    amrap: { label: 'AMRAP', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Repeat },
    for_time: { label: 'For Time', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Clock },
    emom: { label: 'EMOM', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: Zap },
    chipper: { label: 'Chipper', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Flame },
    tabata: { label: 'Tabata', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: Zap },
}

function formatTimeCap(seconds: number | null): string {
    if (!seconds) return ''
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}hr`
    return `${Math.floor(seconds / 60)} min`
}

function getWodDescription(wod: WodTemplate): string {
    const movements = wod.movements
    if (movements.length <= 2) {
        return movements.map(m => {
            const weight = m.weight_lbs ? ` (${m.weight_lbs}lb)` : ''
            return `${m.reps} ${m.exercise_name}${weight}`
        }).join(' + ')
    }
    return `${movements.length} movements`
}

interface WodPickerProps {
    onSelectWod: (wod: WodTemplate) => void
    onCreateCustom: () => void
}

export function WodPicker({ onSelectWod, onCreateCustom }: WodPickerProps) {
    const { user } = useUserStore()
    const [benchmarks, setBenchmarks] = useState<WodTemplate[]>([])
    const [customWods, setCustomWods] = useState<WodTemplate[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [b, c] = await Promise.all([
                fetchBenchmarkWods(),
                user ? fetchUserWods(user.id) : Promise.resolve([]),
            ])
            setBenchmarks(b)
            setCustomWods(c)
            setLoading(false)
        }
        load()
    }, [user])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Create Custom WOD */}
            <Button
                onClick={onCreateCustom}
                variant="outline"
                className="w-full border-dashed border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 py-5 text-base font-semibold"
            >
                <Plus className="w-5 h-5 mr-2" /> Create Custom WOD
            </Button>

            {/* Custom WODs */}
            {customWods.length > 0 && (
                <div>
                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 px-1">
                        Your WODs
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {customWods.map(wod => (
                            <WodCard key={wod.id} wod={wod} onSelect={onSelectWod} />
                        ))}
                    </div>
                </div>
            )}

            {/* Benchmark WODs */}
            <div>
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 px-1">
                    Benchmark WODs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {benchmarks.map(wod => (
                        <WodCard key={wod.id} wod={wod} onSelect={onSelectWod} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function WodCard({ wod, onSelect }: { wod: WodTemplate; onSelect: (wod: WodTemplate) => void }) {
    const config = WOD_TYPE_CONFIG[wod.wod_type] || WOD_TYPE_CONFIG.for_time
    const Icon = config.icon

    return (
        <Card
            className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl cursor-pointer hover:border-amber-500/30 transition-all group"
            onClick={() => onSelect(wod)}
        >
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${config.color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{wod.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {getWodDescription(wod)}
                        {wod.time_cap_seconds ? ` \u00b7 ${formatTimeCap(wod.time_cap_seconds)}` : ''}
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
            </CardContent>
        </Card>
    )
}
```

**Step 2: Commit**

```bash
git add components/wod/wod-picker.tsx && git commit -m "feat: add WOD picker component with benchmark cards"
```

---

### Task 12: Create Active WOD Component

**Files:**
- Create: `components/wod/active-wod.tsx`

**Step 1: Create the active WOD component**

Create `components/wod/active-wod.tsx`. This is the main WOD execution screen with timer, movement list, round counter, and controls:

```typescript
"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, Plus, Minus, Flame, ArrowLeft } from "lucide-react"
import { useWodTimer } from "@/lib/hooks/use-wod-timer"
import type { WodTemplate } from "@/lib/supabase/data-hooks"

interface WodResult {
    wodName: string
    wodType: string
    elapsedMs: number
    roundsCompleted: number
    extraReps: number
    movements: WodTemplate['movements']
}

interface ActiveWodProps {
    wod: WodTemplate
    onComplete: (result: WodResult) => void
    onCancel: () => void
}

function formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function ActiveWod({ wod, onComplete, onCancel }: ActiveWodProps) {
    const [extraReps, setExtraReps] = useState(0)
    const [hasStarted, setHasStarted] = useState(false)

    const timerMode = wod.wod_type === 'chipper' ? 'for_time' : wod.wod_type as any

    const handleComplete = useCallback(() => {
        // Timer finished naturally
    }, [])

    const timer = useWodTimer({
        mode: timerMode === 'tabata' ? 'tabata' : timerMode,
        timeCapMs: (wod.time_cap_seconds || 1200) * 1000,
        onComplete: handleComplete,
    })

    const handleStart = () => {
        setHasStarted(true)
        timer.start()
    }

    const handleFinish = () => {
        timer.stop()
        onComplete({
            wodName: wod.name,
            wodType: wod.wod_type,
            elapsedMs: timer.elapsedMs,
            roundsCompleted: timer.currentRound,
            extraReps,
            movements: wod.movements,
        })
    }

    const isCountdown = wod.wod_type === 'amrap' || wod.wod_type === 'emom' || wod.wod_type === 'tabata'
    const displayTime = isCountdown ? timer.remainingMs : timer.elapsedMs
    const timerColor = timer.remainingMs < 60000 && isCountdown && timer.isRunning
        ? 'text-red-400' : 'text-amber-400'

    return (
        <div className="space-y-6 pb-32 sm:pb-24">
            {/* Back button */}
            <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {/* WOD Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <Flame className="w-6 h-6 text-amber-400" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white font-cinzel">{wod.name}</h1>
                </div>
                <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold uppercase tracking-wider">
                    {wod.wod_type.replace('_', ' ')}
                    {wod.time_cap_seconds ? ` \u00b7 ${Math.floor(wod.time_cap_seconds / 60)} min` : ''}
                </span>
            </div>

            {/* Timer */}
            <div className="text-center py-8">
                <div className={`text-6xl sm:text-8xl font-mono font-bold ${timerColor} transition-colors`}>
                    {formatMs(displayTime)}
                </div>

                {/* EMOM current interval */}
                {wod.wod_type === 'emom' && timer.isRunning && (
                    <p className="text-sm text-slate-400 mt-2">
                        Minute {timer.currentInterval} of {Math.floor((wod.time_cap_seconds || 0) / 60)}
                    </p>
                )}

                {/* Tabata phase indicator */}
                {wod.wod_type === 'tabata' && timer.isRunning && (
                    <p className={`text-lg font-bold mt-2 ${timer.isWorkPhase ? 'text-red-400' : 'text-green-400'}`}>
                        {timer.isWorkPhase ? 'WORK' : 'REST'}
                    </p>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                {!hasStarted ? (
                    <Button onClick={handleStart} className="px-12 py-6 text-lg font-bold bg-amber-500 text-black hover:bg-amber-400">
                        <Play className="w-6 h-6 mr-2" /> Start
                    </Button>
                ) : (
                    <>
                        {timer.isPaused ? (
                            <Button onClick={timer.resume} className="px-8 py-5 bg-amber-500 text-black hover:bg-amber-400">
                                <Play className="w-5 h-5 mr-2" /> Resume
                            </Button>
                        ) : (
                            <Button onClick={timer.pause} variant="outline" className="px-8 py-5 border-amber-500/30 text-amber-400">
                                <Pause className="w-5 h-5 mr-2" /> Pause
                            </Button>
                        )}
                        <Button onClick={handleFinish} className="px-8 py-5 bg-red-500 text-white hover:bg-red-400">
                            <Square className="w-5 h-5 mr-2" /> Finish
                        </Button>
                    </>
                )}
            </div>

            {/* Round Counter (AMRAP / Chipper) */}
            {(wod.wod_type === 'amrap' || wod.wod_type === 'chipper') && hasStarted && (
                <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-300">Rounds Completed</span>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => timer.addRound()}
                                className="h-10 w-10 border-slate-700 text-slate-400 hover:text-white"
                                disabled={timer.currentRound <= 0}
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-3xl font-bold text-amber-400 font-mono w-12 text-center">
                                {timer.currentRound}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => timer.addRound()}
                                className="h-10 w-10 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Extra Reps (AMRAP) */}
            {wod.wod_type === 'amrap' && hasStarted && (
                <Card className="border-slate-800/60 bg-slate-900/40">
                    <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-300">Extra Reps</span>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setExtraReps(prev => Math.max(0, prev - 1))}
                                className="h-10 w-10 border-slate-700"
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-2xl font-bold text-slate-200 font-mono w-12 text-center">
                                {extraReps}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setExtraReps(prev => prev + 1)}
                                className="h-10 w-10 border-slate-700"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Movement List */}
            <Card className="border-slate-800/60 bg-slate-900/40">
                <CardContent className="p-4 space-y-2">
                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                        Movements
                        {wod.rounds ? ` \u00d7 ${wod.rounds} rounds` : ''}
                    </h3>
                    {wod.movements.map((movement, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-0">
                            <span className="text-sm text-slate-200">{movement.exercise_name}</span>
                            <div className="text-sm text-slate-400 text-right">
                                <span className="text-amber-400 font-semibold">{movement.reps}</span>
                                {movement.weight_lbs && (
                                    <span className="ml-1">@ {movement.weight_lbs}lb</span>
                                )}
                                {movement.notes && (
                                    <span className="ml-1 text-xs text-slate-500">({movement.notes})</span>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
```

**Step 2: Commit**

```bash
git add components/wod/active-wod.tsx && git commit -m "feat: add ActiveWod component with timer, rounds, and movement list"
```

---

### Task 13: Create WOD Results Component

**Files:**
- Create: `components/wod/wod-results-modal.tsx`

**Step 1: Create the WOD results modal**

Create `components/wod/wod-results-modal.tsx`:

```typescript
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Flame, Trophy, Clock, Repeat } from "lucide-react"

interface WodResultsModalProps {
    isOpen: boolean
    onDismiss: () => void
    wodName: string
    wodType: string
    elapsedMs: number
    roundsCompleted: number
    extraReps: number
    xpEarned: number
}

function formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function WodResultsModal({
    isOpen,
    onDismiss,
    wodName,
    wodType,
    elapsedMs,
    roundsCompleted,
    extraReps,
    xpEarned,
}: WodResultsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onDismiss() }}>
            <DialogContent className="sm:max-w-[400px] bg-slate-950 border-amber-500/30 text-slate-50 text-center">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-amber-400 font-cinzel flex items-center justify-center gap-2">
                        <Flame className="w-6 h-6" />
                        WOD Complete
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <h2 className="text-xl font-bold text-white">{wodName}</h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Time */}
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
                            <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                            <p className="text-2xl font-mono font-bold text-white">{formatMs(elapsedMs)}</p>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                                {wodType === 'for_time' || wodType === 'chipper' ? 'Finish Time' : 'Duration'}
                            </p>
                        </div>

                        {/* Rounds (for AMRAP) */}
                        {(wodType === 'amrap') && (
                            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
                                <Repeat className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                                <p className="text-2xl font-mono font-bold text-white">
                                    {roundsCompleted}{extraReps > 0 ? `+${extraReps}` : ''}
                                </p>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider">Rounds + Reps</p>
                            </div>
                        )}

                        {/* XP */}
                        <div className={`bg-slate-900/60 rounded-xl p-4 border border-slate-800/60 ${wodType !== 'amrap' ? 'col-span-1' : ''}`}>
                            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                            <p className="text-2xl font-mono font-bold text-amber-400">+{xpEarned}</p>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider">XP Earned</p>
                        </div>
                    </div>

                    <Button onClick={onDismiss} className="w-full py-5 bg-amber-500 text-black hover:bg-amber-400 font-bold text-base">
                        Continue
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
```

**Step 2: Commit**

```bash
git add components/wod/wod-results-modal.tsx && git commit -m "feat: add WOD results modal with time/rounds/XP display"
```

---

### Task 14: Create WOD Page

**Files:**
- Create: `app/dashboard/wod/page.tsx`

**Step 1: Create the WOD page**

Create `app/dashboard/wod/page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { Flame } from "lucide-react"
import { WodPicker } from "@/components/wod/wod-picker"
import { ActiveWod } from "@/components/wod/active-wod"
import { WodResultsModal } from "@/components/wod/wod-results-modal"
import { useUserStore } from "@/lib/store/user-store"
import { saveWorkoutSession, type WodTemplate } from "@/lib/supabase/data-hooks"
import { useRouter } from "next/navigation"

type WodPhase = 'pick' | 'active' | 'results'

interface WodResult {
    wodName: string
    wodType: string
    elapsedMs: number
    roundsCompleted: number
    extraReps: number
    movements: WodTemplate['movements']
}

export default function WodPage() {
    const { user, refreshProfile } = useUserStore()
    const router = useRouter()
    const [phase, setPhase] = useState<WodPhase>('pick')
    const [selectedWod, setSelectedWod] = useState<WodTemplate | null>(null)
    const [wodResult, setWodResult] = useState<WodResult | null>(null)
    const [xpEarned, setXpEarned] = useState(0)

    const handleSelectWod = (wod: WodTemplate) => {
        setSelectedWod(wod)
        setPhase('active')
    }

    const handleWodComplete = async (result: WodResult) => {
        if (!user) return
        setWodResult(result)

        // Build workout data from WOD result
        const now = new Date()
        const startTime = new Date(now.getTime() - result.elapsedMs)

        // Calculate total reps/volume for XP
        const exerciseTypes = new Map<string, string>()
        const sets: any[] = []
        let totalVolume = 0

        result.movements.forEach((movement, i) => {
            const totalReps = result.wodType === 'amrap'
                ? movement.reps * result.roundsCompleted + (i === 0 ? result.extraReps : 0)
                : movement.reps * (selectedWod?.rounds || 1)

            const weight = movement.weight_lbs || 0
            const isBodyweight = weight === 0

            exerciseTypes.set(`wod-${i}`, isBodyweight ? 'Bodyweight' : 'Strength')

            if (!isBodyweight) {
                totalVolume += weight * totalReps
            }

            sets.push({
                exercise_id: `wod-${i}`, // placeholder - will need to look up exercise by name
                set_order: i + 1,
                weight: weight || null,
                reps: totalReps,
                rpe: null,
                is_pr: false,
            })
        })

        // Note: actual saving will need exercise ID lookup by name
        // For now, store WOD metadata in the workout notes
        const wodMetadata = {
            wod_type: result.wodType,
            time_seconds: Math.floor(result.elapsedMs / 1000),
            rounds_completed: result.roundsCompleted,
            extra_reps: result.extraReps,
        }

        // Simple XP estimate: 2 XP per bodyweight rep, weight*reps/100 for weighted
        let estimatedXP = 0
        result.movements.forEach(m => {
            const reps = result.wodType === 'amrap'
                ? m.reps * result.roundsCompleted
                : m.reps * (selectedWod?.rounds || 1)
            if (m.weight_lbs) {
                estimatedXP += (m.weight_lbs * reps) / 100
            } else {
                estimatedXP += reps * 2
            }
        })
        setXpEarned(Math.round(estimatedXP))

        setPhase('results')
    }

    const handleResultsDismiss = () => {
        setPhase('pick')
        setSelectedWod(null)
        setWodResult(null)
        router.push('/dashboard')
    }

    const handleCreateCustom = () => {
        // TODO: implement custom WOD builder modal
        alert('Custom WOD builder coming soon!')
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-8">
            {phase === 'pick' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                            <Flame className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white font-cinzel">WOD</h1>
                            <p className="text-sm text-slate-400">Workout of the Day</p>
                        </div>
                    </div>
                    <WodPicker onSelectWod={handleSelectWod} onCreateCustom={handleCreateCustom} />
                </div>
            )}

            {phase === 'active' && selectedWod && (
                <ActiveWod
                    wod={selectedWod}
                    onComplete={handleWodComplete}
                    onCancel={() => { setPhase('pick'); setSelectedWod(null) }}
                />
            )}

            {phase === 'results' && wodResult && (
                <WodResultsModal
                    isOpen={true}
                    onDismiss={handleResultsDismiss}
                    wodName={wodResult.wodName}
                    wodType={wodResult.wodType}
                    elapsedMs={wodResult.elapsedMs}
                    roundsCompleted={wodResult.roundsCompleted}
                    extraReps={wodResult.extraReps}
                    xpEarned={xpEarned}
                />
            )}
        </div>
    )
}
```

**Step 2: Commit**

```bash
git add app/dashboard/wod/page.tsx && git commit -m "feat: add WOD page with pick/active/results phases"
```

---

### Task 15: Add WOD to Navigation

**Files:**
- Modify: `components/dashboard/nav.tsx:6,18`

**Step 1: Add Flame icon import**

Line 6 of `components/dashboard/nav.tsx`, add `Flame` to the import:

```typescript
import { Home, Dumbbell, Users, ShoppingBag, Package, GitBranch, Swords, Flame } from "lucide-react"
```

**Step 2: Add WOD nav item**

Insert after the Workout item (line 18) in the `navItems` array:

```typescript
{ href: "/dashboard/wod", label: "WOD", icon: Flame },
```

The full array should be:
```typescript
const navItems = [
    { href: "/dashboard", label: "Inn", icon: Home },
    { href: "/dashboard/workout", label: "Workout", icon: Dumbbell },
    { href: "/dashboard/wod", label: "WOD", icon: Flame },
    { href: "/dashboard/inventory", label: "Gear", icon: Package },
    { href: "/dashboard/skills", label: "Skills", icon: GitBranch },
    { href: "/dashboard/shop", label: "Shop", icon: ShoppingBag },
    { href: "/dashboard/raid", label: "Raid", icon: Swords },
    { href: "/dashboard/party", label: "Party", icon: Users },
]
```

**Step 3: Commit**

```bash
git add components/dashboard/nav.tsx && git commit -m "feat: add WOD tab to navigation"
```

---

### Task 16: Seed File Updates (for fresh deploys)

**Files:**
- Modify: `supabase/seed_exercises.sql`
- Create: `supabase/seed_wod_templates.sql`
- Modify: `supabase/schema.sql`

**Step 1: Add `tracking_mode` to schema.sql exercises table**

In `supabase/schema.sql`, add `tracking_mode` to the exercises table definition (line 23):

```sql
  tracking_mode text not null default 'weight_reps', -- 'weight_reps', 'reps_only', 'duration', 'reps_or_duration'
```

**Step 2: Add wod_templates table to schema.sql**

Append to `supabase/schema.sql`:

```sql
-- WOD Templates
create table public.wod_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  wod_type text not null,
  time_cap_seconds integer,
  rounds integer,
  is_benchmark boolean default false,
  created_by uuid references public.users on delete cascade,
  movements jsonb not null,
  created_at timestamptz default now()
);

alter table public.wod_templates enable row level security;

create policy "Benchmark WODs viewable by all" on wod_templates for select using (is_benchmark = true);
create policy "Users can view own WODs" on wod_templates for select using (auth.uid() = created_by);
create policy "Users can create WODs" on wod_templates for insert with check (auth.uid() = created_by);
create policy "Users can delete own WODs" on wod_templates for delete using (auth.uid() = created_by);
```

**Step 3: Update seed_exercises.sql**

Add `tracking_mode` values to all INSERT statements in `supabase/seed_exercises.sql`. Add the new CrossFit exercises at the bottom (same SQL from Task 2).

**Step 4: Create seed_wod_templates.sql**

Create `supabase/seed_wod_templates.sql` with the benchmark WOD inserts (same SQL from Task 3 step 2).

**Step 5: Commit**

```bash
git add supabase/ && git commit -m "feat: update schema and seed files for CrossFit WOD system"
```

---

### Task 17: Verify & Test

**Step 1: Run the dev server**

```bash
cd /Users/georgegewinner/Desktop/QuestLift && PATH="/opt/homebrew/opt/node@20/bin:$PATH" npm run dev
```

**Step 2: Manual verification checklist**

1. Navigate to `/dashboard/workout`, add a bodyweight exercise (Push-ups) — verify no weight field shown
2. Add a Plank — verify duration field shown
3. Add a Barbell Bench Press — verify weight + reps shown (unchanged)
4. Navigate to `/dashboard/wod` — verify WOD picker loads with 15 benchmarks
5. Select "Cindy" (AMRAP 20) — verify countdown timer appears
6. Start timer, add rounds, finish — verify results modal shows
7. Check exercise picker has new categories (Olympic, Gymnastics, Mobility)

**Step 3: Final commit**

```bash
git add -A && git commit -m "feat: CrossFit WOD system complete — exercises, timers, benchmarks"
```

---

Plan complete and saved to `docs/plans/2026-03-06-crossfit-wod-system-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?

<function_calls>
<invoke name="AskUserQuestion">
<parameter name="questions">[{"question": "How should we execute the 17-task implementation plan?", "header": "Execution", "options": [{"label": "Subagent-Driven (Recommended)", "description": "Stay in this session. I dispatch fresh subagents per task, review between tasks, fast iteration."}, {"label": "Parallel Session", "description": "Open a new Claude Code session in a worktree. Batch execution with checkpoints."}], "multiSelect": false}]