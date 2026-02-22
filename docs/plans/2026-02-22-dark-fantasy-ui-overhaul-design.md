# Dark Fantasy UI Overhaul - Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform QuestLift from a flat dark dashboard into an atmospheric Dark Fantasy RPG experience.

**Architecture:** Component-first approach — build shared RPG primitives (EmberBackground, GameCard, RPGHeading) then thread them through existing pages. All layouts and functionality stay intact; only visuals change.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Framer Motion, Google Fonts (Cinzel), CSS animations

---

## Direction: Dark Fantasy RPG

Think Diablo / Dark Souls — moody lighting, ember particles, stone/metal textures, dramatic glows. The app should feel like you're managing your character in a dimly-lit dungeon guild hall.

## 1. Atmosphere & Background

**Problem:** The entire dashboard sits on flat `slate-950`. No depth, no mood, no sense of place.

**Solution:**

- **Ember Particle Background** — A `<EmberBackground />` component rendered once in the dashboard layout. 20-30 small glowing dots (`bg-amber-500` / `bg-orange-400`) that slowly float upward and fade out, on a loop. Pure CSS `@keyframes` animations to keep it lightweight. Opacity kept low (~0.3-0.5) so it's atmospheric, not distracting. Particles are `position: fixed` so they persist across page navigation.

- **Ambient Gradient Overlay** — A subtle radial gradient anchored to the viewport center giving a vignette effect around edges and warmth in the center. Implemented as a fixed `div` with `bg-[radial-gradient(ellipse_at_center,_rgba(15,10,5,0)_0%,_rgba(2,6,23,0.8)_100%)]`.

- **Subtle Noise Texture** — A tiny repeating inline SVG noise pattern at ~3% opacity overlaid on the background, giving the flat dark surface a stone/dungeon-wall feel. Applied via CSS `background-image` on the layout wrapper.

## 2. Typography

**Problem:** Inter is clean but has zero RPG personality.

**Solution:**

- Load **Cinzel** from Google Fonts — a Roman/classical serif display face that reads as dark fantasy.
- Use ONLY for: page titles (h1), section headers (h2), key game labels (boss names, item names, "Level Up", "Battle Complete").
- Keep Inter for all body text, stats, inputs, buttons — readability matters for the functional UI.
- Add Cinzel via `next/font/google` in `app/layout.tsx` and expose as a CSS variable `--font-cinzel`.
- Apply via Tailwind class `font-cinzel` on targeted elements.

## 3. Card Styling — GameCard Component

**Problem:** Cards are `bg-slate-900/40 border-slate-800/60` — minimal contrast, no texture, no weight.

**Solution:** A `GameCard` wrapper component with variants:

- **Base styling:**
  - `bg-gradient-to-b from-slate-900/80 to-slate-950/90` (depth instead of flat color)
  - `shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]` (faint top-edge torchlight)
  - `border-slate-700/50` (slightly more visible border)

- **Variants:**
  - `default` — base styling
  - `amber` — gold/amber top border strip, for guild/reward cards
  - `epic` — purple glow border + subtle purple inner glow
  - `legendary` — gold glow border + animated shimmer effect
  - `danger` — red/crimson glow, for raid-related cards

- Props: `variant`, `className`, `children`

## 4. Color Palette Enrichment

**Problem:** Everything is indigo + slate. Functional but monotone.

**Enhancement:**

- **Gold/Amber** becomes the primary accent for currency, rewards, and achievement moments
- **Crimson** (`rose-600` / `red-700`) for combat, raids, and danger — deeper than current bright `red-400`
- **Deep Purple** (`purple-900` / `violet-800`) for magic, wisdom, rare/epic items
- **Indigo stays** as the "progress/action" color (XP bars, primary buttons, active nav)
- **Class colors unchanged:** Tank=red, Rogue=emerald, Paladin=blue, Wizard=purple

No new Tailwind config needed — these are adjustments to which existing Tailwind colors are used where.

## 5. Micro-Interactions

**Problem:** Key game moments (completing sets, opening loot, equipping gear) feel like clicking form buttons.

**Enhancements:**

1. **Set Completion Pulse** — When tapping the check on a set, a golden ring expands outward from the button (scales 1->2) and fades out. A single `motion.div` overlay, 300ms, then removed. Quick and satisfying.

2. **Loot Box Opening** — Replace `animate-pulse` reveal with: box shakes briefly (2-3 small x-axis oscillations via Framer Motion), then content card scales up from 0.8->1.0 with a flash of the rarity color behind it (a brief full-opacity glow that fades to the resting glow level).

3. **Equip Gear Feedback** — When equipping, the equipment slot card briefly flashes the rarity color glow (opacity 0->0.6->0.15 over 500ms), then settles to its equipped state.

4. **XP Number Bounce** — In the battle log summary, the XP number does a spring scale bounce (1.0->1.3->1.0) when it appears, drawing the eye to the reward.

## 6. Nav Update

**Problem:** Raid page is unreachable from the nav bar.

**Fix:**
- Add Raid to nav with `Swords` icon from lucide-react
- New order: Home, Workout, Gear, Skills, Shop, Raid, Party (7 items)
- On mobile: reduce horizontal padding slightly to fit 7 items (`px-2` instead of `px-3`, icon stays `w-6 h-6`)

## 7. Page-Specific Changes

### Dashboard (Inn)
- EmberBackground visible behind all content
- Page title "The Inn" in Cinzel
- UserProfile card: swap to GameCard with richer gradient, keep existing blur blobs
- ActiveQuests: swap cards to GameCard, quest type borders stay
- AdventurersGuild: already has amber gradient — enhance with GameCard `amber` variant
- RecentActivity: GameCard wrapper, section header in Cinzel

### Workout
- Section header "Forge" or keep "Workout" in Cinzel
- Exercise cards: GameCard wrapper
- Set completion: add golden pulse animation on check tap

### Inventory
- Page title in Cinzel
- Equipment slot cards: GameCard with equipped rarity glow
- Loot box: improved opening animation (shake + reveal)
- Equipment cards: GameCard with rarity variant matching

### Shop
- Page title in Cinzel
- Tab bar: keep current animated tab system
- Item cards: GameCard with rarity variant
- Buy button: keep yellow/amber styling

### Skills
- Page title in Cinzel
- Skill node cards: keep current styling (already game-like)

### Raid
- Now accessible from nav
- Boss name: keep existing gradient serif (already strong)
- Card: GameCard `danger` variant

### Party
- Page title in Cinzel
- PartyRoster: GameCard wrapper
- RoastReport: keep orange palette (already warm and distinct)

## 8. Files Impacted

| File | Change |
|---|---|
| `components/ui/ember-background.tsx` | NEW — CSS particle background component |
| `components/ui/game-card.tsx` | NEW — styled card wrapper with variants |
| `app/globals.css` | Noise texture, ambient gradient utilities, ember keyframes |
| `app/layout.tsx` | Add Cinzel font via next/font/google |
| `app/dashboard/layout.tsx` | Add EmberBackground + ambient overlay |
| `components/dashboard/nav.tsx` | Add Raid tab, reorder, adjust mobile spacing |
| `components/dashboard/header.tsx` | Cinzel for title text |
| `app/dashboard/page.tsx` | Cinzel headers |
| `components/dashboard/user-profile.tsx` | GameCard wrapper, richer styling |
| `components/dashboard/active-quests.tsx` | GameCard wrapper, Cinzel header |
| `components/dashboard/adventurers-guild.tsx` | GameCard amber variant, Cinzel header |
| `components/dashboard/recent-activity.tsx` | GameCard wrapper, Cinzel header |
| `app/dashboard/workout/page.tsx` | Cinzel header |
| `components/workout/logger.tsx` | Set completion pulse animation |
| `app/dashboard/inventory/page.tsx` | GameCard wrappers, loot box animation, Cinzel header |
| `app/dashboard/shop/page.tsx` | GameCard wrappers, Cinzel header |
| `app/dashboard/skills/page.tsx` | Cinzel header |
| `app/dashboard/raid/page.tsx` | Cinzel header |
| `components/social/raid-boss.tsx` | GameCard danger variant |
| `app/dashboard/party/page.tsx` | Cinzel header |

## 9. What Does NOT Change

- All page layouts and grid structures
- All functionality and data flows
- Shadcn/UI component library usage
- Class color system (Tank/Rogue/Paladin/Wizard)
- Existing animations (level-up modal, battle log, nav indicator)
- Mobile-first responsive approach
- Supabase data layer
