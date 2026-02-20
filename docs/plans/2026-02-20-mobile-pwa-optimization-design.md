# Mobile PWA Optimization Design

## Overview

Fully optimize QuestLift for mobile PWA usage (saved to homescreen). Fix missing PWA meta tags, safe areas, navigation overflow, and touch targets.

## Changes

### 1. PWA Meta & Icons
- Viewport meta with `viewport-fit=cover`
- `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style` (black-translucent)
- Generate SVG placeholder icons (192x192, 512x512)
- `theme-color` meta tag matching slate-950

### 2. Safe Areas & Touch (globals.css)
- `env(safe-area-inset-*)` padding utilities
- `overscroll-behavior: none` on html/body
- Disable `-webkit-tap-highlight-color`
- Smooth scrolling, touch-action hints

### 3. Bottom Nav (5 items max)
- Keep: Inn, Workout, Trophies, Party, History
- Drop Library and Raid from bottom nav
- Raid accessible from Party page, Library from workout page

### 4. Compact Mobile Header
- Smaller title on mobile ("QuestLift" not "Inn / Dashboard")
- Tighter spacing for scraps/bell/settings row

### 5. Workout Logger Mobile Polish
- Min 44px touch targets
- Simplified mobile grid (weight/reps/RPE + check inline)
- Sticky bottom "Complete Workout" button

## Files to Modify
- `app/layout.tsx` — meta tags, viewport
- `app/globals.css` — safe areas, touch, overscroll
- `public/manifest.json` — verify icons
- `components/dashboard/nav.tsx` — 5 items
- `components/dashboard/header.tsx` — compact mobile
- `components/workout/logger.tsx` — touch targets, sticky button
