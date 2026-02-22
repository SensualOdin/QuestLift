# QuestLift Mega Expansion Design

**Date:** 2026-02-21
**Status:** Approved

## Overview

Six major feature additions to QuestLift, implemented in dependency order:

1. Wizard Class
2. Deeper Raid Boss Mechanics
3. Loot & Equipment System
4. Bounties / Adventurer's Guild
5. Skill Trees / Perks
6. Achievements & Titles

---

## 1. Wizard Class

### Identity
- **Name:** Wizard
- **Icon:** `Sparkles` (lucide-react)
- **Color:** Purple (`text-purple-400`, `bg-purple-400/10`)
- **Stat:** WIS (Wisdom) — lifetime recovery/flexibility minutes
- **Specialty:** +15% XP on Core, Yoga, Mobility, and Stretching exercises
- **Lore:** "Mind over matter. Balance in all things."

### Character Progression
- Wizard (Lvl 6) -> Arcane Wizard (Lvl 10) -> Mystic Wizard (Lvl 25) -> Legendary Wizard (Lvl 50)

### Database Changes
- Add `wis_minutes_lifetime` (int, default 0) to `users` table
- Add new exercises with `exercise_type: 'Recovery'` (Yoga Flow, Foam Rolling, Meditation Walk, Dynamic Stretching, Pilates, Breathwork, etc.)

### XP Engine Changes
- `determineClassSpecialty()` new case: Wizard matches `'Recovery'` and `'Mobility'`
- Recovery exercises use cardio XP formula (duration-based with effort multiplier)
- WIS minutes tracked in `saveWorkoutSession()` for Recovery-type exercises

### Raid Utility — Magic Damage
- Wizard workouts generate Magic Damage
- Recovery exercises at any RPE: `duration_minutes * 30 DMG`
- Magic Damage tagged via new `damage_type` column on `raid_damage`: `'physical'` | `'magic'` | `'cardio'`

---

## 2. Deeper Raid Boss Mechanics

### A. Boss Shields/Phases
New columns on `raids`:
- `shield_type` (text, nullable): `'swift'` | `'arcane'` | `'iron'` | null
- `shield_hp` (int, nullable): Shield HP to deplete first

Shield types:
- **Swift Shield:** Only DEX (cardio) damage breaks it
- **Arcane Shield:** Only Magic (wizard/recovery) damage breaks it
- **Iron Shield:** Only STR (strength volume) damage breaks it

Once shield depleted, all damage types hit boss HP normally.

### B. Class Weakness System
New columns on `raids`:
- `boss_weakness` (text, nullable): damage type that deals 200%
- `boss_resistance` (text, nullable): damage type that deals 50%

Types: `'physical'` | `'magic'` | `'cardio'`

### C. Raid Damage Changes
- Add `damage_type` column to `raid_damage`: `'physical'` | `'magic'` | `'cardio'`
- Shield damage tracked separately (doesn't count toward boss HP)
- New `raid_shield_damage` table or computed from tagged `raid_damage` entries

### D. UI Changes
- Shield bar above HP bar (when active)
- Weakness/resistance badges below boss name
- Damage type icons next to contributor names
- Shield-break celebration animation

---

## 3. Loot & Equipment System

### New Tables

**`equipment`:**
| Column | Type | Description |
|---|---|---|
| id | uuid | PK |
| name | text | e.g. "Heavy Iron Bracers" |
| description | text | Flavor text |
| slot | text | 'weapon' / 'armor' / 'accessory' / 'consumable' |
| rarity | text | common / rare / epic / legendary |
| effect_type | text | xp_bonus_exercise / xp_bonus_category / raid_damage_bonus / iron_scraps_bonus / xp_bonus_flat |
| effect_value | numeric | e.g. 0.05 for +5% |
| effect_target | text? | e.g. 'Bench Press' or 'Legs' or 'physical' |
| icon | text | Lucide icon name |
| cost | int? | Purchasable in shop (null = drop only) |

**`user_equipment`:**
| Column | Type | Description |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users |
| equipment_id | uuid | FK equipment |
| equipped_slot | text? | null = in inventory |
| obtained_at | timestamp | |
| source | text | raid_drop / shop / achievement / quest |

**`loot_boxes`:**
| Column | Type | Description |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users |
| source | text | raid / quest |
| opened | boolean | default false |
| created_at | timestamp | |

**`loot_box_contents`:**
| Column | Type | Description |
|---|---|---|
| loot_box_id | uuid | FK loot_boxes |
| equipment_id | uuid | FK equipment |

### Consumables
- Stored in `equipment` with `slot: 'consumable'`
- Examples: Pre-Workout Potion (+20% XP next session), Repair Kit (+500 Scraps), Raid Banner (+10% raid damage next workout)
- Used by setting a flag on user, consumed after effect triggers

### Equipment Effects Integration
- XP calculation functions check equipped gear for bonuses
- Raid damage calculation checks for raid_damage_bonus equipment
- Iron Scraps earned checks for iron_scraps_bonus equipment

### UI
- New `/dashboard/inventory` page with 3 gear slots + inventory grid + loot boxes
- Shop gets tabs: Cosmetics | Equipment | Consumables
- Loot box opening animation (card flip with rarity glow)

---

## 4. Bounties / Adventurer's Guild

### Data Model
- New `BOUNTY_POOL` constant (~30 curated bounties)
- 2 bounties rotate daily using `seedHash(userId + dateStr + 'bounty')`
- Separate seed from daily quests

### New Bounty Condition Types
- `bounty_distance_cardio`: Total cardio minutes in session
- `bounty_volume_single_session`: Total volume in one workout
- `bounty_exercise_specific`: Log a specific exercise
- `bounty_sets_in_session`: Complete N sets in one session
- `bounty_recovery_minutes`: Log N minutes of recovery work
- `bounty_time_of_day`: Log workout before/after a certain hour

### Bounty Pool (representative sample)

**Strength:**
- "Lift the Boulder" — 10,000 lbs in one session (300 XP + 50 Scraps)
- "Iron Grip" — 5 sets of Deadlift (200 XP + 30 Scraps)
- "The Forge" — 20 sets of strength today (250 XP + 40 Scraps)

**Cardio:**
- "The Goblin Tunnels" — 30 min cardio (300 XP + 50 Scraps)
- "Wind Sprint" — Cardio at RPE 9+ (250 XP + 40 Scraps)
- "Marathon Runner" — 60 min cardio (400 XP + 75 Scraps)

**Recovery/Wizard:**
- "Meditate" — 15 min recovery (200 XP + 30 Scraps)
- "Inner Peace" — 30 min yoga/stretching (300 XP + 50 Scraps)
- "The Healing Springs" — 3 different recovery exercises (250 XP + 40 Scraps)

**Mixed/Challenge:**
- "Full Spectrum" — Both strength and cardio in one session (350 XP + 60 Scraps)
- "The Gauntlet" — 25 sets in one session (400 XP + 75 Scraps)
- "Dawn Patrol" — Workout before 8 AM (200 XP + 50 Scraps)

(Plus ~18 more)

### UI
- "Adventurer's Guild" section on dashboard below active quests
- Parchment/scroll aesthetic
- Progress bars, XP + Scraps rewards
- "CLAIMED" stamp on completion

---

## 5. Skill Trees / Perks

### Core Mechanic
- 1 Skill Point earned at levels: 10, 15, 20, 25, 30, 35, 40, 45, 50 (9 total by 50)
- 1 additional point per 10 levels after 50
- Each class: 3 branches x 3 tiers = 9 perks
- Must invest tier 1 before tier 2 in same branch

### New Tables

**`skill_tree_nodes` (static seed data):**
| Column | Type |
|---|---|
| id | uuid |
| class_name | text |
| branch | text |
| tier | int (1-3) |
| name | text |
| description | text |
| effect_type | text |
| effect_value | numeric |
| effect_target | text? |
| icon | text |

**`user_skill_points`:**
| Column | Type |
|---|---|
| user_id | uuid |
| node_id | uuid |
| allocated_at | timestamp |

### Tank Tree

**Fury (Offense):**
1. Titan Grip — +5% XP on Deadlifts
2. Berserker Rage — +10% raid damage when workout has 15+ sets
3. Earthquake — +200 flat XP per workout with 3+ compound lifts

**Fortitude (Consistency):**
1. Thick Skin — +100 flat XP for 3-day streak
2. Iron Will — Streak cap for Scraps increases to 15
3. Unbreakable — Streak tolerates 2-day gap

**Discipline (Utility):**
1. War Cry — +10% party raid damage when you log a workout
2. Anchor — +5% XP on all exercises over 200 lbs
3. Colossus — Equipment XP bonuses doubled

### Rogue Tree

**Swiftness (Cardio):**
1. Quick Feet — +5% XP on cardio under 20 minutes
2. Second Wind — +15% XP on cardio at RPE 9+
3. Phantom Sprint — Cardio +50% raid damage

**Evasion (Consistency):**
1. Shadow Step — +100 flat XP for workouts before 7 AM
2. Dodge — 2-day streak gap tolerance
3. Vanish — +300 XP comeback bonus (stacks with 2x)

**Precision (Utility):**
1. Marked Target — +10% XP on first-time exercises
2. Critical Hit — PRs grant +50% bonus XP
3. Assassinate — Equipment raid damage bonuses doubled

### Paladin Tree

**Devotion (Volume):**
1. Holy Volume — +5% XP when 20+ sets in session
2. Blessed Reps — +10% XP on sets with 10+ reps
3. Crusade — +300 flat XP for 5+ different exercises

**Protection (Consistency):**
1. Divine Shield — +100 flat XP for 3-day streak
2. Lay on Hands — Streak cap at 15 for Scraps
3. Resurrection — 2-day streak gap tolerance

**Wrath (Raid Utility):**
1. Smite — +10% raid damage on 15+ set workouts
2. Consecrate — Your damage also reduces Shield HP by 5%
3. Judgement — Party gets +5% raid damage when you log a workout

### Wizard Tree

**Arcana (Recovery):**
1. Mana Flow — +5% XP on all recovery/mobility
2. Arcane Mastery — +15% XP on yoga sessions over 30 min
3. Transcendence — Recovery exercises grant WIS at 1.5x rate

**Enchantment (Buffs):**
1. Ward — +100 flat XP for doing recovery + strength in one session
2. Enchant Weapon — Boss weakness effectiveness 200% -> 250%
3. Time Warp — Bounty rewards +25% XP and Scraps

**Divination (Utility):**
1. Foresight — +10% XP on exercises not done in 7+ days
2. Clarity — Streak cap at 15 for Scraps
3. Omniscience — Equipment XP bonuses doubled

### UI: `/dashboard/skills`
- Visual tree with 3 branch columns
- Connected nodes with prerequisite lines
- Allocated = glowing, unallocated = dim
- Point counter at top
- Tap node for details + allocate button
- Class-themed colors

---

## 6. Achievements & Titles

### Database Changes
- Add `reward_title` (text, nullable) to `achievements` table
- Add `best_streak` (int, default 0) to `users` table

### New Condition Types
- `str_volume_lifetime`, `dex_minutes_lifetime`, `wis_minutes_lifetime`, `con_sets_lifetime`
- `workout_streak_ever` (checks `best_streak` column)

### Prestige Achievements

| Achievement | Condition | Threshold | Title | Scraps |
|---|---|---|---|---|
| The Iron Path | str_volume_lifetime | 100,000 | - | 200 |
| The Unbreakable | str_volume_lifetime | 1,000,000 | "The Unbreakable" | 1,000 |
| Swift Runner | dex_minutes_lifetime | 1,000 | - | 200 |
| Windrunner | dex_minutes_lifetime | 10,000 | "Windrunner" | 1,000 |
| The Consistent | workout_count | 365 | "The Consistent" | 1,500 |
| Iron Willed | workout_streak_ever | 30 | "Iron Willed" | 500 |
| Eternal Flame | workout_streak_ever | 100 | "Eternal Flame" | 1,000 |
| Wise One | wis_minutes_lifetime | 5,000 | "The Wise" | 1,000 |
| Set Crusher | con_sets_lifetime | 10,000 | "Set Crusher" | 1,000 |
| Raid Slayer | raid_defeated | 10 | "Raid Slayer" | 750 |
| PR Machine | pr_count | 100 | "PR Machine" | 750 |
| Centurion | level_reached | 50 | "Centurion" | 2,000 |

### Changes to Achievement System
- `checkAndAwardAchievements()` gets new condition types in values map
- Achievements with `reward_title` auto-add title to equippable titles
- `best_streak` updated during workout save: `max(current_streak, best_streak)`

### UI
- Achievements page gets "Prestige" filter/tab
- Title achievements show golden badge
- Legendary glow on earned prestige achievements

---

## Implementation Order

1. **Wizard Class** (foundation: new stat, exercises, class selection)
2. **Deeper Raids** (builds on Wizard's magic damage type)
3. **Loot & Equipment** (new tables, gear slots, loot from raids)
4. **Bounties** (Adventurer's Guild with curated quest pool)
5. **Skill Trees** (4 unique trees, milestone unlocks)
6. **Achievements & Titles** (extend existing system with prestige titles)
