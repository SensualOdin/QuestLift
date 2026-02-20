# QuestLift - The Gamified Fitness RPG

QuestLift turns your workouts into an RPG adventure. Log sets, earn XP, level up your character, join a party, and fight raid bosses together.

---

## How It Works

### The Core Loop

1. **Log a workout** - Add exercises, track weight/reps/RPE or cardio duration
2. **Earn XP** - Every set earns XP based on volume, intensity, and your class
3. **Level up** - XP accumulates and your character levels up automatically
4. **Deal raid damage** - Your lifts deal damage to the weekly raid boss
5. **Compete with your party** - Weekly roast reports call out the MVP and the slacker

---

## XP System

### Strength XP (per set)

```
Base XP = (weight x reps) / 100
```

Then multiplied by an **intensity bonus**:

| Condition | Multiplier |
|-----------|-----------|
| RPE 9-10 (or >85% of 1RM) | 1.2x |
| RPE 8 (or 70-85% of 1RM) | 1.1x |
| RPE 1-7 | 1.0x |

**Example:** Bench press 185 lbs x 8 reps at RPE 9
```
Base = (185 x 8) / 100 = 14.8 XP
With intensity = 14.8 x 1.2 = 17.76 XP
```

### Cardio XP (per set)

```
XP = duration_in_minutes x effort_multiplier
```

| RPE | Multiplier | Style |
|-----|-----------|-------|
| 9-10 | 5x | HIIT / Sprint |
| 8 | 4x | Moderate |
| 1-7 | 3x | Low intensity |

**Example:** 30 min run at RPE 8
```
XP = 30 x 4 = 120 XP
```

### Class Bonus

If the exercise matches your class specialty, you get **+15% XP** on that set.

### Consistency Bonuses (per session)

| Bonus | Condition | Reward |
|-------|-----------|--------|
| Comeback Quest | First workout after 7+ days off | **2x multiplier** on entire session |
| Daily Streak | Worked out yesterday too | +50 XP |
| Weekly Warrior | 4th workout this week | +200 XP |
| Monthly Warrior | 16th workout this month | +500 XP |

The Comeback Quest multiplier applies first (doubles the base), then flat bonuses are added on top.

---

## Leveling

XP is cumulative (lifetime total). The amount needed per level increases as you progress:

| Level Range | XP Per Level | Cumulative XP to Reach |
|-------------|-------------|----------------------|
| 1 - 5 | 500 | 0 - 2,500 |
| 6 - 15 | 1,500 | 2,500 - 17,500 |
| 16 - 30 | 5,000 | 17,500 - 92,500 |
| 31 - 50 | 15,000 | 92,500 - 392,500 |
| 51+ | 50,000 | 392,500+ |

**Examples:**
- Level 5 requires 2,500 total XP
- Level 10 requires 2,500 + (5 x 1,500) = 10,000 total XP
- Level 50 requires 392,500 total XP

---

## Classes

At **Level 6**, you choose a class. Each class grants a permanent **+15% XP bonus** on its specialty exercises.

### Tank
- **Specialty:** Strength exercises (Squat, Deadlift, Bench, OHP)
- **Stat:** STR
- *Immovable. Unstoppable.*

### Rogue
- **Specialty:** Cardio, HIIT, Jump Rope, Mobility
- **Stat:** DEX
- *First in, last out.*

### Paladin
- **Specialty:** High-volume strength/accessory work
- **Stat:** CON
- *Volume is virtue.*

---

## Attributes

Your character has three core attributes that grow from your training:

| Attribute | Tracks | Source |
|-----------|--------|--------|
| **STR** (Strength) | Lifetime volume in lbs | Sum of (weight x reps) across all strength sets |
| **DEX** (Dexterity) | Lifetime cardio minutes | Sum of all cardio durations |
| **CON** (Constitution) | Lifetime sets completed | Total number of completed sets |

These are displayed on your profile card and grow permanently.

---

## Quests

Active quests appear on your dashboard and track real progress:

### Daily Grind
- **Goal:** Log 1 workout today
- **Type:** Daily

### Weekly Warrior
- **Goal:** Complete 4 workouts this week (Mon-Sun)
- **Type:** Weekly

### Raid Quest
- **Goal:** Help your party defeat the current raid boss
- **Type:** Raid (only appears if you're in a party with an active raid)

---

## Party System

- Create a party or join one with a **join code**
- Max **5 members** per party
- The creator becomes the **party leader**
- Party members can see each other's levels, classes, and names

### Roast Reports

Generated weekly for each party:
- **MVP** - The member who earned the most XP that week
- **Slacker** - The member with the least activity
- **Summary** - Weekly party recap

---

## Raid Bosses

Weekly cooperative bosses that your whole party fights together.

### Damage Calculation

| Action | Damage |
|--------|--------|
| Lift weight | **1 lb = 1 DMG** (total volume) |
| Cardio at RPE 8+ | **50 DMG per minute** |

**Example raid contribution:**
```
Bench:  185 x 8 x 3 sets = 4,440 DMG
Squat:  225 x 5 x 5 sets = 5,625 DMG
30 min run at RPE 8      = 1,500 DMG
                    Total = 11,565 DMG
```

### Boss HP

Default boss HP: **250,000**

The raid boss has a timer (usually one week). If your party depletes the HP before the timer expires, the boss is **defeated**. If the timer runs out, the raid **fails**.

The raid screen shows:
- Boss HP bar with color-coded damage from each party member
- Individual damage contributions ranked by total
- Time remaining until enrage

---

## Currency

**Iron Scraps** - Earned from raids and achievements. Displayed on your profile and in the header. Reserved for future cosmetic/upgrade features.

---

## PR Tracking

When you log a set that beats your previous best weight for that exercise, it's automatically flagged as a **Personal Record (PR)**:
- Sets are highlighted in gold during the workout
- PR count appears on workout history cards
- Previous best is shown in the exercise header for reference

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Supabase (PostgreSQL + Auth + Row-Level Security)
- **State:** Zustand
- **Charts:** Recharts

## Getting Started

1. Clone the repo
2. `npm install`
3. Create a Supabase project and run the SQL schemas in order:
   - `supabase/schema.sql`
   - `supabase/party_schema.sql`
   - `supabase/raid_schema.sql`
4. Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
5. Seed the `exercises` table with your exercise library
6. `npm run dev`
