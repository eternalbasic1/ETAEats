# Onboarding Flow — Design Spec

**Date:** 2026-05-03  
**App:** `frontendApps/passenger`  
**Status:** Approved

---

## 1. Overview

A 4-slide horizontal pager shown to every unauthenticated user. The flow introduces ETA Eats, explains how it works, highlights ETA sync, and closes with a trust signal + account creation CTA. On completion the user lands on `/(auth)/signup` or `/(auth)/login` depending on which CTA they tap.

---

## 2. Routing Changes

### `app/index.tsx`
Change the unauthenticated redirect from `/(auth)/login` → `/(onboarding)/`.  
Authenticated users continue to fast-path to `/(tabs)/home` (unchanged).

### New files
```
app/(onboarding)/
├── _layout.tsx    ← Stack, headerShown: false, bg #F5F5F2
└── index.tsx      ← Pager screen + 4 slide components
```

No other routing files are modified.

---

## 3. Pager Architecture

**Component:** `FlatList` horizontal, `pagingEnabled: true`, `scrollEnabled: false`  
Each slide: `width = Dimensions.get('window').width`, full screen height.

**Shared chrome (not inside FlatList):**
- **Progress bar** — 4 equal-width segments at the top (below safe area). Active segment: `#0D0D0D`. Inactive: `#E8E8E2`. Width animates via `Animated.Value` on slide advance.
- **Bottom bar** — primary `Button` + optional secondary text link, pinned above `insets.bottom`. Button label and secondary link vary per slide (see § 5).

**State:** `currentIndex: number` (0–3), managed with `useState`. Advancing calls `flatListRef.current.scrollToIndex({ index })`.

---

## 4. Slide Components

Four local (non-exported) components inside `index.tsx`. All use `useTheme()` — no hardcoded hex values except the step-number circle colours (see § 5.2).

---

## 5. Per-Slide Specification

### 5.1 Slide 0 — Welcome

| Element | Detail |
|---|---|
| Illustration | Large emoji scene: 🚌 + 🏠 (text-based, no image assets needed) |
| Headline | `t.typography.h1` · "Order food before\nyour bus stops." |
| Body | `t.typography.body` · `t.colors.textTertiary` · "ETAEats lets bus travelers pre-order from restaurants assigned to their route. Food is ready when you arrive." |
| Feature pills | Row of 3 · background `t.colors.surfaceSunk` · `t.typography.bodySm` · "🚌 Highway food" · "✅ Verified restaurants" · "⚡ No waiting" |
| Primary CTA | `Button` label "Get Started" → advances to slide 1 |
| Secondary | Text link "I have an account" → `router.replace('/(auth)/login')` |

### 5.2 Slide 1 — How It Works

| Element | Detail |
|---|---|
| Label | `t.typography.label` · `t.colors.successFg` · "HOW IT WORKS" |
| Headline | `t.typography.h1` · "3 steps.\nThat's all." |
| Step rows (×3) | Coloured circle + number + bold title + body description |
| Step colours | 1 → orange `#E8703A` · 2 → blue `#4A90D9` · 3 → green `#2E5D38` |
| Step 1 | "Scan the QR in your bus" — "Every ETAEats bus has a QR code or a 6-digit code. Scan it to reveal the restaurant assigned to your route." |
| Step 2 | "Browse the menu & order" — "See what's available, pick your meal, pay in-app. That's it." |
| Step 3 | "Pick up at your stop" — "Your order is timed to your bus ETA. Walk off. Collect. Eat." |
| Bottom card | Background `t.colors.primary` (#0D0D0D) · rounded `t.radius.card` · QR icon + "Scan Bus QR or enter code" (white bold) + "One scan reveals your bus restaurant" (muted white) |
| Primary CTA | "Next →" → advances to slide 2 |

### 5.3 Slide 2 — Smart ETA Sync

| Element | Detail |
|---|---|
| Label | `t.typography.label` · `t.colors.accentPowderBlueInk` · "SMART ETA SYNC" |
| Headline | `t.typography.h1` · "Food ready exactly\nwhen you arrive." |
| Body | `t.typography.body` · `t.colors.textTertiary` · "We track your bus in real-time and alert the restaurant when to start cooking — so it's fresh, not cold." |
| Live Sync card | Background `#1A1A1A` · rounded · "LIVE SYNC" label (white, uppercase, small) |
| Card columns (×3) | 🚌 "12 min / Bus ETA" · 🍳 "10 min / Prep time" · ✅ "Stop / Ready at" |
| Route bar | Linear row: "Mumbai" — gradient bar with red live dot — "← Nashik Bus Stand" marker — "Pune" |
| Feature tags (×3) | Same pill style as Slide 0 · "🔴 Live GPS" · "⚡ Kitchen auto-alert" · "❄️ No cold food guarantee" |
| Primary CTA | "Next →" → advances to slide 3 |

### 5.4 Slide 3 — Trusted Food Only

| Element | Detail |
|---|---|
| Label | `t.typography.label` · `t.colors.successFg` · "TRUSTED FOOD ONLY" |
| Headline | `t.typography.h1` · "Only clean,\nverified dhabas." |
| Body | `t.typography.body` · `t.colors.textTertiary` · "Every restaurant is FSSAI-certified and reviewed by thousands of real highway travelers." |
| Restaurant rows (×3) | Grey square photo placeholder + name (bold) + cuisine subtitle + star rating (right) + green cert badge |
| Row 1 | "Shreeji Dhaba" · "North Indian · Thali" · ★ 4.7 · "FSSAI ✓" |
| Row 2 | "Highway Biryani" · "Biryani · Mughlai" · ★ 4.8 · "Hygiene A+" |
| Row 3 | "Café Pit Stop" · "Snacks · Coffee" · ★ 4.4 · "FSSAI ✓" |
| Row styling | `t.colors.surface` card bg · `t.colors.border` separator between rows |
| Primary CTA | "Create Account →" → `router.replace('/(auth)/signup')` |
| Secondary | "Already joined? **Sign in**" — "Sign in" in `t.colors.primary` bold → `router.replace('/(auth)/login')` |

---

## 6. Progress Bar Animation

```
Animated.timing(progressAnim, {
  toValue: (currentIndex + 1) / 4,
  duration: 250,
  useNativeDriver: false,
})
```

Each segment's active fill width interpolates from `progressAnim`. The 4 segments are evenly spaced with a small gap between them (4px).

---

## 7. Navigation Exit Points

| Action | Destination | Method |
|---|---|---|
| "I have an account" (slide 0) | `/(auth)/login` | `router.replace` |
| "Create Account →" (slide 3) | `/(auth)/signup` | `router.replace` |
| "Already joined? Sign in" (slide 3) | `/(auth)/login` | `router.replace` |

`router.replace` is used throughout so back-navigation never returns to onboarding.

---

## 8. Design Tokens Used

All values from `@eta/ui-tokens` theme except step-number circle colours (§ 5.2) which are one-off accent values not in the palette.

- Background: `t.colors.bg`
- Text: `t.colors.textPrimary`, `t.colors.textSecondary`, `t.colors.textTertiary`
- Cards: `t.colors.surface`, `t.colors.surfaceSunk`
- Borders: `t.colors.border`
- Primary button: `t.colors.primary`
- Label colours: `t.colors.successFg`, `t.colors.accentPowderBlueInk`
- Typography scale: `t.typography.*`
- Font: `t.fontFamily.sans` (Lora)
- Radius: `t.radius.card`
- Spacing: `t.spacing.*`

---

## 9. Files Touched

| File | Change |
|---|---|
| `app/index.tsx` | Unauthenticated redirect → `/(onboarding)/` |
| `app/(onboarding)/_layout.tsx` | New — Stack layout |
| `app/(onboarding)/index.tsx` | New — pager + 4 slide components |
