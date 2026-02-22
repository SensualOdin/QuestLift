# QuestLift Mega Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 major feature systems: Wizard class, deeper raid mechanics, loot/equipment, bounties, skill trees, and prestige achievements/titles.

**Architecture:** Incremental layers — each feature builds on the previous. All database changes via Supabase MCP `apply_migration`. UI follows existing patterns (Tailwind + Shadcn + Framer Motion). Business logic in `lib/supabase/data-hooks.ts` and `lib/xp-engine.ts`.

**Tech Stack:** Next.js 16, React 19, Supabase (PostgreSQL), Zustand, Tailwind CSS 4, Framer Motion, Lucide React, Shadcn/UI

**Supabase Project ID:** `ezikuwdjkfgyykockwdk`

**Note:** This project has no test infrastructure. Each task includes manual verification steps. Tasks are grouped by feature phase.

---

## Phase 1: Wizard Class

### Task 1: Add `wis_minutes_lifetime` column and Recovery exercises to database

**Files:**
- Supabase migration (via MCP)
- New file: `supabase/wizard_schema.sql` (reference copy)

**Step 1: Apply migration to add WIS column to users table**

Use Supabase MCP `apply_migration`:
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wis_minutes_lifetime integer DEFAULT 0;
```
Migration name: `add_wis_minutes_lifetime`

**Step 2: Apply migration to seed Recovery exercises**

Use Supabase MCP `apply_migration`:
```sql
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Yoga Flow',              'Core',      'Bodyweight', 'Recovery'),
  ('Sun Salutation',         'Core',      'Bodyweight', 'Recovery'),
  ('Foam Rolling',           'Recovery',  'Other',      'Recovery'),
  ('Dynamic Stretching',     'Recovery',  'Bodyweight', 'Recovery'),
  ('Static Stretching',      'Recovery',  'Bodyweight', 'Recovery'),
  ('Pilates',                'Core',      'Bodyweight', 'Recovery'),
  ('Breathwork',             'Recovery',  'Bodyweight', 'Recovery'),
  ('Meditation Walk',        'Recovery',  'Bodyweight', 'Recovery'),
  ('Hip Opener Flow',        'Recovery',  'Bodyweight', 'Recovery'),
  ('Shoulder Mobility',      'Recovery',  'Bodyweight', 'Recovery'),
  ('Spine Mobility',         'Recovery',  'Bodyweight', 'Recovery'),
  ('Balance Training',       'Recovery',  'Bodyweight', 'Recovery');
```
Migration name: `seed_recovery_exercises`

**Step 3: Save reference SQL file**

Create `supabase/wizard_schema.sql` with both SQL statements above for documentation.

**Step 4: Verify**

Use Supabase MCP `execute_sql`:
```sql
SELECT count(*) FROM exercises WHERE exercise_type = 'Recovery';
```
Expected: 12

**Step 5: Commit**
```
feat: add WIS stat column and Recovery exercises for Wizard class
```

---

### Task 2: Update XP engine for Wizard class and Recovery exercises

**Files:**
- Modify: `lib/xp-engine.ts`

**Step 1: Add 'Recovery' to WorkoutType**

In `lib/xp-engine.ts:3`, change:
```typescript
export type WorkoutType = 'Strength' | 'Cardio' | 'Mobility'
```
to:
```typescript
export type WorkoutType = 'Strength' | 'Cardio' | 'Mobility' | 'Recovery'
```

**Step 2: Update `calculateSessionXP` to handle Recovery type**

In `lib/xp-engine.ts:84`, the existing code routes non-Strength to `calculateCardioSetXP`. Recovery exercises should also use `calculateCardioSetXP` (duration-based). The existing `else` branch already handles this — no change needed here since Recovery is duration-based like Cardio.

**Step 3: Verify build**

Run: `npm run build` — should compile without errors.

**Step 4: Commit**
```
feat: add Recovery type to XP engine WorkoutType
```

---

### Task 3: Update class specialty and damage logic for Wizard

**Files:**
- Modify: `lib/supabase/data-hooks.ts` (lines 814-826: `determineClassSpecialty`, lines 636-678: stat tracking, lines 748-789: raid damage)

**Step 1: Add Wizard case to `determineClassSpecialty()`**

In `lib/supabase/data-hooks.ts:814-826`, add Wizard case:
```typescript
function determineClassSpecialty(className: string | null | undefined, exerciseType: string): boolean {
    if (!className) return false
    switch (className) {
        case 'Tank':
            return exerciseType === 'Strength'
        case 'Rogue':
            return exerciseType === 'Cardio' || exerciseType === 'Mobility'
        case 'Paladin':
            return exerciseType === 'Strength'
        case 'Wizard':
            return exerciseType === 'Recovery' || exerciseType === 'Mobility'
        default:
            return false
    }
}
```

**Step 2: Track WIS minutes in `saveWorkoutSession()`**

In `lib/supabase/data-hooks.ts`, around line 666-677 where `strVolume` and `dexMinutes` are calculated, add WIS tracking:

After `let conSets = sets.length` (line 669), add:
```typescript
let wisMinutes = 0
```

In the for loop (line 671), add a case for Recovery:
```typescript
for (const set of sets) {
    const exType = exerciseTypes.get(set.exercise_id) || 'Strength'
    if (exType === 'Strength') {
        strVolume += (set.weight || 0) * (set.reps || 0)
    } else if (exType === 'Recovery') {
        wisMinutes += (set.reps || 0) // reps stores duration for non-strength
    } else {
        dexMinutes += (set.reps || 0)
    }
}
```

In the user update (around line 725-737), add WIS:
```typescript
const newWisMinutes = (currentUser.wis_minutes_lifetime || 0) + wisMinutes
```
And include in the update object:
```typescript
wis_minutes_lifetime: newWisMinutes,
```

**Step 3: Update user data fetch to include `wis_minutes_lifetime`**

The existing fetch at line 682 uses `select(...)` — add `wis_minutes_lifetime` to the selected fields.

**Step 4: Add Magic Damage to raid damage calculation**

In `lib/supabase/data-hooks.ts`, around line 756-763, update the damage calculation to also calculate magic damage from Recovery exercises:

```typescript
if (activeRaid) {
    let damage = strVolume
    let magicDamage = 0
    for (const set of sets) {
        const exType = exerciseTypes.get(set.exercise_id) || 'Strength'
        if (exType === 'Recovery') {
            magicDamage += (set.reps || 0) * 30 // 30 DMG per minute, no RPE gate
        } else if (exType !== 'Strength' && (set.rpe || 0) >= 8) {
            damage += (set.reps || 0) * 50 // Cardio: 50 DMG/min at RPE 8+
        }
    }
    const totalDamage = damage + magicDamage
    // ... rest of insert uses totalDamage instead of damage
```

Note: For now, we record total damage. The `damage_type` column will be added in Phase 2 (Deeper Raids).

**Step 5: Verify build**

Run: `npm run build`

**Step 6: Commit**
```
feat: add Wizard class specialty, WIS tracking, and magic damage
```

---

### Task 4: Add Wizard to class selection modal

**Files:**
- Modify: `components/dashboard/class-selection-modal.tsx`

**Step 1: Add Wizard class option**

In `components/dashboard/class-selection-modal.tsx`, import `Sparkles` from lucide-react. Add Wizard to the CLASSES array (line 11-44):

```typescript
{
    id: "Wizard",
    name: "Wizard",
    icon: Sparkles,
    stat: "WIS",
    description: "Mind over matter. +15% XP on Core, Yoga, Mobility, and Recovery exercises.",
    color: "text-purple-400",
    bg: "bg-purple-400/10 hover:bg-purple-400/20",
    border: "border-purple-400/30",
    selectedBorder: "border-purple-400 ring-4 ring-purple-400/20"
}
```

**Step 2: Update grid to 4 columns on desktop**

Change `grid-cols-1 md:grid-cols-3` to `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` on line 63. Also update `sm:max-w-[700px]` to `sm:max-w-[900px]` on line 49.

**Step 3: Verify** — run dev server, check class selection looks correct with 4 classes.

**Step 4: Commit**
```
feat: add Wizard class to class selection modal
```

---

### Task 5: Add Wizard to user profile display

**Files:**
- Modify: `components/dashboard/user-profile.tsx`

**Step 1: Import Sparkles icon**

Add `Sparkles` to the lucide-react import on line 6.

**Step 2: Add Wizard to `getCharacterArt()`**

After the Paladin block (line 37-40), add:
```typescript
if (cls === 'wizard') {
    if (level >= 50) return { src: '/characters/wizard-legendary.png', tier: 'Legendary Wizard', color: 'text-yellow-400' }
    if (level >= 25) return { src: '/characters/wizard-mystic.png', tier: 'Mystic Wizard', color: 'text-purple-400' }
    if (level >= 10) return { src: '/characters/wizard-arcane.png', tier: 'Arcane Wizard', color: 'text-blue-400' }
    return { src: '/characters/wizard-starter.png', tier: 'Wizard', color: 'text-purple-400' }
}
```

**Step 3: Add Wizard to `getClassIcon()`**

On line 46-49, add: `if (className === 'Wizard') return Sparkles`

**Step 4: Add Wizard tiers to `getNextTier()`**

On line 57, add Wizard tier names:
```typescript
const tiers = [
    { level: 10, name: className === 'Tank' ? 'Iron' : className === 'Rogue' ? 'Shadow' : className === 'Wizard' ? 'Arcane' : 'Blessed' },
    { level: 25, name: className === 'Tank' ? 'Steel' : className === 'Rogue' ? 'Phantom' : className === 'Wizard' ? 'Mystic' : 'Divine' },
    { level: 50, name: 'Legendary' },
]
```

**Step 5: Add WIS attribute to the attributes grid**

In the attributes section (lines 218-242), change `grid-cols-3` to `grid-cols-4` and add after CON:
```tsx
<div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-center">
    <div className="text-purple-400 text-xs font-bold mb-1">WIS</div>
    <div className="text-lg font-mono text-slate-200" title="Lifetime Recovery Minutes">
        {user.wis_minutes_lifetime || 0}
    </div>
</div>
```

**Step 6: Verify** — check profile renders correctly with WIS stat.

**Step 7: Commit**
```
feat: add Wizard class display to user profile
```

---

### Task 6: Add placeholder Wizard character art

**Files:**
- Create: `public/characters/wizard-starter.png`
- Create: `public/characters/wizard-arcane.png`
- Create: `public/characters/wizard-mystic.png`
- Create: `public/characters/wizard-legendary.png`

**Step 1:** For now, copy an existing character image as placeholder for each tier. Example:
```bash
cp public/characters/novice.png public/characters/wizard-starter.png
cp public/characters/novice.png public/characters/wizard-arcane.png
cp public/characters/novice.png public/characters/wizard-mystic.png
cp public/characters/novice.png public/characters/wizard-legendary.png
```

**Step 2: Commit**
```
feat: add placeholder Wizard character art
```

---

### Task 7: Update Supabase TypeScript types

**Files:**
- Modify: `lib/supabase-types.ts`

**Step 1:** Use Supabase MCP `generate_typescript_types` to regenerate the types file with the new `wis_minutes_lifetime` column. Replace the contents of `lib/supabase-types.ts` with the generated output.

**Step 2: Verify build** — `npm run build`

**Step 3: Commit**
```
chore: regenerate Supabase types for Wizard columns
```

---

## Phase 2: Deeper Raid Boss Mechanics

### Task 8: Add raid shield and weakness columns

**Files:**
- Supabase migration (via MCP)
- New file: `supabase/raid_v2_schema.sql` (reference)

**Step 1: Apply migration**

```sql
-- Add shield and weakness mechanics to raids
ALTER TABLE public.raids
  ADD COLUMN IF NOT EXISTS shield_type text,
  ADD COLUMN IF NOT EXISTS shield_hp bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shield_hp_current bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boss_weakness text,
  ADD COLUMN IF NOT EXISTS boss_resistance text;

-- Add damage_type to raid_damage
ALTER TABLE public.raid_damage
  ADD COLUMN IF NOT EXISTS damage_type text DEFAULT 'physical';
```
Migration name: `add_raid_shields_and_weaknesses`

**Step 2: Save reference SQL**

Create `supabase/raid_v2_schema.sql`.

**Step 3: Verify** — `execute_sql`: `SELECT column_name FROM information_schema.columns WHERE table_name = 'raids' AND column_name LIKE 'shield%';`

**Step 4: Commit**
```
feat: add shield and weakness columns to raids table
```

---

### Task 9: Update raid damage recording with damage types

**Files:**
- Modify: `lib/supabase/data-hooks.ts` (raid damage section, ~lines 748-789)

**Step 1: Record damage by type**

Replace the single damage insert in `saveWorkoutSession()` with type-aware inserts:

```typescript
if (activeRaid) {
    // Calculate damage by type
    let physicalDmg = strVolume
    let cardioDmg = 0
    let magicDmg = 0

    for (const set of sets) {
        const exType = exerciseTypes.get(set.exercise_id) || 'Strength'
        if (exType === 'Recovery') {
            magicDmg += (set.reps || 0) * 30
        } else if (exType !== 'Strength' && (set.rpe || 0) >= 8) {
            cardioDmg += (set.reps || 0) * 50
        }
    }

    // Apply weakness/resistance multipliers
    const applyMultiplier = (dmg: number, type: string) => {
        if (activeRaid.boss_weakness === type) return Math.round(dmg * 2)
        if (activeRaid.boss_resistance === type) return Math.round(dmg * 0.5)
        return dmg
    }

    physicalDmg = applyMultiplier(physicalDmg, 'physical')
    cardioDmg = applyMultiplier(cardioDmg, 'cardio')
    magicDmg = applyMultiplier(magicDmg, 'magic')

    // Insert damage records by type
    const damageRecords = []
    if (physicalDmg > 0) damageRecords.push({ raid_id: activeRaid.id, user_id: userId, workout_id: insertedWorkout.id, damage: physicalDmg, damage_type: 'physical' })
    if (cardioDmg > 0) damageRecords.push({ raid_id: activeRaid.id, user_id: userId, workout_id: insertedWorkout.id, damage: cardioDmg, damage_type: 'cardio' })
    if (magicDmg > 0) damageRecords.push({ raid_id: activeRaid.id, user_id: userId, workout_id: insertedWorkout.id, damage: magicDmg, damage_type: 'magic' })

    if (damageRecords.length > 0) {
        await supabase.from('raid_damage').insert(damageRecords)

        // Check shield first, then boss HP
        // Fetch total damage by type
        const { data: allDamage } = await supabase
            .from('raid_damage')
            .select('damage, damage_type')
            .eq('raid_id', activeRaid.id)

        let totalShieldDmg = 0
        let totalBossDmg = 0

        for (const d of (allDamage || [])) {
            // Shield damage: only matching type counts
            if (activeRaid.shield_type && activeRaid.shield_hp && (activeRaid.shield_hp_current || activeRaid.shield_hp) > 0) {
                const shieldDmgType = activeRaid.shield_type === 'swift' ? 'cardio' :
                    activeRaid.shield_type === 'arcane' ? 'magic' : 'physical'
                if (d.damage_type === shieldDmgType) {
                    totalShieldDmg += d.damage
                }
            }
            totalBossDmg += d.damage
        }

        // Update shield HP
        if (activeRaid.shield_hp && totalShieldDmg > 0) {
            const newShieldHp = Math.max(0, (activeRaid.shield_hp) - totalShieldDmg)
            await supabase.from('raids').update({ shield_hp_current: newShieldHp }).eq('id', activeRaid.id)
        }

        // Check if boss defeated (only count damage after shield is broken)
        const shieldBroken = !activeRaid.shield_hp || totalShieldDmg >= activeRaid.shield_hp
        if (shieldBroken && totalBossDmg >= activeRaid.boss_max_hp) {
            await supabase.from('raids').update({ status: 'defeated' }).eq('id', activeRaid.id)
        }
    }
}
```

**Step 2: Update `fetchActiveRaid()` to include new columns**

In `fetchActiveRaid()` (line 309-326), the `select('*')` already fetches all columns, so the new shield/weakness columns are included automatically.

**Step 3: Verify build** — `npm run build`

**Step 4: Commit**
```
feat: record typed raid damage with shield and weakness mechanics
```

---

### Task 10: Update Raid Boss UI with shield bar and weakness badges

**Files:**
- Modify: `components/social/raid-boss.tsx`

**Step 1: Add shield bar above HP bar**

After the existing Boss HP section (line 105-132), add shield bar. In the `CardContent` area, before the HP bar:

```tsx
{/* Shield Bar (if active) */}
{raid.shield_type && raid.shield_hp > 0 && (
    <div className="mb-4">
        <div className="flex justify-between text-xs font-bold font-mono tracking-widest uppercase mb-2">
            <span className="text-cyan-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {raid.shield_type === 'swift' ? 'Swift Shield' : raid.shield_type === 'arcane' ? 'Arcane Shield' : 'Iron Shield'}
            </span>
            <span className="text-cyan-300">
                {Math.max(0, (raid.shield_hp || 0) - shieldDamage).toLocaleString()} / {(raid.shield_hp || 0).toLocaleString()}
            </span>
        </div>
        <div className="relative h-3 w-full bg-slate-900 rounded-sm overflow-hidden border-2 border-cyan-950">
            <div
                className="absolute top-0 right-0 h-full bg-cyan-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                style={{ width: `${shieldPercent}%` }}
            />
        </div>
        <p className="text-[10px] text-cyan-400/60 mt-1">
            {raid.shield_type === 'swift' ? 'Break with Cardio damage' : raid.shield_type === 'arcane' ? 'Break with Magic damage' : 'Break with Strength damage'}
        </p>
    </div>
)}
```

**Step 2: Add weakness/resistance badges below boss name**

After the boss name and enrage timer, add:
```tsx
<div className="flex gap-2 mt-2">
    {raid.boss_weakness && (
        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
            Weak: {raid.boss_weakness} (2x)
        </span>
    )}
    {raid.boss_resistance && (
        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
            Resists: {raid.boss_resistance} (0.5x)
        </span>
    )}
</div>
```

**Step 3: Calculate shield damage from typed damage records**

At the top of the component's render logic, compute shield damage:
```typescript
const shieldDmgType = raid.shield_type === 'swift' ? 'cardio' : raid.shield_type === 'arcane' ? 'magic' : 'physical'
let shieldDamage = 0
for (const dmgRec of (raid.raid_damage || [])) {
    if (dmgRec.damage_type === shieldDmgType) shieldDamage += dmgRec.damage || 0
}
const shieldPercent = raid.shield_hp ? (Math.max(0, raid.shield_hp - shieldDamage) / raid.shield_hp) * 100 : 0
```

**Step 4: Verify** — check raid boss page shows shield bar and badges.

**Step 5: Regenerate types** — Use Supabase MCP `generate_typescript_types`.

**Step 6: Commit**
```
feat: add shield bar and weakness/resistance badges to raid boss UI
```

---

## Phase 3: Loot & Equipment System

### Task 11: Create equipment and loot database tables

**Files:**
- Supabase migration (via MCP)
- New file: `supabase/equipment_schema.sql` (reference)

**Step 1: Apply migration**

```sql
-- Equipment catalog
CREATE TABLE public.equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  slot text NOT NULL, -- 'weapon', 'armor', 'accessory', 'consumable'
  rarity text NOT NULL DEFAULT 'common',
  effect_type text NOT NULL, -- 'xp_bonus_exercise', 'xp_bonus_category', 'raid_damage_bonus', 'iron_scraps_bonus', 'xp_bonus_flat'
  effect_value numeric NOT NULL DEFAULT 0,
  effect_target text, -- specific exercise name, category, or damage type
  icon text NOT NULL DEFAULT 'sword',
  cost integer, -- null = drop only, number = purchasable
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User equipment inventory
CREATE TABLE public.user_equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES public.equipment ON DELETE CASCADE NOT NULL,
  equipped_slot text, -- null = in inventory
  obtained_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  source text NOT NULL DEFAULT 'shop'
);

-- Loot boxes
CREATE TABLE public.loot_boxes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  source text NOT NULL DEFAULT 'raid',
  opened boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Loot box contents
CREATE TABLE public.loot_box_contents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loot_box_id uuid REFERENCES public.loot_boxes ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES public.equipment ON DELETE CASCADE NOT NULL
);

-- RLS
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_box_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment catalog viewable by all" ON equipment FOR SELECT USING (true);
CREATE POLICY "Users can view own equipment" ON user_equipment FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own equipment" ON user_equipment FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own equipment" ON user_equipment FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own equipment" ON user_equipment FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own loot boxes" ON loot_boxes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loot boxes" ON loot_boxes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loot boxes" ON loot_boxes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own loot box contents" ON loot_box_contents FOR SELECT USING (
  EXISTS (SELECT 1 FROM loot_boxes lb WHERE lb.id = loot_box_contents.loot_box_id AND lb.user_id = auth.uid())
);
CREATE POLICY "Users can insert loot box contents" ON loot_box_contents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM loot_boxes lb WHERE lb.id = loot_box_contents.loot_box_id AND lb.user_id = auth.uid())
);
```
Migration name: `create_equipment_and_loot_tables`

**Step 2: Seed starter equipment**

```sql
INSERT INTO public.equipment (name, description, slot, rarity, effect_type, effect_value, effect_target, icon, cost) VALUES
  -- Weapons (XP bonuses)
  ('Iron Sword',           'A basic blade. +3% XP on all Strength exercises.',           'weapon',    'common',    'xp_bonus_category', 0.03, 'Strength', 'sword',    200),
  ('Shadow Dagger',        'Quick and deadly. +3% XP on all Cardio exercises.',          'weapon',    'common',    'xp_bonus_category', 0.03, 'Cardio',   'sword',    200),
  ('Crystal Wand',         'Hums with energy. +3% XP on all Recovery exercises.',        'weapon',    'common',    'xp_bonus_category', 0.03, 'Recovery', 'wand',     200),
  ('Flamebrand',           'Burns bright. +5% XP on Bench Press.',                       'weapon',    'rare',      'xp_bonus_exercise', 0.05, 'Barbell Bench Press', 'flame', 500),
  ('Thunderstrike',        'Shakes the earth. +5% XP on Deadlift.',                     'weapon',    'rare',      'xp_bonus_exercise', 0.05, 'Deadlift', 'zap',      500),
  ('Void Blade',           '+10% raid damage.',                                          'weapon',    'epic',      'raid_damage_bonus',  0.10, NULL,       'sword',    NULL),
  ('Excalibur',            'Legendary. +8% XP on all exercises.',                        'weapon',    'legendary', 'xp_bonus_flat',      0.08, NULL,       'crown',    NULL),

  -- Armor (defense/consistency bonuses)
  ('Leather Vest',         '+50 flat XP per workout.',                                   'armor',     'common',    'xp_bonus_flat',      50,   NULL,       'shield',   150),
  ('Chainmail',            '+100 flat XP per workout.',                                  'armor',     'rare',      'xp_bonus_flat',      100,  NULL,       'shield',   400),
  ('Heavy Iron Bracers',   '+5% XP on Bench Press.',                                    'armor',     'rare',      'xp_bonus_exercise',  0.05, 'Barbell Bench Press', 'shield', 500),
  ('Dragonplate',          '+200 flat XP per workout.',                                  'armor',     'epic',      'xp_bonus_flat',      200,  NULL,       'shield',   NULL),
  ('Armor of the Titan',   '+15% raid damage.',                                         'armor',     'legendary', 'raid_damage_bonus',   0.15, NULL,       'shield',   NULL),

  -- Accessories
  ('Lucky Coin',           '+10% Iron Scraps earned.',                                   'accessory', 'common',    'iron_scraps_bonus',  0.10, NULL,       'coins',    100),
  ('Boots of Swiftness',   '+10% Cardio raid damage.',                                  'accessory', 'rare',      'raid_damage_bonus',  0.10, 'cardio',   'footprints', 400),
  ('Ring of Power',        '+5% XP on all Strength exercises.',                          'accessory', 'rare',      'xp_bonus_category',  0.05, 'Strength', 'gem',      500),
  ('Amulet of the Wise',   '+5% XP on all Recovery exercises.',                          'accessory', 'rare',      'xp_bonus_category',  0.05, 'Recovery', 'gem',      500),
  ('Crown of the Champion','+10% XP on all exercises.',                                  'accessory', 'legendary', 'xp_bonus_flat',      0.10, NULL,       'crown',    NULL),

  -- Consumables
  ('Pre-Workout Potion',   '+20% XP for your next workout session.',                    'consumable','rare',      'xp_bonus_flat',      0.20, NULL,       'flask-round', 150),
  ('Repair Kit',           'Grants 500 Iron Scraps immediately.',                       'consumable','common',    'iron_scraps_bonus',  500,  NULL,       'wrench',   300),
  ('Raid Banner',          '+25% raid damage for your next workout.',                   'consumable','epic',      'raid_damage_bonus',  0.25, NULL,       'flag',     500);
```
Migration name: `seed_starter_equipment`

**Step 3: Commit**
```
feat: create equipment tables and seed starter gear
```

---

### Task 12: Add equipment data functions

**Files:**
- Modify: `lib/supabase/data-hooks.ts`

**Step 1: Add equipment fetch functions**

Add at the end of `data-hooks.ts`:

```typescript
/**
 * Fetches user's equipment inventory and equipped items.
 */
export async function fetchUserEquipment(userId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('user_equipment')
        .select('*, equipment(*)')
        .eq('user_id', userId)
        .order('obtained_at', { ascending: false })

    if (error) {
        console.error('Error fetching equipment:', error)
        return []
    }
    return data || []
}

/**
 * Fetches all purchasable equipment (for shop).
 */
export async function fetchShopEquipment() {
    const supabase = createClient()
    const { data } = await supabase
        .from('equipment')
        .select('*')
        .not('cost', 'is', null)
        .order('cost', { ascending: true })
    return data || []
}

/**
 * Equips an item to a slot (unequips existing item in that slot).
 */
export async function equipItem(userId: string, userEquipmentId: string, slot: string): Promise<boolean> {
    const supabase = createClient()

    // Unequip any existing item in that slot
    await supabase
        .from('user_equipment')
        .update({ equipped_slot: null })
        .eq('user_id', userId)
        .eq('equipped_slot', slot)

    // Equip the new item
    const { error } = await supabase
        .from('user_equipment')
        .update({ equipped_slot: slot })
        .eq('id', userEquipmentId)
        .eq('user_id', userId)

    return !error
}

/**
 * Unequips an item.
 */
export async function unequipItem(userId: string, userEquipmentId: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
        .from('user_equipment')
        .update({ equipped_slot: null })
        .eq('id', userEquipmentId)
        .eq('user_id', userId)
    return !error
}

/**
 * Purchases equipment from the shop.
 */
export async function purchaseEquipment(userId: string, equipmentId: string, cost: number): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient()

    const { data: userData } = await supabase.from('users').select('iron_scraps').eq('id', userId).single()
    if (!userData || (userData.iron_scraps || 0) < cost) {
        return { success: false, error: 'Not enough Iron Scraps' }
    }

    // Check if already owned
    const { count } = await supabase
        .from('user_equipment')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('equipment_id', equipmentId)

    if ((count || 0) > 0) return { success: false, error: 'Already owned' }

    // Deduct and add
    const { error: updateErr } = await supabase
        .from('users')
        .update({ iron_scraps: (userData.iron_scraps || 0) - cost })
        .eq('id', userId)

    if (updateErr) return { success: false, error: 'Failed to deduct scraps' }

    const { error: insertErr } = await supabase
        .from('user_equipment')
        .insert({ user_id: userId, equipment_id: equipmentId, source: 'shop' })

    if (insertErr) {
        await supabase.from('users').update({ iron_scraps: userData.iron_scraps }).eq('id', userId)
        return { success: false, error: 'Failed to add item' }
    }

    return { success: true }
}

/**
 * Fetches user's loot boxes.
 */
export async function fetchLootBoxes(userId: string) {
    const supabase = createClient()
    const { data } = await supabase
        .from('loot_boxes')
        .select('*, loot_box_contents(*, equipment(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    return data || []
}

/**
 * Opens a loot box: generates random loot, marks as opened.
 */
export async function openLootBox(userId: string, lootBoxId: string): Promise<any> {
    const supabase = createClient()

    // Get all equipment that can drop
    const { data: allGear } = await supabase
        .from('equipment')
        .select('id, rarity')

    if (!allGear || allGear.length === 0) return null

    // Weighted random by rarity
    const weights: Record<string, number> = { common: 50, rare: 30, epic: 15, legendary: 5 }
    const weighted = allGear.flatMap(g => Array(weights[g.rarity] || 10).fill(g))
    const pick = weighted[Math.floor(Math.random() * weighted.length)]

    // Insert content and mark opened
    await supabase.from('loot_box_contents').insert({ loot_box_id: lootBoxId, equipment_id: pick.id })
    await supabase.from('loot_boxes').update({ opened: true }).eq('id', lootBoxId)

    // Add to user inventory
    await supabase.from('user_equipment').insert({ user_id: userId, equipment_id: pick.id, source: 'raid_drop' })

    // Return the equipment details
    const { data: gear } = await supabase.from('equipment').select('*').eq('id', pick.id).single()
    return gear
}

/**
 * Gets the user's currently equipped items and their effects.
 */
export async function getEquippedEffects(userId: string): Promise<{
    xpBonusFlat: number
    xpBonusByExercise: Map<string, number>
    xpBonusByCategory: Map<string, number>
    raidDamageBonus: number
    ironScrapsBonus: number
}> {
    const supabase = createClient()
    const { data } = await supabase
        .from('user_equipment')
        .select('equipped_slot, equipment(*)')
        .eq('user_id', userId)
        .not('equipped_slot', 'is', null)

    const effects = {
        xpBonusFlat: 0,
        xpBonusByExercise: new Map<string, number>(),
        xpBonusByCategory: new Map<string, number>(),
        raidDamageBonus: 0,
        ironScrapsBonus: 0,
    }

    for (const item of (data || [])) {
        const eq = Array.isArray(item.equipment) ? item.equipment[0] : item.equipment
        if (!eq) continue

        switch (eq.effect_type) {
            case 'xp_bonus_flat':
                effects.xpBonusFlat += Number(eq.effect_value) || 0
                break
            case 'xp_bonus_exercise':
                if (eq.effect_target) {
                    const existing = effects.xpBonusByExercise.get(eq.effect_target) || 0
                    effects.xpBonusByExercise.set(eq.effect_target, existing + Number(eq.effect_value))
                }
                break
            case 'xp_bonus_category':
                if (eq.effect_target) {
                    const existing = effects.xpBonusByCategory.get(eq.effect_target) || 0
                    effects.xpBonusByCategory.set(eq.effect_target, existing + Number(eq.effect_value))
                }
                break
            case 'raid_damage_bonus':
                effects.raidDamageBonus += Number(eq.effect_value) || 0
                break
            case 'iron_scraps_bonus':
                effects.ironScrapsBonus += Number(eq.effect_value) || 0
                break
        }
    }

    return effects
}
```

**Step 2: Award loot box on raid boss defeat**

In `saveWorkoutSession()`, after the `status: 'defeated'` update (around where boss is defeated), add loot box creation for all party members:

```typescript
if (shieldBroken && totalBossDmg >= activeRaid.boss_max_hp) {
    await supabase.from('raids').update({ status: 'defeated' }).eq('id', activeRaid.id)

    // Award loot boxes to all party members who contributed
    const { data: contributors } = await supabase
        .from('raid_damage')
        .select('user_id')
        .eq('raid_id', activeRaid.id)

    const uniqueUsers = [...new Set((contributors || []).map(c => c.user_id))]
    const lootBoxes = uniqueUsers.map(uid => ({ user_id: uid, source: 'raid' }))
    if (lootBoxes.length > 0) {
        await supabase.from('loot_boxes').insert(lootBoxes)
    }
}
```

**Step 3: Verify build** — `npm run build`

**Step 4: Commit**
```
feat: add equipment data functions and loot box system
```

---

### Task 13: Create Inventory page

**Files:**
- Create: `app/dashboard/inventory/page.tsx`
- Modify: `components/dashboard/nav.tsx`

**Step 1: Create inventory page**

Create `app/dashboard/inventory/page.tsx` — a client component with:
- 3 equipment slots (weapon/armor/accessory) displayed as cards at the top
- Inventory grid below showing all owned equipment
- Loot box section at the bottom
- Equip/unequip functionality
- Loot box opening animation

The component follows the same patterns as `shop/page.tsx`: uses `useUserStore`, fetches data on mount, handles equip/unequip/open actions.

**Step 2: Add Inventory to navigation**

In `components/dashboard/nav.tsx`, add import for `Backpack` (or `Package`) from lucide-react and add nav item:
```typescript
{ href: "/dashboard/inventory", label: "Gear", icon: Package },
```

**Step 3: Verify** — navigate to /dashboard/inventory

**Step 4: Commit**
```
feat: create Inventory page with equipment slots and loot boxes
```

---

### Task 14: Add Equipment tab to Shop

**Files:**
- Modify: `app/dashboard/shop/page.tsx`

**Step 1: Import Tabs component and equipment functions**

Add imports for Shadcn Tabs component and `fetchShopEquipment`, `purchaseEquipment` from data-hooks.

**Step 2: Wrap existing shop content in Tabs**

Convert the shop page to use tabs: `Cosmetics` | `Equipment` | `Consumables`.

- Cosmetics tab contains existing titles + frames
- Equipment tab shows purchasable weapons/armor/accessories
- Consumables tab shows consumable items

Each equipment card shows: name, rarity badge, effect description, cost, buy button.

**Step 3: Verify** — check shop has tabs, equipment is purchasable.

**Step 4: Regenerate types** — Supabase MCP `generate_typescript_types`.

**Step 5: Commit**
```
feat: add Equipment and Consumables tabs to shop
```

---

### Task 15: Integrate equipment effects into XP and raid calculations

**Files:**
- Modify: `lib/supabase/data-hooks.ts` (`saveWorkoutSession`)

**Step 1: Fetch equipped effects before XP calculation**

In `saveWorkoutSession()`, after building `xpSets` but before calling `calculateSessionXP`, fetch equipped effects:

```typescript
const equippedEffects = await getEquippedEffects(userId)
```

**Step 2: Apply equipment XP bonuses**

After `let xpEarned = calculateSessionXP(xpSets, consistency)`, apply flat and percentage bonuses:

```typescript
// Apply equipment flat XP bonus (if value < 1, treat as percentage; if >= 1, treat as flat)
if (equippedEffects.xpBonusFlat > 0) {
    if (equippedEffects.xpBonusFlat < 1) {
        xpEarned = Math.round(xpEarned * (1 + equippedEffects.xpBonusFlat))
    } else {
        xpEarned += equippedEffects.xpBonusFlat
    }
}
```

**Step 3: Apply equipment raid damage bonus**

In the raid damage section, after calculating physicalDmg/cardioDmg/magicDmg, apply:

```typescript
if (equippedEffects.raidDamageBonus > 0) {
    physicalDmg = Math.round(physicalDmg * (1 + equippedEffects.raidDamageBonus))
    cardioDmg = Math.round(cardioDmg * (1 + equippedEffects.raidDamageBonus))
    magicDmg = Math.round(magicDmg * (1 + equippedEffects.raidDamageBonus))
}
```

**Step 4: Apply Iron Scraps bonus**

In the Iron Scraps calculation:
```typescript
ironScrapsEarned = 10 + Math.min(newStreak, 10) * 5
if (equippedEffects.ironScrapsBonus > 0) {
    ironScrapsEarned = Math.round(ironScrapsEarned * (1 + equippedEffects.ironScrapsBonus))
}
```

**Step 5: Verify build** — `npm run build`

**Step 6: Commit**
```
feat: integrate equipment effects into XP and raid damage calculations
```

---

## Phase 4: Bounties / Adventurer's Guild

### Task 16: Add bounty system to data-hooks

**Files:**
- Modify: `lib/supabase/data-hooks.ts`

**Step 1: Add bounty condition types and pool**

After the existing `WEEKLY_QUEST_POOL` (around line 67), add:

```typescript
type BountyCondition =
    | 'bounty_volume_single_session'
    | 'bounty_sets_in_session'
    | 'bounty_cardio_minutes'
    | 'bounty_recovery_minutes'
    | 'bounty_exercise_logged'
    | 'bounty_mixed_session'
    | 'bounty_high_rpe_cardio'
    | 'bounty_morning_workout'
    | 'bounty_unique_exercises'

interface BountyTemplate {
    id: string
    title: string
    description: string
    condition: BountyCondition
    total: number
    rewardXP: number
    rewardScraps: number
}

const BOUNTY_POOL: BountyTemplate[] = [
    // Strength Bounties
    { id: 'b-boulder', title: 'Lift the Boulder', description: 'Lift 10,000 lbs total volume in one session.', condition: 'bounty_volume_single_session', total: 10000, rewardXP: 300, rewardScraps: 50 },
    { id: 'b-forge', title: 'The Forge', description: 'Complete 20 sets of strength exercises today.', condition: 'bounty_sets_in_session', total: 20, rewardXP: 250, rewardScraps: 40 },
    { id: 'b-anvil', title: 'Anvil Strike', description: 'Lift 5,000 lbs in one session.', condition: 'bounty_volume_single_session', total: 5000, rewardXP: 200, rewardScraps: 30 },
    { id: 'b-colossus', title: 'Colossus', description: 'Lift 20,000 lbs total volume in one session.', condition: 'bounty_volume_single_session', total: 20000, rewardXP: 500, rewardScraps: 100 },
    { id: 'b-iron-rain', title: 'Iron Rain', description: 'Complete 25 sets in one session.', condition: 'bounty_sets_in_session', total: 25, rewardXP: 300, rewardScraps: 50 },

    // Cardio Bounties
    { id: 'b-goblin', title: 'The Goblin Tunnels', description: 'Log 30 minutes of cardio today.', condition: 'bounty_cardio_minutes', total: 30, rewardXP: 300, rewardScraps: 50 },
    { id: 'b-wind-sprint', title: 'Wind Sprint', description: 'Log a cardio session at RPE 9+.', condition: 'bounty_high_rpe_cardio', total: 1, rewardXP: 250, rewardScraps: 40 },
    { id: 'b-marathon', title: 'Marathon Runner', description: 'Log 60 minutes of cardio today.', condition: 'bounty_cardio_minutes', total: 60, rewardXP: 400, rewardScraps: 75 },
    { id: 'b-chase', title: 'The Chase', description: 'Log 15 minutes of cardio today.', condition: 'bounty_cardio_minutes', total: 15, rewardXP: 150, rewardScraps: 25 },

    // Recovery/Wizard Bounties
    { id: 'b-meditate', title: 'Meditate', description: 'Log 15 minutes of recovery or flexibility work.', condition: 'bounty_recovery_minutes', total: 15, rewardXP: 200, rewardScraps: 30 },
    { id: 'b-inner-peace', title: 'Inner Peace', description: 'Log 30 minutes of yoga or stretching.', condition: 'bounty_recovery_minutes', total: 30, rewardXP: 300, rewardScraps: 50 },
    { id: 'b-healing', title: 'The Healing Springs', description: 'Log 45 minutes of recovery work today.', condition: 'bounty_recovery_minutes', total: 45, rewardXP: 350, rewardScraps: 60 },

    // Mixed/Challenge Bounties
    { id: 'b-spectrum', title: 'Full Spectrum', description: 'Log both strength and cardio in one session.', condition: 'bounty_mixed_session', total: 1, rewardXP: 350, rewardScraps: 60 },
    { id: 'b-gauntlet', title: 'The Gauntlet', description: 'Complete 30 sets in one session.', condition: 'bounty_sets_in_session', total: 30, rewardXP: 400, rewardScraps: 75 },
    { id: 'b-dawn', title: 'Dawn Patrol', description: 'Log a workout before 8 AM.', condition: 'bounty_morning_workout', total: 1, rewardXP: 200, rewardScraps: 50 },
    { id: 'b-explorer', title: 'The Explorer', description: 'Use 5 different exercises in one session.', condition: 'bounty_unique_exercises', total: 5, rewardXP: 250, rewardScraps: 40 },
    { id: 'b-scholar', title: 'The Scholar', description: 'Use 8 different exercises in one session.', condition: 'bounty_unique_exercises', total: 8, rewardXP: 400, rewardScraps: 75 },
    { id: 'b-juggernaut', title: 'Juggernaut', description: 'Complete 15 sets in one session.', condition: 'bounty_sets_in_session', total: 15, rewardXP: 200, rewardScraps: 30 },
    { id: 'b-berserker', title: 'Berserker', description: 'Lift 15,000 lbs total volume in one session.', condition: 'bounty_volume_single_session', total: 15000, rewardXP: 400, rewardScraps: 75 },

    // More variety
    { id: 'b-warmup', title: 'Proper Warmup', description: 'Log 10 minutes of recovery work.', condition: 'bounty_recovery_minutes', total: 10, rewardXP: 150, rewardScraps: 20 },
    { id: 'b-endurance', title: 'Endurance Test', description: 'Log 45 minutes of cardio.', condition: 'bounty_cardio_minutes', total: 45, rewardXP: 350, rewardScraps: 60 },
    { id: 'b-variety', title: 'Variety Pack', description: 'Use 6 different exercises in one session.', condition: 'bounty_unique_exercises', total: 6, rewardXP: 300, rewardScraps: 50 },
    { id: 'b-titan', title: 'Titan Training', description: 'Lift 25,000 lbs in one session.', condition: 'bounty_volume_single_session', total: 25000, rewardXP: 600, rewardScraps: 125 },
    { id: 'b-nightowl', title: 'Night Owl', description: 'Log a workout after 8 PM.', condition: 'bounty_morning_workout', total: 1, rewardXP: 200, rewardScraps: 50 },
    { id: 'b-quickdraw', title: 'Quick Draw', description: 'Complete 10 sets in one session.', condition: 'bounty_sets_in_session', total: 10, rewardXP: 150, rewardScraps: 25 },
    { id: 'b-sprint', title: 'Sprint Session', description: 'Log 10 minutes of cardio at high effort.', condition: 'bounty_cardio_minutes', total: 10, rewardXP: 150, rewardScraps: 25 },
    { id: 'b-double-down', title: 'Double Down', description: 'Lift 7,500 lbs in one session.', condition: 'bounty_volume_single_session', total: 7500, rewardXP: 250, rewardScraps: 40 },
    { id: 'b-zen', title: 'Zen Master', description: 'Log 20 minutes of recovery work.', condition: 'bounty_recovery_minutes', total: 20, rewardXP: 250, rewardScraps: 35 },
    { id: 'b-allrounder', title: 'All-Rounder', description: 'Use 4 different exercises in one session.', condition: 'bounty_unique_exercises', total: 4, rewardXP: 200, rewardScraps: 30 },
]
```

**Step 2: Add `fetchActiveBounties()` function**

```typescript
export type Bounty = {
    id: string
    title: string
    description: string
    progress: number
    total: number
    rewardXP: number
    rewardScraps: number
    completed: boolean
}

export async function fetchActiveBounties(userId: string): Promise<Bounty[]> {
    const supabase = createClient()
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const bountySeed = seedHash(userId + dateStr + 'bounty')
    const selectedBounties = pickFromPool(BOUNTY_POOL, 2, bountySeed)

    // Fetch today's workout data for bounty progress
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const { data: todayWorkouts } = await supabase
        .from('workouts')
        .select(`
            id, total_volume, start_time,
            workout_sets (
                id, weight, reps, rpe, exercise_id,
                exercises (exercise_type, name)
            )
        `)
        .eq('user_id', userId)
        .gte('start_time', startOfDay.toISOString())

    // Compute condition values across all today's workouts
    let maxSessionVolume = 0
    let maxSessionSets = 0
    let totalCardioMinutes = 0
    let totalRecoveryMinutes = 0
    let hasHighRPECardio = false
    let hasMixedSession = false
    let hasMorningWorkout = false
    let maxUniqueExercises = 0

    for (const workout of (todayWorkouts || [])) {
        const sets = (workout.workout_sets || []) as any[]
        let sessionVolume = 0
        let sessionHasStrength = false
        let sessionHasCardio = false
        const exerciseNames = new Set<string>()

        for (const set of sets) {
            const exType = set.exercises?.exercise_type || 'Strength'
            exerciseNames.add(set.exercises?.name || '')

            if (exType === 'Strength') {
                sessionVolume += (Number(set.weight) || 0) * (Number(set.reps) || 0)
                sessionHasStrength = true
            } else if (exType === 'Recovery') {
                totalRecoveryMinutes += Number(set.reps) || 0
            } else {
                totalCardioMinutes += Number(set.reps) || 0
                sessionHasCardio = true
                if ((Number(set.rpe) || 0) >= 9) hasHighRPECardio = true
            }
        }

        maxSessionVolume = Math.max(maxSessionVolume, sessionVolume)
        maxSessionSets = Math.max(maxSessionSets, sets.length)
        maxUniqueExercises = Math.max(maxUniqueExercises, exerciseNames.size)

        if (sessionHasStrength && sessionHasCardio) hasMixedSession = true

        // Check workout time
        if (workout.start_time) {
            const hour = new Date(workout.start_time).getHours()
            if (hour < 8) hasMorningWorkout = true
        }
    }

    const conditionValues: Record<BountyCondition, number> = {
        bounty_volume_single_session: maxSessionVolume,
        bounty_sets_in_session: maxSessionSets,
        bounty_cardio_minutes: totalCardioMinutes,
        bounty_recovery_minutes: totalRecoveryMinutes,
        bounty_exercise_logged: 0,
        bounty_mixed_session: hasMixedSession ? 1 : 0,
        bounty_high_rpe_cardio: hasHighRPECardio ? 1 : 0,
        bounty_morning_workout: hasMorningWorkout ? 1 : 0,
        bounty_unique_exercises: maxUniqueExercises,
    }

    return selectedBounties.map(template => {
        const progress = Math.min(conditionValues[template.condition] || 0, template.total)
        return {
            id: template.id,
            title: template.title,
            description: template.description,
            progress,
            total: template.total,
            rewardXP: template.rewardXP,
            rewardScraps: template.rewardScraps,
            completed: progress >= template.total,
        }
    })
}
```

**Step 3: Verify build** — `npm run build`

**Step 4: Commit**
```
feat: add bounty system with 30 curated mini-quests
```

---

### Task 17: Create Adventurer's Guild UI component

**Files:**
- Create: `components/dashboard/adventurers-guild.tsx`
- Modify: `app/dashboard/page.tsx`

**Step 1: Create the component**

`components/dashboard/adventurers-guild.tsx` — a client component that:
- Fetches bounties via `fetchActiveBounties()`
- Shows a themed card with "Adventurer's Guild" header
- Displays 2 bounty cards with progress bars, XP + Scraps rewards
- Shows "CLAIMED" stamp on completed bounties
- Uses parchment/scroll aesthetic (warm brown tones)

**Step 2: Add to dashboard**

In `app/dashboard/page.tsx`, import and add `<AdventurersGuild />` after `<ActiveQuests />` in the right column.

**Step 3: Verify** — check dashboard shows bounties.

**Step 4: Commit**
```
feat: add Adventurer's Guild bounty board to dashboard
```

---

## Phase 5: Skill Trees

### Task 18: Create skill tree database tables and seed data

**Files:**
- Supabase migration (via MCP)
- New file: `supabase/skill_tree_schema.sql` (reference)

**Step 1: Apply migration for tables**

```sql
-- Skill tree node definitions (static)
CREATE TABLE public.skill_tree_nodes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name text NOT NULL,
  branch text NOT NULL,
  tier integer NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  effect_type text NOT NULL,
  effect_value numeric NOT NULL DEFAULT 0,
  effect_target text,
  icon text NOT NULL DEFAULT 'star',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User allocated skill points
CREATE TABLE public.user_skill_points (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  node_id uuid REFERENCES public.skill_tree_nodes ON DELETE CASCADE NOT NULL,
  allocated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, node_id)
);

ALTER TABLE public.skill_tree_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skill_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill nodes viewable by all" ON skill_tree_nodes FOR SELECT USING (true);
CREATE POLICY "Users can view own skill points" ON user_skill_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can allocate skill points" ON user_skill_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can deallocate skill points" ON user_skill_points FOR DELETE USING (auth.uid() = user_id);
```
Migration name: `create_skill_tree_tables`

**Step 2: Seed all 36 skill nodes (4 classes x 3 branches x 3 tiers)**

```sql
-- Tank: Fury branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Tank', 'Fury', 1, 'Titan Grip', '+5% XP on Deadlifts', 'xp_bonus_exercise', 0.05, 'Deadlift', 'grip-vertical'),
('Tank', 'Fury', 2, 'Berserker Rage', '+10% raid damage when workout has 15+ sets', 'raid_damage_conditional', 0.10, 'sets_15', 'flame'),
('Tank', 'Fury', 3, 'Earthquake', '+200 flat XP per workout with 3+ compound lifts', 'xp_bonus_conditional', 200, 'compounds_3', 'mountain');

-- Tank: Fortitude branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Tank', 'Fortitude', 1, 'Thick Skin', '+100 flat XP for 3-day streak', 'xp_streak_bonus', 100, 'streak_3', 'shield'),
('Tank', 'Fortitude', 2, 'Iron Will', 'Streak cap for Iron Scraps increases to 15', 'streak_cap_increase', 15, NULL, 'lock'),
('Tank', 'Fortitude', 3, 'Unbreakable', 'Streak tolerates 2-day gap', 'streak_gap_tolerance', 2, NULL, 'heart');

-- Tank: Discipline branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Tank', 'Discipline', 1, 'War Cry', '+10% party raid damage on days you log a workout', 'party_raid_bonus', 0.10, NULL, 'megaphone'),
('Tank', 'Discipline', 2, 'Anchor', '+5% XP on exercises over 200 lbs', 'xp_heavy_bonus', 0.05, 'weight_200', 'anchor'),
('Tank', 'Discipline', 3, 'Colossus', 'Equipment XP bonuses are doubled', 'equipment_bonus_multiplier', 2.0, NULL, 'crown');

-- Rogue: Swiftness branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Rogue', 'Swiftness', 1, 'Quick Feet', '+5% XP on cardio under 20 minutes', 'xp_bonus_conditional', 0.05, 'cardio_short', 'footprints'),
('Rogue', 'Swiftness', 2, 'Second Wind', '+15% XP on cardio at RPE 9+', 'xp_bonus_conditional', 0.15, 'cardio_rpe9', 'wind'),
('Rogue', 'Swiftness', 3, 'Phantom Sprint', 'Cardio deals +50% raid damage', 'raid_damage_type_bonus', 0.50, 'cardio', 'zap');

-- Rogue: Evasion branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Rogue', 'Evasion', 1, 'Shadow Step', '+100 flat XP for workouts before 7 AM', 'xp_time_bonus', 100, 'before_7am', 'moon'),
('Rogue', 'Evasion', 2, 'Dodge', '2-day streak gap tolerance', 'streak_gap_tolerance', 2, NULL, 'shield-off'),
('Rogue', 'Evasion', 3, 'Vanish', '+300 XP comeback bonus (stacks with 2x)', 'comeback_bonus', 300, NULL, 'eye-off');

-- Rogue: Precision branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Rogue', 'Precision', 1, 'Marked Target', '+10% XP on first-time exercises', 'xp_new_exercise_bonus', 0.10, NULL, 'target'),
('Rogue', 'Precision', 2, 'Critical Hit', 'PRs grant +50% bonus XP', 'pr_xp_bonus', 0.50, NULL, 'crosshair'),
('Rogue', 'Precision', 3, 'Assassinate', 'Equipment raid damage bonuses doubled', 'equipment_bonus_multiplier', 2.0, 'raid_damage', 'skull');

-- Paladin: Devotion branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Paladin', 'Devotion', 1, 'Holy Volume', '+5% XP when session has 20+ sets', 'xp_bonus_conditional', 0.05, 'sets_20', 'book-open'),
('Paladin', 'Devotion', 2, 'Blessed Reps', '+10% XP on sets with 10+ reps', 'xp_bonus_conditional', 0.10, 'reps_10', 'sparkles'),
('Paladin', 'Devotion', 3, 'Crusade', '+300 flat XP for 5+ different exercises', 'xp_bonus_conditional', 300, 'exercises_5', 'swords');

-- Paladin: Protection branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Paladin', 'Protection', 1, 'Divine Shield', '+100 flat XP for 3-day streak', 'xp_streak_bonus', 100, 'streak_3', 'shield'),
('Paladin', 'Protection', 2, 'Lay on Hands', 'Streak cap at 15 for Iron Scraps', 'streak_cap_increase', 15, NULL, 'hand'),
('Paladin', 'Protection', 3, 'Resurrection', 'Streak tolerates 2-day gap', 'streak_gap_tolerance', 2, NULL, 'refresh-ccw');

-- Paladin: Wrath branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Paladin', 'Wrath', 1, 'Smite', '+10% raid damage on 15+ set workouts', 'raid_damage_conditional', 0.10, 'sets_15', 'zap'),
('Paladin', 'Wrath', 2, 'Consecrate', 'Your damage also reduces Shield HP by 5%', 'shield_damage_bonus', 0.05, NULL, 'circle'),
('Paladin', 'Wrath', 3, 'Judgement', 'Party gets +5% raid damage when you log a workout', 'party_raid_bonus', 0.05, NULL, 'scale');

-- Wizard: Arcana branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Wizard', 'Arcana', 1, 'Mana Flow', '+5% XP on all recovery/mobility', 'xp_bonus_category', 0.05, 'Recovery', 'droplet'),
('Wizard', 'Arcana', 2, 'Arcane Mastery', '+15% XP on yoga sessions over 30 min', 'xp_bonus_conditional', 0.15, 'recovery_30min', 'sparkles'),
('Wizard', 'Arcana', 3, 'Transcendence', 'Recovery grants WIS at 1.5x rate', 'wis_multiplier', 1.5, NULL, 'sun');

-- Wizard: Enchantment branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Wizard', 'Enchantment', 1, 'Ward', '+100 flat XP for doing recovery + strength in one session', 'xp_bonus_conditional', 100, 'mixed_recovery_strength', 'shield-plus'),
('Wizard', 'Enchantment', 2, 'Enchant Weapon', 'Boss weakness effectiveness 200% -> 250%', 'weakness_amplifier', 2.5, NULL, 'wand'),
('Wizard', 'Enchantment', 3, 'Time Warp', 'Bounty rewards +25% XP and Scraps', 'bounty_bonus', 0.25, NULL, 'clock');

-- Wizard: Divination branch
INSERT INTO public.skill_tree_nodes (class_name, branch, tier, name, description, effect_type, effect_value, effect_target, icon) VALUES
('Wizard', 'Divination', 1, 'Foresight', '+10% XP on exercises not done in 7+ days', 'xp_stale_exercise_bonus', 0.10, 'days_7', 'eye'),
('Wizard', 'Divination', 2, 'Clarity', 'Streak cap at 15 for Iron Scraps', 'streak_cap_increase', 15, NULL, 'lightbulb'),
('Wizard', 'Divination', 3, 'Omniscience', 'Equipment XP bonuses doubled', 'equipment_bonus_multiplier', 2.0, NULL, 'brain');
```
Migration name: `seed_skill_tree_nodes`

**Step 3: Commit**
```
feat: create skill tree tables and seed all 36 nodes
```

---

### Task 19: Add skill tree data functions

**Files:**
- Modify: `lib/supabase/data-hooks.ts`

**Step 1: Add functions**

```typescript
/**
 * Calculates how many skill points a user has earned based on level.
 * 1 point at levels: 10, 15, 20, 25, 30, 35, 40, 45, 50, then every 10 after.
 */
export function getAvailableSkillPoints(level: number): number {
    const milestones = [10, 15, 20, 25, 30, 35, 40, 45, 50]
    let points = milestones.filter(m => level >= m).length
    if (level > 50) {
        points += Math.floor((level - 50) / 10)
    }
    return points
}

/**
 * Fetches skill tree nodes for a class and user's allocated points.
 */
export async function fetchSkillTree(userId: string, className: string) {
    const supabase = createClient()

    const [{ data: nodes }, { data: allocated }] = await Promise.all([
        supabase.from('skill_tree_nodes').select('*').eq('class_name', className).order('branch').order('tier'),
        supabase.from('user_skill_points').select('node_id').eq('user_id', userId),
    ])

    const allocatedIds = new Set((allocated || []).map(a => a.node_id))

    return {
        nodes: nodes || [],
        allocatedIds,
        totalAllocated: allocatedIds.size,
    }
}

/**
 * Allocates a skill point to a node (validates prerequisites).
 */
export async function allocateSkillPoint(userId: string, nodeId: string, className: string): Promise<{ success: boolean, error?: string }> {
    const supabase = createClient()

    // Fetch user level
    const { data: userData } = await supabase.from('users').select('level').eq('id', userId).single()
    if (!userData) return { success: false, error: 'User not found' }

    // Check available points
    const available = getAvailableSkillPoints(userData.level || 1)
    const { count: usedPoints } = await supabase
        .from('user_skill_points')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    if ((usedPoints || 0) >= available) return { success: false, error: 'No skill points available' }

    // Get the target node
    const { data: targetNode } = await supabase
        .from('skill_tree_nodes')
        .select('*')
        .eq('id', nodeId)
        .single()

    if (!targetNode) return { success: false, error: 'Node not found' }
    if (targetNode.class_name !== className) return { success: false, error: 'Wrong class' }

    // Check prerequisite: must have tier N-1 in same branch
    if (targetNode.tier > 1) {
        const { data: prereqNode } = await supabase
            .from('skill_tree_nodes')
            .select('id')
            .eq('class_name', className)
            .eq('branch', targetNode.branch)
            .eq('tier', targetNode.tier - 1)
            .single()

        if (prereqNode) {
            const { count: hasPrereq } = await supabase
                .from('user_skill_points')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('node_id', prereqNode.id)

            if (!hasPrereq || hasPrereq === 0) {
                return { success: false, error: 'Prerequisite not met — unlock the previous tier first' }
            }
        }
    }

    // Allocate
    const { error } = await supabase
        .from('user_skill_points')
        .insert({ user_id: userId, node_id: nodeId })

    if (error) return { success: false, error: 'Already allocated or error' }
    return { success: true }
}
```

**Step 2: Verify build** — `npm run build`

**Step 3: Commit**
```
feat: add skill tree data functions with prerequisite validation
```

---

### Task 20: Create Skill Tree page

**Files:**
- Create: `app/dashboard/skills/page.tsx`
- Modify: `components/dashboard/nav.tsx`

**Step 1: Create skill tree page**

`app/dashboard/skills/page.tsx` — client component that:
- Fetches user's class and skill tree via `fetchSkillTree()`
- Shows available/used skill points at top
- Displays 3 branch columns, each with 3 tier nodes connected by lines
- Allocated nodes glow with class color
- Unallocated nodes are dim
- Tap a node to see detail popover + "Allocate" button
- Locked nodes (prerequisite unmet) shown with lock icon
- Uses class-themed colors (red/emerald/blue/purple)

**Step 2: Add Skills to navigation**

In `components/dashboard/nav.tsx`, add:
```typescript
{ href: "/dashboard/skills", label: "Skills", icon: GitBranch },
```

Import `GitBranch` from lucide-react.

**Step 3: Verify** — navigate to /dashboard/skills

**Step 4: Regenerate types** — Supabase MCP `generate_typescript_types`.

**Step 5: Commit**
```
feat: create Skill Tree page with visual branch layout
```

---

## Phase 6: Achievements & Titles

### Task 21: Add prestige achievement columns and seed data

**Files:**
- Supabase migration (via MCP)

**Step 1: Add reward_title column to achievements and best_streak to users**

```sql
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS reward_title text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS best_streak integer DEFAULT 0;
```
Migration name: `add_achievement_titles_and_best_streak`

**Step 2: Seed prestige achievements**

```sql
INSERT INTO public.achievements (name, description, icon, category, condition_type, condition_value, reward_scraps, reward_title) VALUES
  ('The Iron Path',   'Lift 100,000 lbs lifetime',             'dumbbell',  'progression', 'str_volume_lifetime',   100000,   200,  NULL),
  ('The Unbreakable', 'Lift 1,000,000 lbs lifetime',           'trophy',    'progression', 'str_volume_lifetime',   1000000,  1000, 'The Unbreakable'),
  ('Swift Runner',    'Log 1,000 minutes of cardio lifetime',  'timer',     'progression', 'dex_minutes_lifetime',  1000,     200,  NULL),
  ('Windrunner',      'Log 10,000 minutes of cardio lifetime', 'wind',      'progression', 'dex_minutes_lifetime',  10000,    1000, 'Windrunner'),
  ('The Consistent',  'Complete 365 workouts',                 'calendar',  'workout',     'workout_count',         365,      1500, 'The Consistent'),
  ('Iron Willed',     'Achieve a 30-day workout streak',       'flame',     'workout',     'workout_streak_ever',   30,       500,  'Iron Willed'),
  ('Eternal Flame',   'Achieve a 100-day workout streak',      'flame',     'workout',     'workout_streak_ever',   100,      1000, 'Eternal Flame'),
  ('Wise One',        'Log 5,000 minutes of recovery work',    'brain',     'progression', 'wis_minutes_lifetime',  5000,     1000, 'The Wise'),
  ('Set Crusher',     'Complete 10,000 sets lifetime',         'layers',    'progression', 'con_sets_lifetime',     10000,    1000, 'Set Crusher'),
  ('Raid Slayer X',   'Help defeat 10 raid bosses',            'swords',    'raid',        'raid_defeated',         10,       750,  'Raid Slayer'),
  ('PR Legend',       'Set 100 personal records',              'trophy',    'workout',     'pr_count',              100,      750,  'PR Machine'),
  ('Centurion',       'Reach level 50',                        'crown',     'progression', 'level_reached',         50,       2000, 'Centurion');
```
Migration name: `seed_prestige_achievements`

**Step 3: Commit**
```
feat: add prestige achievements with title rewards
```

---

### Task 22: Update achievement checking for new condition types

**Files:**
- Modify: `lib/achievements.ts`
- Modify: `lib/supabase/data-hooks.ts` (best_streak update)

**Step 1: Add new condition types to `checkAndAwardAchievements()`**

In `lib/achievements.ts`, expand the `conditionValues` map (around line 84-94):

```typescript
// Fetch user stats including new fields
const { data: user } = await supabase
    .from('users')
    .select('level, class_name, iron_scraps, str_volume_lifetime, dex_minutes_lifetime, con_sets_lifetime, wis_minutes_lifetime, best_streak')
    .eq('id', userId)
    .single()

// Add new conditions to the map:
const conditionValues: Record<string, number> = {
    workout_count: workoutCount || 0,
    pr_count: prCount || 0,
    level_reached: user.level || 1,
    class_selected: user.class_name ? 1 : 0,
    party_joined: (partyCount || 0) > 0 ? 1 : 0,
    raid_defeated: raidDefeatedCount || 0,
    streak_days: streak,
    total_volume_single: sessionContext?.sessionVolume || 0,
    comeback_triggered: sessionContext?.isComebackQuest ? 1 : 0,
    // New prestige conditions
    str_volume_lifetime: user.str_volume_lifetime || 0,
    dex_minutes_lifetime: user.dex_minutes_lifetime || 0,
    wis_minutes_lifetime: user.wis_minutes_lifetime || 0,
    con_sets_lifetime: user.con_sets_lifetime || 0,
    workout_streak_ever: user.best_streak || 0,
}
```

**Step 2: Handle title rewards when awarding achievements**

After the achievement is awarded (around line 106), check for title:

```typescript
if (!error) {
    newlyEarned.push(achievement)

    // If achievement grants a title, add it as an equippable shop item
    if ((achievement as any).reward_title) {
        // Titles from achievements are auto-added — user can equip via profile
        // The title is stored in the achievement itself, no separate shop_items entry needed
        // User equips by setting equipped_title to the reward_title value
    }
}
```

Actually, since the existing `equipped_title` on users is just a text field, and titles from achievements are just text values, the user can equip them directly. We just need to make the achievements page show equippable titles.

**Step 3: Update `saveWorkoutSession()` to track `best_streak`**

In `lib/supabase/data-hooks.ts`, in the user update section (around line 725), add:

```typescript
const newBestStreak = Math.max(newStreak, currentUser.best_streak || 0)
```

And in the update object:
```typescript
best_streak: newBestStreak,
```

Also add `best_streak` to the select on line 682.

**Step 4: Verify build** — `npm run build`

**Step 5: Commit**
```
feat: add prestige condition types and title rewards to achievements
```

---

### Task 23: Update Achievements page with Prestige tab

**Files:**
- Modify: `app/dashboard/achievements/page.tsx`

**Step 1: Read the current achievements page to understand its structure**

**Step 2: Add "Prestige" tab/filter**

Add a Tabs component (or simple filter buttons) at the top:
- "All" — shows all achievements
- "Prestige" — shows only achievements where `reward_title` is not null

**Step 3: Show title badge on prestige achievements**

For achievements with `reward_title`, show a golden title badge:
```tsx
{achievement.reward_title && (
    <div className="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-1 inline-flex items-center gap-1">
        <Crown className="w-3 h-3 text-yellow-400" />
        <span className="text-xs font-bold text-yellow-400">Title: {achievement.reward_title}</span>
    </div>
)}
```

**Step 4: Add "Equip Title" button for earned prestige achievements**

For earned achievements with titles, show an equip button that calls `equipShopItem(userId, 'title', achievement.reward_title)`.

**Step 5: Regenerate types** — Supabase MCP `generate_typescript_types`.

**Step 6: Verify** — check achievements page shows prestige filter and title badges.

**Step 7: Commit**
```
feat: add Prestige tab and equippable titles to achievements page
```

---

## Phase 7: Final Integration & Polish

### Task 24: Update navigation with all new pages

**Files:**
- Modify: `components/dashboard/nav.tsx`

**Step 1:** Ensure nav includes all new routes. Final nav items should be:
```typescript
const navItems = [
    { href: "/dashboard", label: "Inn", icon: Home },
    { href: "/dashboard/workout", label: "Workout", icon: Dumbbell },
    { href: "/dashboard/inventory", label: "Gear", icon: Package },
    { href: "/dashboard/skills", label: "Skills", icon: GitBranch },
    { href: "/dashboard/shop", label: "Shop", icon: ShoppingBag },
    { href: "/dashboard/party", label: "Party", icon: Users },
]
```

Note: History and Achievements can be accessed from the dashboard or profile — keeping the bottom nav to 6 items max for mobile usability.

**Step 2: Commit**
```
feat: update navigation with Gear and Skills pages
```

---

### Task 25: Regenerate all TypeScript types and final build check

**Files:**
- Modify: `lib/supabase-types.ts`

**Step 1:** Use Supabase MCP `generate_typescript_types` to get the final types with all new tables and columns.

**Step 2:** Replace `lib/supabase-types.ts` content.

**Step 3:** Run `npm run build` — fix any type errors.

**Step 4: Commit**
```
chore: regenerate Supabase types for all new tables and columns
```

---

### Task 26: Final verification and commit

**Step 1:** Run `npm run build` to ensure clean build.

**Step 2:** Run `npm run dev` and manually verify:
- [ ] Wizard class appears in class selection
- [ ] WIS stat shows on profile
- [ ] Recovery exercises appear in exercise picker
- [ ] Raid boss shows shield bar and weakness badges
- [ ] Inventory page loads with equipment slots
- [ ] Shop has Equipment and Consumables tabs
- [ ] Adventurer's Guild shows bounties on dashboard
- [ ] Skill Tree page loads with visual branches
- [ ] Achievements page has Prestige filter
- [ ] Navigation includes Gear and Skills

**Step 3: Final commit**
```
feat: QuestLift Mega Expansion — Wizard, Raids, Loot, Bounties, Skills, Titles
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1. Wizard Class | 1-7 | New class, WIS stat, Recovery exercises, character art |
| 2. Deeper Raids | 8-10 | Shields, weaknesses, typed damage |
| 3. Loot & Equipment | 11-15 | Equipment tables, inventory, shop tabs, effects |
| 4. Bounties | 16-17 | 30 curated bounties, Adventurer's Guild UI |
| 5. Skill Trees | 18-20 | 36 skill nodes, skill tree page |
| 6. Achievements | 21-23 | Prestige achievements, titles |
| 7. Polish | 24-26 | Navigation, types, final build |

**Total Tasks:** 26
