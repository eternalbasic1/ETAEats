# Soft Luxury Operating System
ETAEats Passenger — Design System Specification

> "Apple for highway travel food."
> Calm. Editorial. Quietly premium. Never loud.

This document is the source of truth for how ETAEats looks, moves, and feels.
Tokens live in `src/design-system/*` and `src/app/globals.css`. Tailwind theme
maps the same tokens at `tailwind.config.ts`.

---

## 1. Design language at a glance

| Pillar | Translation in the UI |
|---|---|
| Premium minimalism | Generous whitespace, restrained type, a single primary CTA per screen. |
| Soft luxury | Warmed off-white background (`#F5F5F2`), 28px card radius, fine hairline borders. |
| Editorial typography | Satoshi, tight letter-spacing on display sizes, oversized titles paired with calm body copy. |
| Calm modern consumer | One black CTA, never gradients, never rainbow status colors. |
| Atmospheric accents | Powder Blue / Soft Cream / Peach / Muted Mint used as *backgrounds* — never as text colors on white. |
| Apple-meets-Airbnb | Pill nav, bottom-sheet auth, soft springs, rounded corners, monochrome iconography. |

What this system **is not**:
- Not loud startup gradients
- Not dark fintech
- Not generic SaaS
- Not foodtech-orange or "appetite-red"

---

## 2. Color system

### Core surfaces

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#F5F5F2` | Page background. Warm off-white. |
| `surface` | `#FFFFFF` | Default card surface. |
| `surface2` (`elevated`) | `#FAFAF8` | Subtly elevated / hover state. |
| `sunk` | `#F0F0EC` | Recessed surface (summary panels). |

### Borders

| Token | Hex |
|---|---|
| `border-subtle` | `#EFEFEA` (hairline within tinted surfaces) |
| `border` | `#E8E8E2` (default card outline) |
| `border-strong` | `#D9D9D1` (focus/emphasis) |

### Text hierarchy

| Token | Hex | Use for |
|---|---|---|
| `text-primary` | `#111111` | Headlines, prices, key values |
| `text-secondary` | `#3E3E3A` | Body copy |
| `text-tertiary` | `#6F6F6A` | Supporting labels, descriptions |
| `text-muted` | `#8C8C84` | Meta, hints, timestamps |
| `text-disabled` | `#A9A9A2` | Disabled UI |
| `text-on-dark` | `#FAFAF8` | Text on the black CTA |

### Gray scale (warmed)

`50 #FCFCFA · 100 #F5F5F2 · 150 #FAFAF8 · 200 #EFEFEA · 300 #E8E8E2 · 400 #D9D9D1 · 500 #B8B8B0 · 600 #8C8C84 · 700 #6F6F6A · 800 #3E3E3A · 900 #111111`

No cool grays. Every step is biased ~2° warm so the palette never feels clinical.

### Accent palette — atmosphere only

| Accent | Hex | Use as | Don't use as |
|---|---|---|---|
| Powder Blue `#DDEAF3` | "Live / Assigned / Information" backgrounds. Active stepper rail. Live order banner on Home. Map / location chips. Pickup pickup-from card on Checkout. | Body copy, primary CTAs, full-page backgrounds. |
| Soft Cream `#FFF7E8` | "Promotional / Recommended / Warmth" — featured cards, desktop tip card on the rail, dish thumbnails (food bg). Empty cart tone. | Status (success/error). |
| Peach `#FFD7C2` | "Ready / Arrival / Warm alert" — Order ready banner, time-sensitive cards, "your food is ready" surfaces, no-restaurant empty state. | Long body text backgrounds. |
| Muted Mint `#EAF4EA` | "Confirmed / Done / Healthy" — picked-up state, "all done" celebration, success badges on order history. | Warning/error states. |
| Black CTA `#0D0D0D` | The single primary action button per screen. Bottom nav active pill. Stepper. | Backgrounds, more than one CTA at a time. |

### Semantic states (tuned-down)

| State | Bg | Fg | Border |
|---|---|---|---|
| Success | `#EAF4EA` | `#2E5D38` | `#CFE2CF` |
| Warning | `#FFF4EB` | `#8A5634` | `#F2DBC6` |
| Error | `#FCEFEF` | `#8A3B3B` | `#EED4D4` |
| Info | `#DDEAF3` | `#3A5568` | `#C7D6E2` |
| Neutral | `#F0F0EC` | `#6F6F6A` | `#E8E8E2` |

> Rule: semantic colors are **muted dialed-down hues**, never browser-default red/green/blue.

---

## 3. Typography

Stack: `Satoshi → General Sans → Neue Montreal → Inter → system sans`. Loaded
via Fontshare CDN in `app/layout.tsx`.

| Role | Size / line | Weight | Tracking | When to use |
|---|---|---|---|---|
| Display XL | 56 / 60 | 600 | -0.035em | Marketing / hero (rare) |
| Display L | 44 / 50 | 600 | -0.03em | Editorial home heading on desktop |
| H1 | 32 / 38 | 600 | -0.022em | Page titles, hero text |
| H2 | 24 / 30 | 600 | -0.018em | Section heads, totals |
| H3 | 20 / 26 | 600 | -0.012em | Card titles, "Active order" |
| H4 | 17 / 24 | 600 | -0.008em | List item titles, restaurant name in cards |
| Body Lg | 17 / 26 | 450 | -0.003em | Marketing-style body |
| Body | 15 / 22 | 450 | 0 | Default copy |
| Body Sm | 13 / 20 | 450 | 0.002em | Meta, descriptions, hints |
| Caption | 12 / 16 | 500 | 0.005em | Timestamps, secondary meta |
| Label | 11 / 14 | 600 | 0.1em | UPPERCASE eyebrows: "Active order", "Step 1", "History" |
| Button | 15 / 20 | 600 | -0.005em | All buttons (sm = 13) |

Hierarchy rule: **eyebrow-label → big editorial title → calm description → action**.
This is the rhythm on Home, Login, Scan, Profile, OTP — and it's not optional.

---

## 4. Radius system

| Token | px | Used for |
|---|---|---|
| `xs` | 6 | tiny inline tags |
| `sm` | 10 | inputs, small buttons |
| `md` | 14 | menu rows, list tiles |
| `lg` | 18 | standard buttons |
| `xl` | 22 | large cards |
| `card` | 28 | **signature card radius** (Home recent orders, menu group, profile cards, checkout sections) |
| `hero` | 32 | bottom sheets, profile avatar tile, modals |
| `pill` | 999 | chips, status pills, bottom nav, search bar, primary stepper |

> Soft-luxury rule: never go below 10px on tappable surfaces, never above 32px on cards.

---

## 5. Shadows / Elevation

Apple-level restraint. Color is `rgba(17, 17, 17, …)` — no color tints.

| Token | Shadow | When |
|---|---|---|
| `e1` | `0 1px 2px rgba(17,17,17,0.04), 0 0 0 0.5px rgba(17,17,17,0.02)` | Default card lift on white |
| `e2` | `0 6px 18px rgba(17,17,17,0.05), 0 1px 2px rgba(17,17,17,0.03)` | Hover, prominent cards |
| `e3` | `0 12px 28px rgba(17,17,17,0.07), 0 2px 4px rgba(17,17,17,0.04)` | Hover-lift on interactive cards |
| `cta` | `0 10px 28px rgba(13,13,13,0.18), 0 2px 6px rgba(13,13,13,0.10)` | Floating primary CTA |
| `nav` | `0 10px 28px rgba(17,17,17,0.10), 0 2px 8px rgba(17,17,17,0.04)` | Floating bottom nav pill |
| `modal` | `0 24px 60px rgba(17,17,17,0.14), 0 6px 16px rgba(17,17,17,0.06)` | Bottom sheets, modals |

Hover lift recipe = `translateY(-2px)` + `e1 → e3`. Active = `scale(0.985)`.

---

## 6. Spacing

8pt base, with 4pt micro steps. Tokens: `4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96`.

How they apply:

| Layer | Default |
|---|---|
| Edge inset (mobile) | `px-4` (16px) |
| Edge inset (desktop) | `px-10` rail + `px-0` content |
| Card inset | `p-5` (20) for compact, `p-6` (24) for prominent |
| Gap between cards | `gap-3` (12) for list, `gap-4` (16) for sections |
| Section gap | `mt-8` (32) on mobile, `mt-10` (40) on desktop |
| Button height | sm=36, md=44, lg=52, xl=56 |

**Breathing rule**: if a screen feels "tight," add an 8pt step *before* removing content.

---

## 7. Component system

### Buttons (`@/components/ui/Button`)

| Variant | Use |
|---|---|
| `primary` | The single dark CTA per screen. Black `#0D0D0D` with `cta` shadow. |
| `secondary` | Soft white-on-bg surface — companion to primary (e.g. "Enter QR Code" on Home). |
| `outline` | Quieter than secondary, no background. |
| `ghost` | Text-only utility. |
| `soft` | Powder-blue contextual action, e.g. inline accept. |
| `danger` / `success` | Destructive / confirmatory inverse-light variants. |

Sizes: `sm/md/lg/xl` map to `36 / 44 / 52 / 56` heights. Loading shows a tonal spinner *and* keeps label visible at lower opacity — never an empty button.

### Cards (`@/components/ui/Card`)

Tones: `default | elevated | powder | peach | mint | sunk`. Padding: `none / sm / md / lg`. Radius: `md / lg / xl / card / hero`. Set `interactive` to get the hover-lift recipe.

> Rule: max two tinted cards per screen. The rest stay white. Atmosphere is a guest, not the host.

### Badges (`@/components/ui/Badge`)

Pill, uppercase 11/14, tracking `0.04em`. Variants per accent: `powder | cream | peach | mint | success | warning | error | info | neutral`. Use **softer accent variants** for live order states and **semantic variants** only for true success/error.

### Inputs (`@/components/ui/Input`)

Single-row pill-rounded — `lg` radius, soft border, focus tightens to `border-strong`. Supports `label` (uppercase Label token), `leading` / `trailing`, `error` and `hint`.

OTP cells (`@/components/cart/OTPInput`) use `13` (52) tall cells with 11–12 wide on mobile, evenly distributed via `justify-between`.

### Stepper (`@/components/ui/Stepper`)

Black pill with white −/+ icons. Used in cart & menu rows. Disabled at min/max with 40% opacity. `sm` and `md` sizes.

### Chip (`@/components/ui/Chip`)

Filter chip. Inactive = white with hairline border, active = black pill.

### IconButton / FAB

`tone="ghost"` for inline back/close. `tone="surface"` for floating affordances. Lift on hover.

### Bottom nav

Floating pill at `bottom-4` on mobile (`<lg`), backdrop-blurred, shadow `nav`, active item flips to black pill. Hidden on desktop — replaced with `DesktopRail`.

### Desktop rail

Fixed left rail at `lg+`, 288px wide, brand mark at top, primary nav stack in the middle, contextual tip card in soft-cream at the bottom.

### Top bar

A reusable `TopBar` with optional `title`, `subtitle`, `onBack`, `right` — used on every secondary screen for a uniform feel. `transparent` mode lets it sit over hero content.

### Cart bar

Floating, fully rounded `card`-radius bar. Two-line label (caption uppercase + "View cart · ₹X"). Tucked above the bottom nav on mobile, above content on desktop.

### Checkout summary

Two stacked cards: powder-blue "Pickup from / Your bus" up top, white order itemization below. Total in `H2`, currency tabular-nums.

### Status stepper

Vertical timeline with hairline rail, animated active dot ringed with powder blue, tinted active row in powder blue, muted upcoming rows. Timestamps right-aligned in tabular caption.

---

## 8. Motion

Tokens in `src/design-system/motion.ts`. CSS variables in `globals.css`.

- **Duration**: `fast 140ms · base 220ms · slow 320ms`.
- **Ease**: `standard cubic-bezier(.22,.61,.36,1) · enter cubic-bezier(.16,1,.3,1) · exit cubic-bezier(.7,0,.84,0)`.
- **Page enter**: `slux-fade-in` class — `opacity 0→1` + `translateY(6px → 0)` over 320ms enter ease.
- **Card hover**: `translateY(-2px)` + `e1 → e3`, 220ms standard.
- **Button active**: `scale(0.985)`, no overshoot.
- **Bottom sheet / cart bar**: spring `stiffness 260–280, damping 30–32`. Never bouncy.
- **Active stepper dot**: `scale 1 → 1.08 → 1`, 1.8s `easeInOut`, infinite.
- **Loading**: thin gray ring (`Spinner`) on white surfaces; tonal spinner inside primary CTAs.

Motion is *atmospheric*, not performative. If a user notices the animation, it's wrong.

---

## 9. App shell (responsive)

Defined in `globals.css` + `components/layout/AppShell.tsx`.

| Breakpoint | Behaviour |
|---|---|
| Mobile (<768px) | Single column max-width `28rem`, floating bottom nav pill at bottom-4. |
| Tablet (≥768px) | Column widens to `36rem`, still mobile nav. |
| Desktop (≥1024px) | Left rail (`288px`), content max-width `64rem` with `px-10`, no bottom nav. Hero text scales to Display L. |

Auth + landing routes (`/`, `/auth/*`) bypass nav entirely (`AppShell` renders `<main>` only).

---

## 10. Per-screen application

### 1 · Home (`/home`)
- **Hero**: editorial. Eyebrow "Good to see you, {firstName}", H1/Display L title with the word "arrives." in powder-blue ink, calm description. Two stacked CTAs: black `Scan Bus QR` + secondary `Enter 6-digit code`.
- **Live order card**: powder-blue card, label "Active order", H3 restaurant name, neutral pill status with dot, right-aligned arrow CTA.
- **Desktop feature row** (≥lg): three white cards with mint/cream/peach icon tiles ("Route-aware menus" / "Ready on arrival" / "Skip the queue").
- **Recent orders**: SectionHeader with eyebrow "History", grid 1 col mobile / 2 cols desktop, white cards, status pill in soft accent.

### 2 · QR Scan (`/scan`)
- TopBar back. Eyebrow "Step 1", H2/H1 title.
- Two cards: "Open camera scanner" (powder-blue icon tile) + "Enter 6-digit code" form. OTP-style cells use full-width distribution. Single primary CTA.

### 3 · Scan loading (`/scan/[token]`)
- Centered powder-blue rounded square with utensils icon, gentle scale-pulse. Label/H2/spinner.

### 4 · Menu (`/menu/[id]`)
- Sticky stack: TopBar with restaurant name + hygiene badge → pill search → category chips.
- Powder-blue context band: "Assigned to your bus · {bus.name}".
- Category groups inside one big white card; rows separated by `border-subtle` only — no card-on-card noise.
- Item row: 64–80px soft-cream thumbnail, H4 name, body-sm description, ₹ in H4, prep time in caption. Add = black pill or stepper.

### 5 · Product detail
The current build uses an inline detail row (no separate page). When a discrete page is needed, follow Menu Card layout: thumbnail hero (soft-cream), H1 name, description in body-sm, prep-time chip, sticky black CTA at bottom.

### 6 · Cart (`/cart`)
- TopBar "Your cart · {n} items".
- Item list inside a single white card with hairline dividers. Stepper + ghost trash icon.
- Sunk summary card with subtotal / delivery / total; total in H2.
- Sticky floating CTA "Place order · ₹X".

### 7 · Checkout (`/checkout`)
- TopBar "Review & pay".
- **Powder-blue card** = pickup from / your bus. Two icon tiles (white-translucent) for restaurant + bus.
- White card = itemized order, total in H2, tabular nums.
- Caption row with shield icon explaining payment trust.
- Sticky floating CTA "Pay ₹X securely".

### 8 · Live order tracking (`/order/[id]`)
- TopBar with restaurant name + connection badge (`Live` mint, `Reconnecting…` cream, `Offline` neutral).
- **READY** state shows a peach card "Your food is ready".
- White card with `StatusStepper` — see Component System above.
- White card with itemized order + total.

### 9 · Order history (`/orders`)
- TopBar "Order history". Grid 1/2 cols. Each card shows H4 name, caption meta, body-sm items list, ₹ in H4. Soft accent badges by state.

### 10 · Profile (`/profile`)
- TopBar.
- Powder-blue identity card with primary-black avatar tile, label/H2 name + body-sm phone.
- White divided rows: phone / email / security.
- Soft-cream tip card.
- Secondary `Sign out` button.

### 11 · Login (`/auth/login`) — bonus
- Desktop: split layout. Left = soft-cream editorial panel with brand and ETAEats positioning copy. Right = white card form. Mobile: brand mark above white card.

### 12 · OTP (`/auth/otp`)
- White card with brand mark, eyebrow "Verify", H1 "Enter OTP", evenly-spaced 6-cell input, primary CTA, ghost "Resend" + "Change number" links.

---

## 11. Token system (engineering handoff)

All tokens live under `src/design-system/`:

```
colors.ts    → core surfaces, text, gray, accents, accent-ink, semantic
typography.ts → font stack, display + heading + body + utility scales
spacing.ts    → 8pt scale
radius.ts     → xs / sm / md / lg / xl / card / hero / pill
shadow.ts     → e1–e3, cta, nav, modal, inset
motion.ts     → duration, easing, spring presets, page + hover recipes
index.ts      → re-export
```

CSS variables are the runtime source of truth (`globals.css`). Tailwind theme
in `tailwind.config.ts` re-exposes everything as utilities — `bg-surface`,
`text-text-primary`, `rounded-card`, `shadow-cta`, `text-h1`, etc.

### Tailwind theme highlights

```ts
colors: {
  bg, surface, surface2, sunk, primary, 'primary-hover', 'primary-soft',
  accent: { 'powder-blue', 'soft-cream', peach, 'muted-mint' },
  'accent-ink': { 'powder-blue', 'soft-cream', peach, 'muted-mint' },
  gray: { 50…900 },
  border, 'border-subtle', 'border-strong',
  'text-primary', 'text-secondary', 'text-tertiary', 'text-muted', 'text-disabled', 'text-on-dark',
  success, 'success-bg', 'success-border', warning, error, info (× -bg / -border),
}
fontSize:    { 'display-xl', 'display-l', h1, h2, h3, h4, 'body-lg', body, 'body-sm', caption, label, button }
borderRadius:{ xs, sm, md, lg, xl, card, hero, pill }
boxShadow:   { e1, e2, e3, cta, nav, modal }
transitionTimingFunction: { standard, enter, exit }
transitionDuration:       { fast, base, slow }
```

Usage:

```tsx
<div className="bg-surface rounded-card shadow-e1 border border-border p-6">
  <p className="text-label text-text-muted">Active order</p>
  <h3 className="mt-2 text-h3 text-text-primary">Highway Tiffin Co.</h3>
</div>
```

---

## 12. Brand rules

1. **Black is sacred.** One primary action per screen. Never two black buttons stacked.
2. **No saturated colors.** Every accent is a tint, every semantic color is desaturated. Avoid pure red, pure blue, pure green.
3. **No harsh shadows.** Drop opacity stays under 0.18. Never use `box-shadow` with hex colors that aren't `#111` or `#0D0D0D`.
4. **Avoid visual clutter.** Max two tinted cards per screen. Max three CTAs in view.
5. **Preserve breathing room.** A scroll position should always show whitespace at the top of the viewport. If a section starts crowded, increase top spacing before reducing copy.
6. **Accents are atmosphere, not decoration.** Use them to *characterise a moment* (live, ready, confirmed, recommended) — never for branding flourish.
7. **Editorial titles.** Every primary screen pairs an uppercase Label eyebrow with a big H1/Display heading. Never start a page with body copy.
8. **Tabular numbers everywhere monetary.** Use `tabular-nums` for ₹ amounts.
9. **Imagery is muted.** Food thumbnails sit on soft-cream backgrounds. No drop shadows on photography.
10. **One radius family.** Cards 28, buttons 18, pills 999. Don't introduce new radii without updating tokens.

---

## 13. Iconography

- **Library**: `lucide-react` exclusively. No mixed icon sets.
- **Stroke**: `1.7–1.9` default. Active/selected states bump to `2.0–2.2`. Never below 1.5 (looks frail).
- **Size**: 14 (caption), 16 (default), 18 (nav), 20 (page hero), 28+ (empty states).
- **Color**: inherit from text — `text-text-tertiary` default, `text-accent-ink-*` on tinted surfaces, `text-text-on-dark` inside black CTAs.
- Never fill icons except `Star` for ratings.

## 14. Illustration direction

- Geometric, minimal, two-tone. Soft-cream bg + muted-mint or peach accent.
- One illustration per screen, max. Empty states earn an illustration; loading states do not.
- Style references: Linear, Things 3, Apple Pay onboarding.
- No mascots, no photorealism, no foodtech "hand-drawn doodles".

## 15. Empty states

`@/components/ui/EmptyState` — soft accent rounded-hero icon bubble + H3 title + body-sm description + optional secondary action. Tones: `neutral / powder / cream / peach / mint`. Pick the tone that matches the *emotion* (e.g. cream for "empty cart" warmth, peach for "no restaurant" warning, mint for "all done").

## 16. Photography (food)

- **Background**: warm beige / soft-cream studio surface (`#FFF7E8` or `#F5F1E8`). No vibrant tablecloths.
- **Lighting**: soft top-right window light. No harsh shadows.
- **Crop**: square, dish centered, plate edges visible. 16px image inset.
- **Treatment**: no filters, no saturation boosts. Slightly desaturated > slightly amped.
- **Default**: when no photo is available, use the soft-cream bg + emoji thumbnail (current default) — it stays on-system.

---

## 17. Logo + branding suggestions

The current placeholder logo lives in `/public/brand/`. To match Soft Luxury OS,
evolve it as follows:

- **Wordmark**: Set "ETAEats" in Satoshi 600, tracking `-0.03em`. Lowercase "ats" optional for warmth.
- **Symbol**: a small powder-blue rounded square (`rounded-lg`) holding a single fork-and-bus glyph or a stylized arrow → fork. Same `radius-lg` used everywhere in the UI.
- **Color**: monochrome black wordmark on warm bg by default. Powder-blue symbol tile gives the only color.
- **Onboarding visuals**: editorial split — left panel soft-cream with display headline, right panel form. Reuse the login layout for all onboarding screens.
- **App icon**: black square (`#0D0D0D`) with the powder-blue symbol tile centered. Maps cleanly to iOS/Android squircle without losing identity.
- **Marketing photography**: highway-window POV shots, soft-cream interiors, hands-not-faces. Color graded with reduced saturation and slight warm tint.

---

## 18. Implementation map

| Concern | File |
|---|---|
| Tokens | `src/design-system/{colors,typography,spacing,radius,shadow,motion}.ts` |
| CSS vars | `src/app/globals.css` |
| Tailwind theme | `tailwind.config.ts` |
| Primitives | `src/components/ui/{Button,Card,Badge,Input,IconButton,Chip,Stepper,EmptyState,SectionHeader,Spinner}.tsx` |
| Shell | `src/components/layout/AppShell.tsx` (+ `MobileBottomNav`, `DesktopRail`, `TopBar`, `BrandMark`) |
| Cart auth sheet | `src/components/cart/AuthBottomSheet.tsx` |
| OTP cells | `src/components/cart/OTPInput.tsx` |
| Status stepper | `src/components/order/StatusStepper.tsx` |
| Menu primitives | `src/components/menu/{CategoryTabs,MenuItemRow,SearchOverlay,CartBar}.tsx` |
| Screens | `src/app/{home,scan,menu,cart,checkout,orders,order,profile,auth}` |

The system is now wired end-to-end: tokens → Tailwind → primitives → screens.
Touch a token, every screen updates.
