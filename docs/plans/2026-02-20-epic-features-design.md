# Epic Features Design: Streak, Level-Up, Battle Log, Shop

**Date:** 2026-02-20
**Status:** Approved

## Implementation Order

Streak -> Level-Up -> Battle Log -> Shop

---

## 1. Streak System

**DB changes:** Add `current_streak` (int, default 0) and `last_workout_date` (date, nullable) to `users` table.

**Logic (in saveWorkoutSession):**
- After saving workout, check `last_workout_date`
- If yesterday: increment `current_streak`
- If today: no change (already counted)
- If older or null: reset to 1
- Update `last_workout_date` to today

**UI:** Flame icon on user profile card with tier colors:
- 0 days: grey flame
- 1-2 days: orange flame
- 3-6 days: red flame
- 7-13 days: blue flame
- 14+ days: purple flame with glow

---

## 2. Level-Up Animation

**Logic:** `saveWorkoutSession` returns `oldLevel` alongside existing data. If `newLevel > oldLevel`, trigger modal.

**UI:** `LevelUpModal` component:
- Full-screen dark overlay
- Animated level number scaling up (Framer Motion)
- Gold particle sparkle effect
- Shows tier name at milestone levels (6, 10, 25, 50)
- Auto-dismiss after 3 seconds, tap to dismiss

---

## 3. Battle Log (Workout Recap)

**Trigger:** After workout save completes, show full-screen recap before returning to dashboard.

**Content:**
- RPG-style per-exercise lines: "{exercise} dealt {volume} DMG ({sets}x{reps} @ {weight}lbs)"
- PRs highlighted as "CRITICAL HIT!" in gold
- Summary: total damage, XP earned, streak update, iron scraps earned
- Typewriter animation for each line

**UI:** Full-screen overlay with dark RPG aesthetic, dismiss button at bottom.

---

## 4. Iron Scraps Shop

**DB changes:**
- New `shop_items` table: id, name, type (title/frame/badge), cost, rarity, description
- New `user_purchases` table: user_id, item_id, purchased_at
- Add `equipped_title` and `equipped_frame` to `users` table

**Seed items (~12):**
- Titles (50-500 scraps): "Iron Novice", "Gym Rat", "Beast Mode", "The Crusher", "Legend"
- Frames (200-1000 scraps): Bronze Border, Silver Border, Gold Border, Flame Border, Legendary Aura

**UI:** New `/dashboard/shop` page with:
- Balance display at top
- Grid of items with rarity colors (common/rare/epic/legendary)
- Buy button (disabled if insufficient scraps or already owned)
- Equip/unequip toggle for owned items

**Display:** Equipped title shows under display name, equipped frame wraps character art.
