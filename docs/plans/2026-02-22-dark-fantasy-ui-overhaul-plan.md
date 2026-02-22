# Dark Fantasy UI Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform QuestLift from a flat dark dashboard into an atmospheric Dark Fantasy RPG experience with ember particles, Cinzel serif headers, richer card styling, and satisfying micro-interactions.

**Architecture:** Component-first approach — build shared RPG primitives (EmberBackground, GameCard) then thread them through existing pages. All layouts and functionality stay intact; only visuals change.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Framer Motion, Google Fonts (Cinzel), CSS @keyframes

---

### Task 1: Add Cinzel Font

**Files:**
- Modify: `app/layout.tsx`

**Context:** The app uses `next/font/google` to load Inter. We need to add Cinzel as a second font and expose it via a CSS variable so pages can use `font-cinzel` class.

**Step 1: Update `app/layout.tsx` to import Cinzel and apply both font variables**

Replace the entire file content:

```tsx
import type { Metadata, Viewport } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-cinzel" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: "QuestLift",
  description: "The Gamified Fitness RPG",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuestLift",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.variable} ${cinzel.variable} font-sans bg-slate-950 text-slate-50 antialiased min-h-screen overscroll-none`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Add `font-cinzel` utility to `app/globals.css`**

Add this inside the `@theme inline { ... }` block (after `--font-mono`):

```css
--font-cinzel: var(--font-cinzel);
```

And add after the `@theme inline` block:

```css
@utility font-cinzel {
  font-family: var(--font-cinzel), serif;
}
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: add Cinzel fantasy font for RPG headers"
```

---

### Task 2: Create EmberBackground Component + Ambient Atmosphere

**Files:**
- Create: `components/ui/ember-background.tsx`
- Modify: `app/globals.css` (add ember keyframes + noise texture)
- Modify: `app/dashboard/layout.tsx` (add EmberBackground to layout)

**Context:** The dashboard sits on flat `slate-950`. We need floating ember particles and a subtle ambient gradient to create dungeon atmosphere. The EmberBackground is a client component with CSS-animated particles (no JS animation loop for performance).

**Step 1: Add CSS keyframes and noise texture to `app/globals.css`**

Add at the END of the file (after the number input styles):

```css
/* --- Dark Fantasy Atmosphere --- */

@keyframes ember-float {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) translateX(30px) scale(0.3);
    opacity: 0;
  }
}

@keyframes ember-float-alt {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  15% {
    opacity: 0.8;
  }
  85% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-100vh) translateX(-20px) scale(0.5);
    opacity: 0;
  }
}

@keyframes ember-glow {
  0%, 100% { box-shadow: 0 0 4px 1px rgba(251, 146, 60, 0.4); }
  50% { box-shadow: 0 0 8px 2px rgba(251, 146, 60, 0.7); }
}
```

**Step 2: Create `components/ui/ember-background.tsx`**

```tsx
"use client"

export function EmberBackground() {
    // Generate deterministic particle configs
    const particles = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${(i * 4.3 + 7) % 100}%`,
        size: i % 3 === 0 ? 3 : 2,
        delay: `${(i * 1.7) % 12}s`,
        duration: `${8 + (i % 5) * 2}s`,
        alt: i % 2 === 0,
        color: i % 4 === 0 ? 'bg-orange-400' : i % 4 === 1 ? 'bg-amber-500' : i % 4 === 2 ? 'bg-yellow-500' : 'bg-red-400',
    }))

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Ambient vignette gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(2,6,23,0.4)_50%,_rgba(2,6,23,0.8)_100%)]" />

            {/* Subtle warm underglow at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-amber-950/10 to-transparent" />

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '256px 256px',
            }} />

            {/* Ember particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className={`absolute rounded-full ${p.color}`}
                    style={{
                        left: p.left,
                        bottom: '-8px',
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animation: `${p.alt ? 'ember-float-alt' : 'ember-float'} ${p.duration} ${p.delay} infinite ease-out, ember-glow 3s ${p.delay} infinite ease-in-out`,
                        opacity: 0,
                    }}
                />
            ))}
        </div>
    )
}
```

**Step 3: Add EmberBackground to dashboard layout**

Modify `app/dashboard/layout.tsx`. The file currently has this JSX return:

```tsx
return (
    <div className="w-full relative z-10 flex flex-col min-h-screen">
```

Replace the return with:

```tsx
return (
    <>
        <EmberBackground />
        <div className="w-full relative z-10 flex flex-col min-h-screen">
```

And add the closing `</>` by changing the final `</div>` to `</div></>`.

Add the import at the top of the file:

```tsx
import { EmberBackground } from "@/components/ui/ember-background"
```

Note: The dashboard layout is a Server Component. Since `EmberBackground` is a client component with `"use client"`, it can be imported into a Server Component — Next.js handles this correctly.

**Step 4: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add components/ui/ember-background.tsx app/globals.css app/dashboard/layout.tsx
git commit -m "feat: add ember particle background and dungeon atmosphere"
```

---

### Task 3: Create GameCard Component

**Files:**
- Create: `components/ui/game-card.tsx`

**Context:** A styled card wrapper that replaces the flat `bg-slate-900/40 border-slate-800/60` cards with Dark Fantasy RPG styling. Supports variants for different contexts. Uses Shadcn's Card under the hood.

**Step 1: Create `components/ui/game-card.tsx`**

```tsx
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const variantStyles = {
    default: "border-slate-700/50 bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
    amber: "border-amber-900/50 bg-gradient-to-br from-slate-900/80 to-amber-950/20 shadow-[inset_0_1px_0_rgba(251,191,36,0.08)]",
    danger: "border-red-900/50 bg-gradient-to-b from-slate-900/80 to-red-950/15 shadow-[inset_0_1px_0_rgba(239,68,68,0.06)]",
    epic: "border-purple-800/40 bg-gradient-to-b from-slate-900/80 to-purple-950/15 shadow-[inset_0_1px_0_rgba(168,85,247,0.06),_0_0_12px_rgba(168,85,247,0.1)]",
    legendary: "border-yellow-700/40 bg-gradient-to-b from-slate-900/80 to-yellow-950/10 shadow-[inset_0_1px_0_rgba(234,179,8,0.08),_0_0_16px_rgba(234,179,8,0.12)]",
}

interface GameCardProps {
    variant?: keyof typeof variantStyles
    className?: string
    children: React.ReactNode
    withTopAccent?: boolean
}

export function GameCard({ variant = "default", className, children, withTopAccent = false }: GameCardProps) {
    return (
        <Card className={cn(
            "relative overflow-hidden backdrop-blur-xl",
            variantStyles[variant],
            className
        )}>
            {withTopAccent && (
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            )}
            {children}
        </Card>
    )
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add components/ui/game-card.tsx
git commit -m "feat: add GameCard component with dark fantasy variants"
```

---

### Task 4: Apply Cinzel Font + GameCard to Dashboard Page Components

**Files:**
- Modify: `components/dashboard/header.tsx` (Cinzel title)
- Modify: `components/dashboard/active-quests.tsx` (GameCard + Cinzel header)
- Modify: `components/dashboard/adventurers-guild.tsx` (GameCard amber + Cinzel)
- Modify: `components/dashboard/recent-activity.tsx` (GameCard + Cinzel header)
- Modify: `components/dashboard/user-profile.tsx` (GameCard + enriched styling)

**Context:** The dashboard (Inn) page is the hub. Every card component needs the GameCard wrapper and Cinzel font on section headers. The user-profile card gets enhanced gradient blobs. The adventurers-guild already has amber tones — use the `amber` variant.

**Step 1: Update `components/dashboard/header.tsx`**

Change line 73-76 (the h1 element):

```tsx
<h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white truncate">
    <span className="sm:hidden">QuestLift</span>
    <span className="hidden sm:inline">Inn / <span className="text-indigo-400">Dashboard</span></span>
</h1>
```

Replace with:

```tsx
<h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white truncate font-cinzel">
    <span className="sm:hidden">QuestLift</span>
    <span className="hidden sm:inline">The Inn</span>
</h1>
```

**Step 2: Update `components/dashboard/active-quests.tsx`**

Import GameCard at the top:

```tsx
import { GameCard } from "@/components/ui/game-card"
```

Replace all instances of:
```tsx
<Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl
```
with:
```tsx
<GameCard withTopAccent
```

(There are 3 Card usages — the loading state, empty state, and the main card. Replace all 3.)

For CardTitle on line 64, line 80, line 94-95, add `font-cinzel` class:

```tsx
<CardTitle className="text-lg font-semibold flex items-center gap-2 font-cinzel">
```

Change the closing `</Card>` tags to `</GameCard>`.

**Step 3: Update `components/dashboard/adventurers-guild.tsx`**

Import GameCard:

```tsx
import { GameCard } from "@/components/ui/game-card"
```

Replace the outer Card (lines 36 and 52):
```tsx
<Card className="border-amber-900/40 bg-gradient-to-br from-slate-900/80 to-amber-950/20 backdrop-blur-xl">
```
with:
```tsx
<GameCard variant="amber" withTopAccent>
```

Change closing `</Card>` to `</GameCard>`.

For the CardTitle "Adventurer's Guild" (lines 39 and 56), add `font-cinzel`:
```tsx
<CardTitle className="text-lg font-semibold flex items-center gap-2 font-cinzel">
```

**Step 4: Update `components/dashboard/recent-activity.tsx`**

Import GameCard:

```tsx
import { GameCard } from "@/components/ui/game-card"
```

Replace all 3 outer `<Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">` with `<GameCard withTopAccent>`.
Change closing `</Card>` to `</GameCard>`.

Add `font-cinzel` to all CardTitle instances:
```tsx
<CardTitle className="text-lg font-semibold flex items-center gap-2 font-cinzel">
```

**Step 5: Update `components/dashboard/user-profile.tsx`**

On line 159, update the Card to use richer gradient:

```tsx
<Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl overflow-hidden relative shadow-2xl">
```

Replace with:

```tsx
<Card className="border-slate-700/60 bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-2xl overflow-hidden relative shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
```

On line 161, change the indigo glow blob to a warmer amber:

```tsx
<div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
```

Replace with:

```tsx
<div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
```

Add `font-cinzel` to the character name on line 185:

```tsx
<CardTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight font-cinzel">{user.display_name}</CardTitle>
```

Add `font-cinzel` to the "Core Attributes" section header on line 227:

```tsx
<h4 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-3 px-1 font-cinzel">Core Attributes</h4>
```

**Step 6: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add components/dashboard/header.tsx components/dashboard/active-quests.tsx components/dashboard/adventurers-guild.tsx components/dashboard/recent-activity.tsx components/dashboard/user-profile.tsx
git commit -m "feat: apply dark fantasy styling to dashboard components"
```

---

### Task 5: Apply Cinzel Font to All Remaining Pages

**Files:**
- Modify: `app/dashboard/inventory/page.tsx`
- Modify: `app/dashboard/shop/page.tsx`
- Modify: `app/dashboard/skills/page.tsx`
- Modify: `app/dashboard/party/page.tsx`
- Modify: `app/dashboard/raid/page.tsx`
- Modify: `app/dashboard/achievements/page.tsx`

**Context:** Every page has an `h1` title and `h2` section headers. Add `font-cinzel` to each. This is purely additive — just adding a CSS class.

**Step 1: `app/dashboard/inventory/page.tsx`**

Line 102-104 (the h1):
```tsx
<h1 className="text-2xl font-bold text-white flex items-center gap-2">
    <Package className="w-6 h-6 text-indigo-400" /> Inventory
</h1>
```

Add `font-cinzel`:
```tsx
<h1 className="text-2xl font-bold text-white flex items-center gap-2 font-cinzel">
    <Package className="w-6 h-6 text-amber-400" /> Inventory
</h1>
```

Also change the icon color from `text-indigo-400` to `text-amber-400` for warmer RPG feel.

All section h2 elements (lines 124, 157, 176) — add `font-cinzel`:
```tsx
<h2 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-1 font-cinzel">
```

**Step 2: `app/dashboard/shop/page.tsx`**

Find the h1 (it will contain "Shop" text). Add `font-cinzel` class to it.
Change the shop icon color from `text-indigo-400` to `text-amber-400`.

**Step 3: `app/dashboard/skills/page.tsx`**

Find the h1 (it will contain "Skill Tree" text). Add `font-cinzel` class to it.

**Step 4: `app/dashboard/party/page.tsx`**

Find the h1 (it will contain "Party" text). Add `font-cinzel` class to it.

**Step 5: `app/dashboard/raid/page.tsx`**

This page wraps the `RaidBoss` component. If there's an h1, add `font-cinzel`. The boss name in `components/social/raid-boss.tsx` already uses `font-serif` — change to `font-cinzel` for consistency.

**Step 6: `app/dashboard/achievements/page.tsx`**

Find the h1. Add `font-cinzel` class.

**Step 7: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 8: Commit**

```bash
git add app/dashboard/inventory/page.tsx app/dashboard/shop/page.tsx app/dashboard/skills/page.tsx app/dashboard/party/page.tsx app/dashboard/raid/page.tsx app/dashboard/achievements/page.tsx components/social/raid-boss.tsx
git commit -m "feat: apply Cinzel font to all page headers"
```

---

### Task 6: Add Raid to Nav

**Files:**
- Modify: `components/dashboard/nav.tsx`

**Context:** The Raid page (`/dashboard/raid`) exists but isn't in the navigation. Add it with a `Swords` icon. Adjust mobile spacing to fit 7 items.

**Step 1: Update nav items and imports**

Change the import line:
```tsx
import { Home, Dumbbell, Users, ShoppingBag, Package, GitBranch } from "lucide-react"
```
to:
```tsx
import { Home, Dumbbell, Users, ShoppingBag, Package, GitBranch, Swords } from "lucide-react"
```

Update the navItems array:
```tsx
const navItems = [
    { href: "/dashboard", label: "Inn", icon: Home },
    { href: "/dashboard/workout", label: "Workout", icon: Dumbbell },
    { href: "/dashboard/inventory", label: "Gear", icon: Package },
    { href: "/dashboard/skills", label: "Skills", icon: GitBranch },
    { href: "/dashboard/shop", label: "Shop", icon: ShoppingBag },
    { href: "/dashboard/raid", label: "Raid", icon: Swords },
    { href: "/dashboard/party", label: "Party", icon: Users },
]
```

**Step 2: Adjust mobile spacing for 7 items**

Change the Link className `min-w-[56px]` to `min-w-[44px]` and `px-3` to `px-1.5`:

```tsx
className={`relative flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 sm:py-4 px-1.5 sm:px-4 py-2 min-w-[44px] transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 active:text-slate-300'}`}
```

Change icon size on mobile from `w-6 h-6` to `w-5 h-5`:

```tsx
<Icon className="w-5 h-5 sm:w-4 sm:h-4" />
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/dashboard/nav.tsx
git commit -m "feat: add Raid tab to navigation"
```

---

### Task 7: Set Completion Pulse Animation

**Files:**
- Modify: `components/workout/logger.tsx`
- Modify: `app/globals.css` (add pulse ring keyframe)

**Context:** When a user taps the check button to complete a set, a golden ring should expand outward from the button and fade. This is a CSS animation triggered by adding a temporary element. We'll use a state array to track which sets are "pulsing" and render a positioned overlay.

**Step 1: Add CSS keyframe to `app/globals.css`**

Add after the ember keyframes:

```css
@keyframes set-complete-pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}
```

**Step 2: Add pulse state and modify the toggle function in `components/workout/logger.tsx`**

Add a state near the top of the WorkoutLogger component (after other `useState` calls):

```tsx
const [pulsingSetIds, setPulsingSetIds] = useState<Set<string>>(new Set())
```

Find the `toggleSetComplete` function (line ~291). After the existing logic that toggles `completed`, add pulse tracking. Wrap the existing call site (line ~592) — change the Button's `onClick`:

From:
```tsx
onClick={() => toggleSetComplete(activeEx.id, set.id, activeEx.exerciseDef.exercise_type!)}
```
To:
```tsx
onClick={() => {
    toggleSetComplete(activeEx.id, set.id, activeEx.exerciseDef.exercise_type!)
    if (!set.completed) {
        setPulsingSetIds(prev => new Set(prev).add(set.id))
        setTimeout(() => setPulsingSetIds(prev => { const next = new Set(prev); next.delete(set.id); return next }), 500)
    }
}}
```

**Step 3: Add the pulse ring element inside the Button**

Change line 592-594 from:

```tsx
<Button variant={set.completed ? "default" : "secondary"} size="icon" onClick={() => toggleSetComplete(activeEx.id, set.id, activeEx.exerciseDef.exercise_type!)} className={`h-11 w-11 shrink-0 ${set.completed ? 'bg-indigo-500 text-white active:bg-indigo-600' : 'bg-slate-800 text-slate-400 active:bg-indigo-500 active:text-white'}`}>
    <Check className="w-5 h-5" />
</Button>
```

To:

```tsx
<Button variant={set.completed ? "default" : "secondary"} size="icon" onClick={() => {
    toggleSetComplete(activeEx.id, set.id, activeEx.exerciseDef.exercise_type!)
    if (!set.completed) {
        setPulsingSetIds(prev => new Set(prev).add(set.id))
        setTimeout(() => setPulsingSetIds(prev => { const next = new Set(prev); next.delete(set.id); return next }), 500)
    }
}} className={`h-11 w-11 shrink-0 relative overflow-visible ${set.completed ? 'bg-indigo-500 text-white active:bg-indigo-600' : 'bg-slate-800 text-slate-400 active:bg-indigo-500 active:text-white'}`}>
    <Check className="w-5 h-5" />
    {pulsingSetIds.has(set.id) && (
        <span className="absolute inset-0 rounded-md border-2 border-amber-400" style={{ animation: 'set-complete-pulse 0.5s ease-out forwards' }} />
    )}
</Button>
```

**Step 4: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add components/workout/logger.tsx app/globals.css
git commit -m "feat: add golden pulse animation on set completion"
```

---

### Task 8: Improved Loot Box Opening Animation

**Files:**
- Modify: `app/dashboard/inventory/page.tsx`

**Context:** The current loot box reveal is a static `animate-pulse` card. Replace it with a Framer Motion animation: the reveal card scales up from 0.8 with a rarity-colored glow flash behind it. Also add a shake to the loot box button before the reveal.

**Step 1: Add Framer Motion import**

Add at the top of the file:
```tsx
import { motion, AnimatePresence } from "framer-motion"
```

**Step 2: Add opening animation state**

Add state after `openedItem`:
```tsx
const [openingBoxId, setOpeningBoxId] = useState<string | null>(null)
```

**Step 3: Update `handleOpenLootBox` to include shake delay**

Replace the existing `handleOpenLootBox` function:

```tsx
const handleOpenLootBox = async (lb: LootBox) => {
    if (!user || openingBoxId) return
    setOpeningBoxId(lb.id)
    // Short delay for the shake animation to play
    await new Promise(r => setTimeout(r, 600))
    const gear = await openLootBox(user.id, lb.id)
    setOpeningBoxId(null)
    if (gear) {
        setOpenedItem(gear)
        setLootBoxes(prev => prev.map(b => b.id === lb.id ? { ...b, opened: true } : b))
        const eq = await fetchUserEquipment(user.id)
        setItems(eq as unknown as UserEquipment[])
        await refreshProfile()
        setTimeout(() => setOpenedItem(null), 4000)
    }
}
```

**Step 4: Replace the loot reveal section**

Replace lines 114-120 (the `animate-pulse` reveal):

```tsx
{openedItem && (
    <div className={`rounded-xl border p-4 text-center animate-pulse ${RARITY_CONFIG[openedItem.rarity]?.border || 'border-slate-700'} ${RARITY_CONFIG[openedItem.rarity]?.bg || ''}`}>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">You received</p>
        <p className={`text-lg font-bold ${RARITY_CONFIG[openedItem.rarity]?.color || 'text-white'}`}>{openedItem.name}</p>
        <p className="text-xs text-slate-400 mt-1">{openedItem.description}</p>
    </div>
)}
```

With:

```tsx
<AnimatePresence>
    {openedItem && (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`relative rounded-xl border p-4 text-center overflow-hidden ${RARITY_CONFIG[openedItem.rarity]?.border || 'border-slate-700'} ${RARITY_CONFIG[openedItem.rarity]?.bg || ''}`}
        >
            {/* Rarity glow flash */}
            <motion.div
                initial={{ opacity: 0.8, scale: 1.2 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.8 }}
                className={`absolute inset-0 rounded-xl blur-xl ${
                    openedItem.rarity === 'legendary' ? 'bg-yellow-500/30' :
                    openedItem.rarity === 'epic' ? 'bg-purple-500/30' :
                    openedItem.rarity === 'rare' ? 'bg-blue-500/30' : 'bg-slate-500/20'
                }`}
            />
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 relative z-10 font-cinzel">You received</p>
            <p className={`text-lg font-bold relative z-10 font-cinzel ${RARITY_CONFIG[openedItem.rarity]?.color || 'text-white'}`}>{openedItem.name}</p>
            <p className="text-xs text-slate-400 mt-1 relative z-10">{openedItem.description}</p>
        </motion.div>
    )}
</AnimatePresence>
```

**Step 5: Add shake animation to loot box buttons**

In the loot box rendering (around line 159-170), wrap the loot box card with a motion.div that shakes when `openingBoxId` matches:

Replace the Card for each loot box:
```tsx
<Card key={lb.id} className="border-yellow-500/30 bg-yellow-400/5">
```

With:
```tsx
<motion.div
    key={lb.id}
    animate={openingBoxId === lb.id ? { x: [0, -4, 4, -4, 4, -2, 2, 0] } : {}}
    transition={{ duration: 0.5 }}
>
<Card className="border-yellow-500/30 bg-yellow-400/5">
```

And add `</motion.div>` after the closing `</Card>` for each loot box.

**Step 6: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add app/dashboard/inventory/page.tsx
git commit -m "feat: add loot box shake and spring reveal animation"
```

---

### Task 9: Final Build Verification + Push

**Files:** None new

**Step 1: Clean build**

```bash
rm -rf .next && npm run build 2>&1 | tail -20
```

Expected: Build succeeds with all pages listed.

**Step 2: Test locally (optional)**

```bash
npm run dev
```

Check `/dashboard` in browser — you should see:
- Ember particles floating upward in the background
- Cinzel font on all page titles and section headers
- Richer card styling with gradients and inner glow
- Warm amber tones on guild and reward elements

**Step 3: Commit any remaining changes**

```bash
git status
```

If any unstaged changes remain, stage and commit them.

**Step 4: Push to Vercel**

```bash
git push origin main
```

Expected: Push succeeds, Vercel deploys automatically.
