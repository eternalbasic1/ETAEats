# ETA Eats — React Native Migration Blueprint

> **Audience:** AI coding agents and engineers executing the mobile build.
> **Authority:** This document is the source of truth for the mobile
> migration. When this document conflicts with the existing web frontends,
> the web frontends are the **behavioural** reference; this document is
> the **architectural** decision log. The backend is always the source of
> truth for API shape.
> **How to use:** Read top-to-bottom on first read. After that, jump to the
> section header for the specific question.

**Hard output rules** carried over from the request: no "TBD", no "best
effort", no vague placeholders. Where a value is unknown, it is marked
`OPEN — RESOLVE BEFORE PHASE X` with the phase that blocks on it.

---

## Table of contents

- [Section 1 — Executive decisions](#section-1--executive-decisions)
- [Section 2 — Target mobile architecture](#section-2--target-mobile-architecture)
- [Section 3 — Design-system migration spec](#section-3--design-system-migration-spec)
- [Section 4 — Screen-by-screen migration map](#section-4--screen-by-screen-migration-map)
- [Section 5 — Auth, session, and security architecture](#section-5--auth-session-and-security-architecture)
- [Section 6 — Real-time and background behavior](#section-6--real-time-and-background-behavior)
- [Section 7 — Performance and reliability standards](#section-7--performance-and-reliability-standards)
- [Section 8 — QA and testing strategy](#section-8--qa-and-testing-strategy)
- [Section 9 — CI/CD and release engineering](#section-9--cicd-and-release-engineering)
- [Section 10 — Phased implementation roadmap](#section-10--phased-implementation-roadmap)
- [Section 11 — Code standards and best practices](#section-11--code-standards-and-best-practices)
- [Section 12 — Concrete first sprint plan](#section-12--concrete-first-sprint-plan)
- [Appendix A — Multi-app deployment from one monorepo (proof)](#appendix-a--multi-app-deployment-from-one-monorepo-proof)

---

## SECTION 1 — Executive decisions

### 1.1 The three options considered

**Option A — Single super-app with role-based modules.**
One binary, one bundle, one Expo project. After OTP login, the user is
routed to the passenger / restaurant / admin module based on
`user.role`. All three role flows live in the same app.

**Option B — Three fully separate React Native apps.**
Three Expo projects, three repos (or three top-level folders), zero
shared code. Each team owns its app top-to-bottom. UI components,
design tokens, API client, auth — all duplicated per app.

**Option C — Hybrid: shared core packages + 3 separate Expo shells.**
Three Expo projects in a single workspace (`frontendApps/`). Each app
has its own binary, store identity, and release pipeline, but they all
import from a small set of shared packages: `ui-tokens`,
`ui-components`, `api-client`, `auth`, `realtime`, `types`, `utils`.

### 1.2 Trade-off matrix

| Criterion              | A — Super-app | B — 3 isolated apps | C — Hybrid (chosen) |
|------------------------|---------------|---------------------|---------------------|
| **Speed to first ship** | Medium — bigger surface to stabilise | Slowest — duplication | Fastest — packages let you build once, ship 3× |
| **Maintainability**     | Low — every change risks all 3 roles | Low — drift between apps inevitable | High — change tokens/auth once, propagates to all |
| **Release complexity**  | High — one binary, can't ship roles independently | Low — fully independent | Low — fully independent |
| **Role isolation / RBAC** | Risky — runtime gating only; a bug exposes admin in passenger | Strong — only the right role can install | Strong — same as B, with no code crossover at runtime |
| **Bundle size**         | Worst — ships all 3 roles to every user | Best — minimal per app | Near-best — only shared code is shared |
| **App Store identity**  | Confusing (one app, three personas) | Clean | Clean |
| **Push channel routing** | Hard — must filter by role in-app | Trivial | Trivial |
| **Onboarding new agents** | Cognitive load high (whole codebase to grok) | Duplication burden | Bounded — agent only needs the app + packages it touches |
| **Cross-app consistency (visual)** | Forced (single codebase) | Hard (no shared layer) | Forced via shared tokens + components |
| **Risk of one app breaking another** | High | Zero | Zero (apps are separate binaries) |
| **Code reuse**          | ~95% | ~0% | ~60–70% (tokens, primitives, API, auth, realtime) |
| **Dev environment setup** | Simplest (1 project) | 3× | 1 monorepo install, 3 expo run targets |

### 1.3 Final recommendation — Option C, the hybrid

**Choose Option C — Hybrid: shared core packages + 3 separate Expo shells.**

**Why:**

1. **The three audiences are fundamentally different.** Passengers are
   public consumers (App Store / Play Store, public reviews, marketing
   matters). Restaurant staff are operators (often sideloaded, locked to
   a kitchen device, optimised for speed and large touch targets). Admins
   are internal (likely on TestFlight / internal track only). Forcing
   them into one binary means every public release ships staff and admin
   code to consumers — a security and reviewability problem.
2. **Release cadence will diverge.** The restaurant app needs hotfix
   speed (a kitchen tablet stuck on a broken build can't take orders).
   The passenger app needs slow, careful rollouts and store review
   cycles. The admin app changes whenever ops needs change. Independent
   binaries make this trivial.
3. **The risk of role leakage is unacceptable in a super-app.** A single
   `if (user.role === 'ADMIN')` typo could expose admin endpoints to a
   passenger device. Three binaries make this impossible — the admin
   app's code is not on a passenger's phone.
4. **The shared surface is genuinely shared.** Auth (OTP for all roles),
   error envelope, design tokens, real-time protocol, JWT refresh — all
   identical. Putting them in packages means one fix benefits all three.
5. **It's how the web is already organised.** `../frontend/passenger`,
   `../frontend/restaurant`, `../frontend/admin` are three separate
   Next.js apps. The mental model carries over — agents and engineers
   already know which app they're in.

**The cost we accept:** A slightly more complex monorepo build (Yarn /
pnpm workspaces, three Metro bundlers, three EAS profiles). Mitigated
in §2 and §9.

### 1.4 Decision log (record any future override here)

| Date       | Decision                                            | Reason                              | Author |
|------------|-----------------------------------------------------|-------------------------------------|--------|
| 2026-05-02 | Adopt Option C (hybrid monorepo, 3 Expo apps)       | See § 1.3                           | Initial blueprint |
| 2026-05-02 | Expo over bare RN                                   | OTA updates via EAS, faster dev     | Initial blueprint |
| 2026-05-02 | Expo Router over React Navigation directly         | File-based routing matches Next.js mental model passengers' web devs already know | Initial blueprint |
| 2026-05-02 | pnpm workspaces over Yarn / Nx / Turborepo         | Smallest tooling surface; native workspace support; agents won't trip on Nx executors | Initial blueprint |
| 2026-05-02 | MMKV over AsyncStorage for non-sensitive KV         | 30× faster, sync API, zustand-friendly | Initial blueprint |
| 2026-05-02 | `expo-secure-store` for tokens (not MMKV)           | Hardware-backed Keychain / Keystore | Initial blueprint |

---

## SECTION 2 — Target mobile architecture

### 2.1 Monorepo layout (exact)

```
frontendApps/
├── package.json                # workspace root, pnpm-workspace.yaml
├── pnpm-workspace.yaml         # lists ['passenger', 'restaurant', 'admin', 'packages/*']
├── tsconfig.base.json          # extended by every package
├── .nvmrc                      # node 20.11+
├── .gitignore                  # ignores node_modules, .expo, ios/build, android/build
├── CLAUDE.md                   # workspace orientation
├── design.md                   # this file
│
├── packages/
│   ├── ui-tokens/
│   │   ├── package.json        # name: "@eta/ui-tokens"
│   │   ├── src/
│   │   │   ├── colors.ts       # exact hex from passenger design system
│   │   │   ├── typography.ts   # font stack + scale
│   │   │   ├── spacing.ts      # 4-pt rhythm
│   │   │   ├── radius.ts       # 6 / 10 / 14 / 18 / 22 / 28 / 32 / 999
│   │   │   ├── shadow.ts       # iOS shadowOffset/Radius/Opacity + Android elevation
│   │   │   ├── motion.ts       # durations + easing curves (Reanimated-compatible)
│   │   │   ├── theme.ts        # `lightTheme` object; future `darkTheme`
│   │   │   └── index.ts        # barrel
│   │   └── tsconfig.json
│   │
│   ├── ui-components/
│   │   ├── package.json        # depends on @eta/ui-tokens
│   │   ├── src/
│   │   │   ├── Button/         # primary/secondary/outline/ghost/soft/danger/success
│   │   │   ├── IconButton/
│   │   │   ├── Input/          # TextInput wrapper with label, hint, error
│   │   │   ├── OTPInput/       # 6-box numeric grid with auto-advance
│   │   │   ├── Card/           # tone variants (default/elevated/powder/peach/mint/sunk)
│   │   │   ├── Badge/          # variants matching web
│   │   │   ├── Chip/           # toggleable pill
│   │   │   ├── Stepper/        # qty +/-
│   │   │   ├── Spinner/
│   │   │   ├── EmptyState/
│   │   │   ├── SectionHeader/
│   │   │   ├── BottomSheet/    # @gorhom/bottom-sheet wrapper
│   │   │   ├── Skeleton/       # shimmer using Reanimated
│   │   │   ├── ConnectionBadge/  # ws state pill (used in restaurant + admin live views)
│   │   │   ├── Toast/          # sonner-native wrapper
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   │
│   ├── api-client/
│   │   ├── package.json        # depends on @eta/auth (token getter), @eta/types
│   │   ├── src/
│   │   │   ├── client.ts       # axios instance, baseURL from env
│   │   │   ├── interceptors.ts # request: attach Bearer; response: 401 refresh queue
│   │   │   ├── refresh.ts      # single-flight refresh with promise queue
│   │   │   ├── errors.ts       # parses {error: {code, message, details}} → DomainError
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.ts     # otpRequest, otpVerify, refreshToken, logout, me, updateMe
│   │   │   │   ├── restaurants.ts  # list, scan, getMenu, manageMenuItem
│   │   │   │   ├── orders.ts   # cart, checkout, my, restaurant, advance
│   │   │   │   ├── fleet.ts    # operators, routes, buses, assignments, gpsPing
│   │   │   │   ├── payments.ts # razorpayCreate, confirm
│   │   │   │   └── notifications.ts
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   │
│   ├── auth/
│   │   ├── package.json        # depends on @eta/api-client, expo-secure-store, zustand
│   │   ├── src/
│   │   │   ├── secureStorage.ts  # get/set/delete tokens via SecureStore
│   │   │   ├── store.ts          # zustand: user, isAuthenticated, hasHydrated, setAuth, clearAuth
│   │   │   ├── hooks.ts          # useAuth() — requestOTP, verifyOTP, logout
│   │   │   ├── guards.ts         # useRequireRole(role) — throws/redirects if mismatch
│   │   │   ├── session.ts        # background detection, idle lock, biometric gate (admin)
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   │
│   ├── realtime/
│   │   ├── package.json        # depends on @eta/auth (token getter)
│   │   ├── src/
│   │   │   ├── socket.ts       # WebSocket wrapper with reconnect + backoff
│   │   │   ├── useUserSocket.ts        # /ws/user/?token=...
│   │   │   ├── useRestaurantSocket.ts  # /ws/restaurant/{id}/?token=...
│   │   │   ├── lifecycle.ts    # AppState foreground/background gate
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   │
│   ├── types/
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── user.ts         # User, Membership, UserRole, OrgRole
│   │   │   ├── order.ts        # Order, OrderItem, OrderStatus, ALLOWED_STATUS_TRANSITIONS
│   │   │   ├── restaurant.ts   # Restaurant, MenuCategory, MenuItem
│   │   │   ├── fleet.ts        # Bus, Route, Operator, Assignment
│   │   │   ├── notification.ts
│   │   │   ├── payment.ts      # Razorpay request/response
│   │   │   ├── apiError.ts     # ApiError envelope + DomainError class
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   │
│   └── utils/
│       ├── package.json
│       ├── src/
│       │   ├── currency.ts     # formatINR(paise|rupees, withSymbol)
│       │   ├── phone.ts        # E.164 helpers, India default
│       │   ├── date.ts         # relative time, ETA, cart expiry
│       │   ├── logger.ts       # log levels, PII redaction, Sentry breadcrumb hookup
│       │   ├── env.ts          # typed access to expo extra config
│       │   └── index.ts
│       └── tsconfig.json
│
├── passenger/
│   ├── app.config.ts           # Expo config: name="ETA Eats", slug, icon, splash
│   ├── eas.json                # EAS build profiles: development, preview, production
│   ├── package.json
│   ├── babel.config.js
│   ├── metro.config.js         # configured for monorepo (extraNodeModules → packages)
│   ├── tsconfig.json
│   ├── assets/
│   │   ├── fonts/              # Satoshi, GeneralSans, NeueMontreal, Inter (.otf)
│   │   ├── icon.png
│   │   ├── splash.png
│   │   └── images/
│   ├── app/                    # expo-router file-based routes
│   │   ├── _layout.tsx         # root stack: providers, font load gate, splash
│   │   ├── index.tsx           # splash / route to /home or /scan
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── otp.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx     # bottom tabs: Home, Scan, Orders, You
│   │   │   ├── home.tsx
│   │   │   ├── scan.tsx
│   │   │   ├── orders.tsx
│   │   │   └── profile.tsx
│   │   ├── scan/
│   │   │   ├── [qr_token].tsx  # processing screen → menu
│   │   │   ├── invalid.tsx
│   │   │   └── no-restaurant.tsx
│   │   ├── menu/
│   │   │   └── [restaurantId].tsx
│   │   ├── cart.tsx
│   │   ├── checkout.tsx
│   │   ├── order/
│   │   │   ├── [orderId].tsx        # live tracking
│   │   │   └── [orderId]/complete.tsx
│   │   └── +not-found.tsx
│   ├── src/
│   │   ├── stores/             # passenger-specific zustand: cart, journey, orderTracking
│   │   ├── queries/            # TanStack Query hooks (useMenuQuery, useMyOrdersQuery, …)
│   │   ├── components/         # passenger-specific UI (MenuItemRow, CartBar, AuthSheet, …)
│   │   └── lib/                # razorpay wrapper, deep-link parser
│   └── CLAUDE.md
│
├── restaurant/
│   ├── app.config.ts           # Expo config: name="ETA Eats Kitchen"
│   ├── eas.json
│   ├── package.json
│   ├── babel.config.js
│   ├── metro.config.js
│   ├── tsconfig.json
│   ├── assets/                 # same fonts as passenger; different icon/splash
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # → /login or /(dashboard)/orders
│   │   ├── (auth)/
│   │   │   └── login.tsx
│   │   └── (dashboard)/
│   │       ├── _layout.tsx     # tabs or drawer: Orders, Menu, Analytics, Profile
│   │       ├── orders.tsx      # Kanban: NEW / COOKING / READY (swimlanes)
│   │       ├── orders-history.tsx
│   │       ├── menu/
│   │       │   ├── index.tsx
│   │       │   ├── new.tsx
│   │       │   └── [id].tsx
│   │       ├── analytics.tsx
│   │       └── profile.tsx
│   ├── src/
│   │   ├── stores/             # restaurant-specific (sound prefs, kanban filters)
│   │   ├── queries/            # useRestaurantOrdersQuery, useAdvanceOrderMutation, …
│   │   ├── components/         # OrderCard, KanbanColumn, CategoryFormSheet, AvailabilityToggle
│   │   ├── sound/              # new-order chime, audio session
│   │   └── lib/
│   └── CLAUDE.md
│
├── admin/
│   ├── app.config.ts           # Expo config: name="ETA Eats Admin"
│   ├── eas.json
│   ├── package.json
│   ├── babel.config.js
│   ├── metro.config.js
│   ├── tsconfig.json
│   ├── assets/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── (auth)/login.tsx
│   │   └── (dashboard)/
│   │       ├── _layout.tsx     # tabs or drawer: Overview, Routes, Buses, Operators, Restaurants, Assignments, Profile
│   │       ├── overview.tsx
│   │       ├── routes/
│   │       ├── buses/
│   │       ├── operators/
│   │       ├── restaurants/
│   │       ├── assignments/
│   │       └── profile.tsx
│   ├── src/
│   │   ├── stores/
│   │   ├── queries/
│   │   ├── components/         # ListScreen, EntitySheet (modal form), FilterBar
│   │   └── lib/
│   └── CLAUDE.md
│
└── docs/
    ├── api-contracts/          # one .md per backend domain, with curl examples
    ├── screen-specs/           # one .md per screen for AI agents to consume
    └── proposals/              # ADR-style proposals before stack additions
```

### 2.2 Workspace tooling — exact versions

`package.json` (workspace root):
```json
{
  "name": "eta-eats-mobile",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20.11.0" },
  "scripts": {
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "passenger": "pnpm --filter passenger",
    "restaurant": "pnpm --filter restaurant",
    "admin": "pnpm --filter admin"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "eslint": "9.10.0",
    "prettier": "3.3.3"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'passenger'
  - 'restaurant'
  - 'admin'
  - 'packages/*'
```

Each app's `metro.config.js` must add the monorepo root to
`watchFolders` and resolve symlinks — the canonical Expo monorepo recipe:

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

### 2.3 Navigation architecture

**Library:** Expo Router v3 (file-based). Underneath it uses
React Navigation v6 — drop down only when Expo Router can't express the
shape (rare).

**Stack hierarchy per app:**

- **Passenger:**
  - Root stack
    - `(auth)` group — login, otp (modal-style stack, no tabs)
    - `(tabs)` group — Home / Scan / Orders / You (bottom tab pill)
    - Modal routes: `cart`, `checkout`, `scan/[qr_token]`, `menu/[restaurantId]`, `order/[orderId]`, `order/[orderId]/complete`
  - Deep links: `etaeats://scan/<qr_token>`, `etaeats://order/<orderId>`
  - Universal links: `https://eta.app/scan/<qr_token>` (passenger only)
- **Restaurant:**
  - Root stack
    - `(auth)` group — login
    - `(dashboard)` group — drawer (or top tabs on phones): Orders / History / Menu / Analytics / Profile
    - Modal routes: `menu/new`, `menu/[id]`, cancel-order sheet, category-form sheet
  - Deep links: `etaeatskitchen://orders/<orderId>` (push tap)
- **Admin:**
  - Root stack
    - `(auth)/login`
    - `(dashboard)` — tabs: Overview / Routes / Buses / Operators / Restaurants / Assignments / Profile
    - Modal entity sheets per CRUD
  - Deep links: none required for v1.

**Common rules:**
- Auth-gated layouts use a `_layout.tsx` that reads `useAuthStore` and
  redirects to the auth group if `!isAuthenticated`.
- Navigation type-safety via Expo Router's typed routes (
  `experiments.typedRoutes: true` in `app.config.ts`).
- Headers are styled via `Stack.Screen options` with the same TopBar
  treatment as the web (back chevron + centered title or section name).

### 2.4 State strategy boundaries

| State                        | Lives in                          | Rationale |
|------------------------------|-----------------------------------|-----------|
| Auth (user, tokens, role)    | `@eta/auth` zustand store         | Cross-cutting; identical across apps |
| Server data (orders, menu, restaurants, …) | TanStack Query cache | Caching, retries, background refetch |
| Cart (passenger only)        | passenger zustand `useCartStore`  | Persisted via MMKV; survives kill-and-relaunch |
| Active journey (passenger)   | passenger zustand `useJourneyStore` | 4h expiry, last-5 history |
| Live order tracking (passenger) | passenger zustand `useOrderTrackingStore` | Toast/banner state for active order |
| WebSocket connection state   | `@eta/realtime` hook (local React state inside hook) | Per-mount; ConnectionBadge subscribes |
| Sound prefs (restaurant)     | restaurant zustand `useSoundStore` | Persisted MMKV |
| Kanban filters (restaurant)  | local component state (URL search params if filter is shareable) | Ephemeral; resets on tab switch |
| Form state                   | React Hook Form (per-screen)      | No global form state ever |
| Modal / sheet open state     | local component state             | Don't globalise UI ephemera |

**Invariant:** **No business logic in zustand stores.** Stores hold
state and pure setters. All mutations that change server state go
through `@eta/api-client` mutation hooks. Stores accept the result and
update local cache.

### 2.5 Offline / poor-network strategy

The product is used **inside moving buses on highways**. Network is
intermittent. Strategy:

1. **Reads:** TanStack Query with `staleTime` tuned per resource:
   - Menu: 5 minutes (rarely changes; cached aggressively).
   - Restaurant list / detail: 5 minutes.
   - My orders: 30 seconds (or invalidated by WS event).
   - Notifications: 30 seconds.
   - QR scan: no cache (always fresh).
2. **Writes:** Optimistic updates for cart add / qty change / remove.
   Roll back with a toast on failure. **Order status mutations
   (restaurant) are NEVER optimistic** — staff need to see the server
   confirmed the transition.
3. **Queue retries:** Axios retries once with 500ms backoff on network
   error (`error.code === 'ERR_NETWORK'`); never on 4xx.
4. **Banner:** A persistent "Reconnecting…" banner appears when
   `NetInfo` reports `!isInternetReachable` for >2 seconds.
5. **Cart persistence:** Cart state is in MMKV-persisted zustand. If the
   passenger loses network mid-checkout, the cart is preserved and the
   payment screen retries the Razorpay create-order call on reconnect.
6. **WebSocket gating:** Sockets are paused when `AppState` is
   `background` and resumed on `active`. See § 6.

### 2.6 Environment / config strategy

Expo uses `app.config.ts` with `extra` for runtime config, populated
from `.env.<profile>` files at build time. Three profiles, three apps:

```
.env.development   # local: API at http://192.168.x.x:8000, WS at ws://...:8000
.env.staging       # staging: https://stg-api.etaeats.app
.env.production    # prod: https://api.etaeats.app
```

`packages/utils/src/env.ts` provides typed access:

```ts
import Constants from 'expo-constants';
import { z } from 'zod';

const schema = z.object({
  apiBaseUrl: z.string().url(),
  wsBaseUrl: z.string().url(),
  sentryDsn: z.string().optional(),
  posthogKey: z.string().optional(),
  razorpayKeyId: z.string().min(1),
  appEnv: z.enum(['development', 'staging', 'production']),
});

export const env = schema.parse(Constants.expoConfig?.extra ?? {});
```

EAS profiles in each app's `eas.json` set `EAS_BUILD_PROFILE` and the
matching `.env.<profile>` is selected by an `app.config.ts` switch.
**Secrets (Razorpay key, Sentry DSN, PostHog key) are stored as EAS
secrets, never committed.**

---

## SECTION 3 — Design-system migration spec

### 3.1 Token mapping web → React Native (verbatim values)

These values are copied directly from
`../frontend/passenger/src/design-system/*.ts` and
`../frontend/passenger/src/app/globals.css`. **Do not change them
without updating both this section and the web design system.**

#### 3.1.1 Colors — `packages/ui-tokens/src/colors.ts`

```ts
export const palette = {
  // Surfaces
  bg:           '#F5F5F2',  // page background — warm off-white
  surface:      '#FFFFFF',
  surface2:     '#FAFAF8',
  surfaceSunk:  '#F0F0EC',

  // Borders
  borderSubtle: '#EFEFEA',
  border:       '#E8E8E2',
  borderStrong: '#D9D9D1',

  // Text
  textPrimary:   '#111111',
  textSecondary: '#3E3E3A',
  textTertiary:  '#6F6F6A',
  textMuted:     '#8C8C84',
  textDisabled:  '#A9A9A2',
  textOnDark:    '#FAFAF8',

  // Primary
  primary:      '#0D0D0D',
  primaryHover: '#000000',
  primarySoft:  '#DDEAF3',  // identical to powder blue

  // Brand accents (preserve EXACTLY — non-negotiable)
  accentPowderBlue: '#DDEAF3',
  accentSoftCream:  '#FFF7E8',
  accentPeach:      '#FFD7C2',
  accentMutedMint:  '#EAF4EA',

  // Semantic
  successFg: '#2E5D38',
  successBg: '#EAF4EA',
  successBorder: '#CFE2CF',

  warningFg: '#8A5634',
  warningBg: '#FFF4EB',

  errorFg:   '#8A3B3B',
  errorBg:   '#FCEFEF',

  infoFg:    '#3A5568',
  infoBg:    '#DDEAF3',
} as const;

export type ColorToken = keyof typeof palette;
```

#### 3.1.2 Typography — `packages/ui-tokens/src/typography.ts`

```ts
import { Platform } from 'react-native';

// Loaded via expo-font; see § 3.4 for font file recipe.
// Custom font files are referenced by their loaded name (Postscript-style key).
export const fontFamily = {
  sans:    'Satoshi-Variable',     // primary
  display: 'Satoshi-Variable',
  mono:    Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

// Font fallback chain (used by NativeWind / RN Text style.fontFamily):
// At runtime, when Satoshi fails to load, fall back to the platform sans:
// iOS: 'System' (San Francisco), Android: 'Roboto'.
// This is enforced by a font-load gate in app/_layout.tsx — see § 3.4.

export const typography = {
  displayXL: { fontSize: 56, lineHeight: 60, fontWeight: '600' as const, letterSpacing: -56 * 0.035 },
  displayL:  { fontSize: 44, lineHeight: 50, fontWeight: '600' as const, letterSpacing: -44 * 0.030 },
  h1:        { fontSize: 32, lineHeight: 38, fontWeight: '600' as const, letterSpacing: -32 * 0.022 },
  h2:        { fontSize: 24, lineHeight: 30, fontWeight: '600' as const, letterSpacing: -24 * 0.018 },
  h3:        { fontSize: 20, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -20 * 0.012 },
  h4:        { fontSize: 17, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -17 * 0.008 },
  bodyLg:    { fontSize: 17, lineHeight: 26, fontWeight: '500' as const, letterSpacing: -17 * 0.003 },
  body:      { fontSize: 15, lineHeight: 22, fontWeight: '500' as const, letterSpacing: 0 },
  bodySm:    { fontSize: 13, lineHeight: 20, fontWeight: '500' as const, letterSpacing: 13 * 0.002 },
  caption:   { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 12 * 0.005 },
  label:     { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 11 * 0.10, textTransform: 'uppercase' as const },
  button:    { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, letterSpacing: -15 * 0.005 },
  mono:      { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0 },
} as const;
```

> **RN letterSpacing units:** React Native takes `letterSpacing` in
> absolute units (points), not `em`. The conversions above multiply the
> CSS `em` value by the corresponding `fontSize` (e.g. CSS
> `-0.022em` at 32px → RN `-0.704`).
> **fontWeight `450` from web:** RN doesn't support 450; we round to
> 500. This produces a near-identical rendered weight on both platforms.

#### 3.1.3 Spacing — `packages/ui-tokens/src/spacing.ts`

```ts
export const spacing = {
  0: 0,
  px: 1,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;
```

#### 3.1.4 Radius — `packages/ui-tokens/src/radius.ts`

```ts
export const radius = {
  none: 0,
  xs:   6,
  sm:  10,
  md:  14,
  lg:  18,
  xl:  22,
  card: 28,
  hero: 32,
  pill: 999,
} as const;
```

#### 3.1.5 Shadow / elevation — `packages/ui-tokens/src/shadow.ts`

CSS `box-shadow` doesn't translate directly. RN needs **iOS shadow
properties + Android elevation**. These approximations preserve the
"soft luxury" feel:

```ts
import { Platform } from 'react-native';
import { palette } from './colors';

const ios = (offset: { width: number; height: number }, radius: number, opacity: number) => ({
  shadowColor: '#111111',
  shadowOffset: offset,
  shadowOpacity: opacity,
  shadowRadius: radius,
});

const android = (elevation: number) => ({ elevation });

const make = (
  iosCfg: { offset: { width: number; height: number }; radius: number; opacity: number },
  androidElevation: number,
) => Platform.select({
  ios: ios(iosCfg.offset, iosCfg.radius, iosCfg.opacity),
  android: android(androidElevation),
  default: {},
});

export const shadow = {
  e0: {},
  e1: make({ offset: { width: 0, height: 1 }, radius: 2,  opacity: 0.04 }, 1),
  e2: make({ offset: { width: 0, height: 6 }, radius: 18, opacity: 0.05 }, 3),
  e3: make({ offset: { width: 0, height: 12}, radius: 28, opacity: 0.07 }, 6),
  floatingCta: make({ offset: { width: 0, height: 10 }, radius: 28, opacity: 0.18 }, 10),
  modal:       make({ offset: { width: 0, height: 24 }, radius: 60, opacity: 0.14 }, 16),
  navPill:     make({ offset: { width: 0, height: 10 }, radius: 28, opacity: 0.10 }, 8),
} as const;
```

> **`inset` shadow** from the web (used on text inputs) has no native
> equivalent. We replicate visually with a 1px top border using
> `palette.borderSubtle` instead.

#### 3.1.6 Motion — `packages/ui-tokens/src/motion.ts`

```ts
import { Easing } from 'react-native-reanimated';

export const duration = {
  instant:    80,
  fast:      140,
  base:      220,
  slow:      320,
  deliberate: 480,
} as const;

// Reanimated easing curves mirror the web's cubic-beziers.
export const easing = {
  standard: Easing.bezier(0.22, 0.61, 0.36, 1).factory(),
  enter:    Easing.bezier(0.16, 1, 0.30, 1).factory(),
  exit:     Easing.bezier(0.70, 0, 0.84, 0).factory(),
} as const;

export const spring = {
  soft:    { damping: 22, stiffness: 180, mass: 1 },
  medium:  { damping: 18, stiffness: 220, mass: 1 },
  snappy:  { damping: 14, stiffness: 320, mass: 1 },
  sheet:   { damping: 26, stiffness: 260, mass: 1 },
} as const;
```

#### 3.1.7 Theme barrel — `packages/ui-tokens/src/theme.ts`

```ts
import { palette } from './colors';
import { typography, fontFamily } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadow } from './shadow';
import { duration, easing, spring } from './motion';

export const lightTheme = {
  colors: palette,
  typography,
  fontFamily,
  spacing,
  radius,
  shadow,
  motion: { duration, easing, spring },
} as const;

export type Theme = typeof lightTheme;
```

### 3.2 Platform parity rules

| Concern | iOS | Android |
|---------|-----|---------|
| Status bar | `expo-status-bar` style="dark", background transparent | Same; translucent on Android |
| Safe area | `react-native-safe-area-context` `<SafeAreaView edges={['top','bottom']}>` on all screens | Same |
| Bottom nav pill | Inset 16px from bottom + safe-area inset | Same; respect gesture bar |
| Haptics on primary actions | `expo-haptics` `selectionAsync()` | Same (vibration pattern) |
| Keyboard avoidance | `KeyboardAvoidingView behavior="padding"` | `behavior="height"` |
| Back gesture | iOS swipe-from-edge enabled by default | Hardware back wired via Expo Router |
| Splash screen | `expo-splash-screen` hide after fonts loaded | Same |
| Dark mode | NOT SHIPPED V1 — see § 3.4 | NOT SHIPPED V1 |

### 3.3 Accessibility guardrails

These are non-negotiable. Every PR must pass them.

1. **Contrast:** All text/background pairs must meet WCAG AA (4.5:1 for
   body, 3:1 for large text). The token palette has been audited:
   `textPrimary on bg = 16.6:1`, `textSecondary on bg = 9.4:1`,
   `textTertiary on bg = 5.1:1`. Do not invent new pairings without
   running them through a contrast checker.
2. **Touch targets:** Minimum 44×44 points (iOS HIG) and 48×48 dp
   (Material). The `Button` component enforces this with min-height.
   Icon-only buttons (`IconButton`) must use `hitSlop={{ top: 8, bottom:
   8, left: 8, right: 8 }}` if visual size < 44.
3. **Dynamic Type:** All `Text` uses `allowFontScaling={true}` (the
   default). The typography tokens above scale linearly. Test at
   `largestContentSizeCategory` on iOS and "Largest" on Android — no
   layout must break.
4. **Screen readers:** Every interactive element has
   `accessibilityRole`, `accessibilityLabel`, and where applicable
   `accessibilityHint`. Decorative emojis are wrapped with
   `accessibilityElementsHidden`.
5. **Focus order:** Custom navigation (e.g. OTP grid auto-advance) must
   not trap VoiceOver / TalkBack. The `OTPInput` component sets
   `accessibilityElementsHidden` on inactive boxes.
6. **Reduce motion:** `useReducedMotion` from Reanimated. If true,
   collapse all animations to opacity transitions only.
7. **Color blindness:** Status colors (success / warning / error) are
   never used alone — always paired with an icon or label.
8. **Localization safety:** Buttons accept variable-length labels
   without truncation in 10/11 European languages and Hindi/Tamil/Telugu
   (test strings provided in `docs/i18n-test-strings.md`). v1 ships
   English only; layout must not assume English-only.

### 3.4 Theming system plan

**v1: light mode only.** Dark mode is parked because the web design
system has no dark variants and inventing one violates the
"non-negotiable design carryover" rule.

**Theme provider** — `packages/ui-components/src/ThemeProvider.tsx`:

```ts
import React, { createContext, useContext } from 'react';
import { lightTheme, Theme } from '@eta/ui-tokens';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
```

**Component pattern** — every component reads from the theme:

```ts
import { StyleSheet } from 'react-native';
import { useTheme } from '@eta/ui-components';

export function Button({ children, variant = 'primary' }) {
  const t = useTheme();
  const styles = StyleSheet.create({
    base: {
      borderRadius: t.radius.pill,
      paddingVertical: t.spacing[3],
      paddingHorizontal: t.spacing[5],
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      ...t.shadow.e1,
    },
    primary:   { backgroundColor: t.colors.primary },
    secondary: { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
    // …
  });
  return <Pressable style={[styles.base, styles[variant]]}>{children}</Pressable>;
}
```

**Font loading** — `passenger/app/_layout.tsx` (and identically in
restaurant + admin):

```ts
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'Satoshi-Variable': require('../assets/fonts/Satoshi-Variable.otf'),
    // Fallback fonts loaded only if needed; system fallback handles missing weights.
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;
  return /* providers + Stack */;
}
```

If the Satoshi license is unavailable in production, the build script
swaps `Satoshi-Variable` → Inter Variable in `packages/ui-tokens/src/typography.ts`
via a single constant. **License the font before phase 4.**

**Future dark theme constraint:** When dark mode is added, every token
must have a paired dark value, and the `ColorToken` enum is the only
allowed contract — no new color names, only new values for existing
names.

### 3.5 Naming conventions

- Token access: `t.colors.accentPowderBlue`, never `'#DDEAF3'` inline.
- Component files: `PascalCase/PascalCase.tsx` plus
  `PascalCase/index.ts` re-export.
- Stories / examples (in `README.md` per component): named after the
  variant, e.g. `<Button variant="primary">`.
- Style objects via `StyleSheet.create` (not inline `style={{}}` for
  more than 2 properties).

---

## SECTION 4 — Screen-by-screen migration map

Format for every row: existing screen purpose → target RN screen → API
endpoints → state deps → validation → error states → loading/skeleton →
empty states → a11y notes → analytics events → acceptance criteria.

### 4.1 PASSENGER app (15 screens)

#### 4.1.1 Splash / root redirect
- **Web counterpart:** `frontend/passenger/src/app/page.tsx`
- **Target RN:** `passenger/app/index.tsx`
- **Purpose:** Decide whether to send the user to `/scan` (no journey),
  `/home` (active journey), or `/auth/login` (no token).
- **API:** none.
- **State deps:** `useAuthStore.isAuthenticated`,
  `useJourneyStore.activeJourney`.
- **Validation:** none.
- **Error states:** none.
- **Loading:** Splash screen visible until fonts loaded + auth hydrated.
- **Empty:** N/A.
- **A11y:** announce "ETA Eats loading" once.
- **Analytics:** `app_open` event with role="anonymous"|"passenger".
- **Acceptance:** Time from cold start to first interactive frame
  ≤ 2.5s on a Pixel 4a. Never flashes the wrong screen during hydration.

#### 4.1.2 Auth — phone entry
- **Web:** `frontend/passenger/src/app/auth/login/page.tsx`
- **Target RN:** `passenger/app/(auth)/login.tsx`
- **Purpose:** Collect 10-digit India phone, request OTP.
- **API:** `POST /auth/otp/request/ {phone_number}`.
- **State deps:** none beyond local input state; uses
  `useAuth().requestOTP`.
- **Validation:** Zod schema: `/^[6-9]\d{9}$/` (Indian mobile prefix).
- **Errors:**
  - Network → toast "No connection — try again", input stays editable.
  - 429 (rate limit) → inline "Too many requests, wait 60s", disable
    submit button.
  - 5xx → toast "Couldn't reach our servers", input stays editable.
- **Loading:** Submit button shows inline spinner; phone input
  disabled.
- **Empty:** N/A.
- **A11y:** `accessibilityLabel="Phone number"`, `keyboardType="number-pad"`,
  `textContentType="telephoneNumber"`, `autoComplete="tel"`.
- **Analytics:** `auth_otp_requested` with hashed phone (SHA-256, last
  4 digits in plaintext only).
- **Acceptance:** Submit disabled until 10 valid digits.
  Country code +91 visible and immutable. Successful submit navigates
  to `/auth/otp?phone=<digits>` within 100ms after API success.

#### 4.1.3 Auth — OTP verify
- **Web:** `frontend/passenger/src/app/auth/otp/page.tsx`
- **Target RN:** `passenger/app/(auth)/otp.tsx`
- **Purpose:** 6-digit OTP entry, verify, set tokens, route to /home.
- **API:** `POST /auth/otp/verify/ {phone_number, code}` →
  `{ user, tokens: { access, refresh } }`.
- **State deps:** `useAuth().verifyOTP`, writes to `@eta/auth` store.
- **Validation:** 6 digits numeric.
- **Errors:**
  - 400 invalid_otp → shake animation (Reanimated), red border,
    inline "Incorrect code".
  - 410 expired → "Code expired", show resend.
  - Network → toast.
- **Loading:** Inline spinner over OTP grid after 6th digit.
- **Empty:** N/A.
- **A11y:** Each box has `accessibilityLabel="OTP digit N of 6"`.
  `autoComplete="one-time-code"` on iOS for Messages auto-fill.
- **Analytics:** `auth_otp_verified`, `auth_otp_failed` with reason.
- **Acceptance:** Auto-paste from SMS works on iOS (Messages) and
  Android (SMS Retriever API via `expo-sms-retriever` if available;
  graceful manual otherwise). Resend countdown 30s, then enabled.
  Verify fires on 6th digit auto-advance — no submit button needed.

#### 4.1.4 Home
- **Web:** `frontend/passenger/src/app/home/page.tsx`
- **Target RN:** `passenger/app/(tabs)/home.tsx`
- **Purpose:** Welcome, active journey card, recent orders, "Scan to
  start" CTA.
- **API:** `GET /orders/my/?page_size=5` (recent), `GET /auth/me/`
  (user info).
- **State deps:** `useAuthStore`, `useJourneyStore`.
- **Validation:** N/A.
- **Errors:** Show empty-state cards if list 401s after refresh.
- **Loading:** Skeleton cards for journey card and recent orders list.
- **Empty:** "No active trip — tap Scan to begin" hero card.
- **A11y:** Sectioned with `accessibilityRole="header"` per heading.
- **Analytics:** `home_view`, `home_scan_cta_tap`.
- **Acceptance:** Skeleton shows for ≤ 600ms typical. CTA reaches scan
  in ≤ 1 navigation transition.

#### 4.1.5 Scan (camera entry)
- **Web:** `frontend/passenger/src/app/scan/page.tsx`
- **Target RN:** `passenger/app/(tabs)/scan.tsx`
- **Purpose:** Open camera, scan QR, route to `/scan/[qr_token]`.
- **API:** none here; deferred to next screen.
- **State deps:** `expo-camera` permission state.
- **Validation:** QR payload must match `/^[A-Za-z0-9_-]{16,64}$/`
  (token format) — else navigate to `/scan/invalid`.
- **Errors:**
  - Permission denied → screen with "Open Settings" CTA.
  - Camera unavailable → toast + fallback "Enter code manually" link.
- **Loading:** Camera initialising spinner.
- **Empty:** Fullscreen overlay with viewfinder square + "Point at the
  QR sticker inside your bus".
- **A11y:** `accessibilityHint="Camera preview, point at the QR
  sticker"`. Provide a "Type code manually" entry as a fallback.
- **Analytics:** `scan_open`, `scan_token_captured`,
  `scan_permission_denied`.
- **Acceptance:** Token recognised in ≤ 1.2s from permission grant on a
  Pixel 4a. Haptic `selectionAsync()` on capture. Camera released
  immediately on navigation away.

#### 4.1.6 Scan — processing `[qr_token]`
- **Web:** `frontend/passenger/src/app/scan/[qr_token]/page.tsx`
- **Target RN:** `passenger/app/scan/[qr_token].tsx`
- **Purpose:** Resolve token → bus + restaurant + menu, hydrate journey
  store, redirect to `/menu/[restaurantId]`.
- **API:** `GET /restaurants/scan/<qr_token>/` (public).
- **State deps:** writes `useJourneyStore.setActiveJourney`.
- **Validation:** Backend returns 404 if invalid → navigate
  `/scan/invalid`. 200 with `restaurant: null` → `/scan/no-restaurant`.
- **Errors:** Network → retry once, then `/scan/invalid` with retry CTA.
- **Loading:** Centered spinner + "Connecting your bus to the
  kitchen…".
- **Empty:** N/A (terminal screen).
- **A11y:** `accessibilityLiveRegion="polite"` for status text.
- **Analytics:** `scan_resolved` (with bus_id, restaurant_id),
  `scan_invalid`, `scan_no_restaurant`.
- **Acceptance:** Resolution + redirect ≤ 1.5s on a stable connection.

#### 4.1.7 Menu `[restaurantId]`
- **Web:** `frontend/passenger/src/app/menu/[restaurantId]/page.tsx`
- **Target RN:** `passenger/app/menu/[restaurantId].tsx`
- **Purpose:** Browse menu by category, search, add to cart.
- **API:** `GET /restaurants/{id}/`,
  `GET /restaurants/menu-items/?restaurant=<id>`,
  `POST /orders/cart/` (anonymous OK).
- **State deps:** `useCartStore` (writes), `useJourneyStore` (reads).
- **Validation:** Quantity 1–99 per add.
- **Errors:**
  - `restaurant_mismatch` (cart from another restaurant) → bottom-sheet
    "Switch restaurant?" with "Replace cart" / "Keep current".
  - Item unavailable → row goes to muted state, toast.
- **Loading:** Skeleton rows (5 placeholders) per category.
- **Empty:** "This kitchen hasn't published a menu yet."
- **A11y:** Category tabs with `accessibilityRole="tablist"` and
  `tab` per chip. Each menu item button announces "Add {item} for
  {price}".
- **Analytics:** `menu_view`, `menu_search`, `menu_item_add`.
- **Acceptance:** First item visible ≤ 800ms after navigation on a
  cached menu, ≤ 1.6s cold. Cart bar slides up within 220ms of first
  add.

#### 4.1.8 Cart
- **Web:** `frontend/passenger/src/app/cart/page.tsx`
- **Target RN:** `passenger/app/cart.tsx` (presented as a screen, not a
  modal — matches the web pattern).
- **Purpose:** Review items, adjust quantities, remove, proceed to
  checkout.
- **API:** `GET /orders/cart/`, `PATCH /orders/cart/items/{id}/`,
  `DELETE /orders/cart/items/{id}/`.
- **State deps:** `useCartStore`.
- **Validation:** qty ≥ 1 (delete to remove).
- **Errors:** 409 from backend on stale cart → refetch + toast "Cart
  updated".
- **Loading:** Skeleton item rows.
- **Empty:** "Your cart is empty — head back to the menu" with CTA.
- **A11y:** Stepper `+`/`–` buttons have hit slop; `accessibilityValue`
  reports current quantity.
- **Analytics:** `cart_view`, `cart_item_qty_change`,
  `cart_item_remove`, `cart_proceed_to_checkout`.
- **Acceptance:** Optimistic qty updates feel instant (≤ 16ms paint).
  Network failures roll back with a 'Couldn't save change' toast.

#### 4.1.9 Checkout
- **Web:** `frontend/passenger/src/app/checkout/page.tsx`
- **Target RN:** `passenger/app/checkout.tsx`
- **Purpose:** Confirm cart → create Order → launch Razorpay → confirm.
- **API:**
  - `POST /orders/checkout/ {cart_id, bus_id}` → `Order` (status
    PENDING).
  - `GET /payments/razorpay/order/?order_id=<uuid>` → `{razorpay_order_id,
    amount, currency, key_id}`.
  - `POST /payments/razorpay/confirm/ {order_id, razorpay_order_id,
    razorpay_payment_id, razorpay_signature}` → updated Order.
- **State deps:** `useCartStore` (clears on success), navigates to
  `/order/[orderId]`.
- **Validation:** Auth required — if anonymous, present
  `AuthBottomSheet` (OTP flow inline).
- **Errors:**
  - Razorpay user cancel → return to checkout, no charge.
  - Razorpay failure → display reason from response, retry CTA.
  - Confirm endpoint failure → toast + "Contact support" link with
    order_id surfaced.
- **Loading:** Full-screen overlay with spinner during checkout call;
  Razorpay SDK presents its own UI.
- **Empty:** N/A.
- **A11y:** Razorpay screen is third-party; we surface a status banner
  before launch ("Opening secure payment…").
- **Analytics:** `checkout_initiated`, `payment_launched`,
  `payment_succeeded`, `payment_cancelled`, `payment_failed` with
  reason.
- **Acceptance:** Total reconciles to backend within ±0 paise. On
  payment success, user lands on `/order/[orderId]` within 600ms.

#### 4.1.10 Orders list
- **Web:** `frontend/passenger/src/app/orders/page.tsx`
- **Target RN:** `passenger/app/(tabs)/orders.tsx`
- **Purpose:** List user's orders, newest first.
- **API:** `GET /orders/my/?page_size=20` with cursor pagination if
  backend supports (else page=N).
- **State deps:** TanStack Query.
- **Validation:** N/A.
- **Errors:** Inline empty-state with retry on failure.
- **Loading:** Skeleton row × 5.
- **Empty:** "No orders yet — scan a bus QR to start."
- **A11y:** Each row labelled "Order from {restaurant}, {status},
  ₹{total}".
- **Analytics:** `orders_view`, `orders_row_tap`.
- **Acceptance:** Pull-to-refresh wired (`RefreshControl`).
  Infinite-scroll pagination at 80% list-end threshold.

#### 4.1.11 Live order tracking `[orderId]`
- **Web:** `frontend/passenger/src/app/order/[orderId]/page.tsx`
- **Target RN:** `passenger/app/order/[orderId].tsx`
- **Purpose:** Show order status timeline, ETA, restaurant info, live
  WS updates.
- **API:** `GET /orders/my/{id}/` initial; WebSocket `/ws/user/?token=…`
  pushes updates; backend message envelope per § 6.
- **State deps:** `useOrderTrackingStore`, TanStack Query cache for the
  order.
- **Validation:** N/A.
- **Errors:** Stale data → manual refresh button visible if WS
  disconnected > 30s.
- **Loading:** Skeleton timeline.
- **Empty:** N/A.
- **A11y:** Status changes announced via `AccessibilityInfo.announceForAccessibility`.
- **Analytics:** `order_track_view`, `order_status_change` (event from WS).
- **Acceptance:** WS event for this order's `order_id` updates the UI
  in ≤ 250ms. ConnectionBadge visible when degraded.

#### 4.1.12 Order complete `[orderId]/complete`
- **Web:** `frontend/passenger/src/app/order/[orderId]/complete/page.tsx`
- **Target RN:** `passenger/app/order/[orderId]/complete.tsx`
- **Purpose:** Celebration screen after PICKED_UP, prompt for review.
- **API:** none (uses cached order).
- **State deps:** N/A.
- **Validation:** N/A.
- **Errors:** N/A.
- **Loading:** N/A.
- **Empty:** N/A.
- **A11y:** Confetti animation respects `useReducedMotion`.
- **Analytics:** `order_complete_view`, `review_prompted`.
- **Acceptance:** Reaches in 250ms after WS PICKED_UP event from the
  tracking screen.

#### 4.1.13 Profile
- **Web:** `frontend/passenger/src/app/profile/page.tsx`
- **Target RN:** `passenger/app/(tabs)/profile.tsx`
- **Purpose:** Show user info, edit name/email, sign out, app version,
  open Privacy Policy URL.
- **API:** `GET /auth/me/`, `PATCH /auth/me/`,
  `POST /auth/logout/ {refresh}`.
- **State deps:** `@eta/auth` store; clears on logout.
- **Validation:** Email zod schema; name 1–80 chars.
- **Errors:** Inline field errors via React Hook Form.
- **Loading:** Save button spinner.
- **Empty:** N/A.
- **A11y:** Form fields with proper `accessibilityLabel` matching
  visible label.
- **Analytics:** `profile_view`, `profile_save`, `logout`.
- **Acceptance:** Logout clears tokens (SecureStore), zustand stores,
  TanStack Query cache, and routes to `/(auth)/login`.

#### 4.1.14 Scan invalid
- **Target RN:** `passenger/app/scan/invalid.tsx`
- **Purpose:** Communicate that the QR code couldn't be read or is
  expired; offer "Scan again".
- **Acceptance:** Single primary CTA back to `/(tabs)/scan`.

#### 4.1.15 Scan no-restaurant
- **Target RN:** `passenger/app/scan/no-restaurant.tsx`
- **Purpose:** Bus recognised but has no restaurant assigned for now;
  offer "Try another bus" + "Tell us".
- **Acceptance:** Captures `bus_id` to analytics for ops follow-up.

### 4.2 RESTAURANT app (8 screens)

#### 4.2.1 Login
- **Target RN:** `restaurant/app/(auth)/login.tsx`
- **Purpose:** OTP flow scoped to RESTAURANT_STAFF role.
- **API:** Same `/auth/otp/request/`, `/auth/otp/verify/`.
- **Validation:** After verify, reject with inline error if
  `user.role !== 'RESTAURANT_STAFF'` or no active restaurant
  membership. Possible reasons: `not_staff`, `no_restaurant`,
  `invalid_otp`.
- **Acceptance:** A passenger phone number cannot get into the
  restaurant app — the verify hook surfaces the rejection reason and
  clears tokens locally.

#### 4.2.2 Orders Kanban (live dashboard)
- **Web:** `frontend/restaurant/src/app/dashboard/page.tsx`
- **Target RN:** `restaurant/app/(dashboard)/orders.tsx`
- **Purpose:** Three swimlanes — NEW (PENDING+CONFIRMED), COOKING
  (PREPARING), READY — with drag-or-tap status advance.
- **API:**
  - `GET /orders/restaurant/?status=PENDING,CONFIRMED,PREPARING,READY` (initial).
  - `POST /orders/restaurant/{id}/advance/ {status, reason?}` (mutation).
  - WebSocket `/ws/restaurant/{restaurant_id}/?token=…` invalidates the
    list on `created` / status events.
- **State deps:** `useAuthStore.restaurantId`; TanStack Query.
- **Validation:** Client mirrors `ALLOWED_STATUS_TRANSITIONS` to grey
  out illegal advances and prevent accidental taps.
- **Errors:**
  - 409 invalid_transition → toast with allowed next states; refetch.
  - WebSocket drop → ConnectionBadge "Reconnecting" → exponential
    backoff (1s, 2s, 4s — max 3 attempts, then "Disconnected" with
    manual retry).
- **Loading:** Skeleton column with 2 placeholder cards.
- **Empty:** Per column: "Quiet for now — orders will appear here."
- **A11y:** Each card labelled "Order #{id-last-4}, {item count}
  items, {customer phone}, ₹{total}, status {STATUS}". Advance button
  has explicit accessibilityHint.
- **Analytics:** `kanban_view`, `order_advance` with from→to status,
  `ws_reconnect_attempt`, `ws_disconnected`.
- **Acceptance:**
  - New order → card appears in NEW column ≤ 500ms after WS event +
    audio chime + haptic.
  - Status advance roundtrip ≤ 800ms.
  - App stays live in foreground for at least 8 hours without crash
    (kitchen shift duration).

#### 4.2.3 Orders history
- **Target RN:** `restaurant/app/(dashboard)/orders-history.tsx`
- **Purpose:** Paginated list of finalised orders (PICKED_UP /
  CANCELLED) with date filter.
- **API:** `GET /orders/restaurant/?status=PICKED_UP,CANCELLED&page=N`.
- **Validation:** Date filter ≥ 30 days back.
- **Errors:** Standard list-error pattern.
- **Acceptance:** Filter persists across tab switches via URL params.

#### 4.2.4 Menu list
- **Web:** `frontend/restaurant/src/app/dashboard/menu/page.tsx`
- **Target RN:** `restaurant/app/(dashboard)/menu/index.tsx`
- **Purpose:** Categories + items, availability toggle, add CTA.
- **API:** `GET /restaurants/menu-categories/`,
  `GET /restaurants/menu-items/?restaurant=<id>`,
  `PATCH /restaurants/menu-items/{id}/` (availability).
- **Validation:** N/A.
- **Acceptance:** Toggle availability is optimistic; rolls back with
  toast on failure.

#### 4.2.5 Menu item — new / edit
- **Target RN:** `restaurant/app/(dashboard)/menu/new.tsx` and
  `[id].tsx`.
- **Purpose:** Create or edit a `MenuItem` (name, price, prep_time,
  category, photo, description, availability).
- **API:** `POST /restaurants/menu-items/`, `PATCH …/{id}/`.
- **Validation:** zod — name 1–80, price > 0, prep_time 1–120
  minutes, category required.
- **Errors:** Field errors surface inline; backend `details` map to
  fields.
- **Acceptance:** Photo picker via `expo-image-picker` with permission
  prompt. Image uploaded to S3 via signed URL endpoint
  (`OPEN — confirm or build the upload endpoint before phase 4`).

#### 4.2.6 Analytics
- **Web:** `frontend/restaurant/src/app/dashboard/analytics/page.tsx`
- **Target RN:** `restaurant/app/(dashboard)/analytics.tsx`
- **Purpose:** Today's revenue, top items, hourly chart.
- **API:** `OPEN — analytics endpoint contract not in current backend`
  — define before phase 5. Until then, derive client-side from today's
  orders.
- **Charts:** `victory-native` line chart for hourly pace,
  list for top items.
- **Acceptance:** Renders within 1.5s on a Pixel 4a.

#### 4.2.7 Profile
- **Target RN:** `restaurant/app/(dashboard)/profile.tsx`
- **Purpose:** Restaurant info (read-only), staff contact, sign out.
- **Acceptance:** Sign out clears scoped storage and routes to login.

#### 4.2.8 (Implicit) Connection status / sound toggle
- Not a screen but a layout-level overlay: ConnectionBadge top-right of
  every dashboard screen; sound toggle in TopBar to enable/disable
  new-order chime (persisted MMKV).

### 4.3 ADMIN app (9 screens)

All admin CRUD pages share the **List + EntitySheet (modal form)**
pattern (matching the web). Per the explore report: no pagination UI
currently (page_size=200/500 fetch-all), no bulk actions, no separate
detail pages.

#### 4.3.1 Login
- **Target RN:** `admin/app/(auth)/login.tsx`
- **Purpose:** OTP flow scoped to ADMIN role.
- **Validation:** Reject if `user.role !== 'ADMIN'`.
- **Acceptance:** Same as restaurant login pattern.

#### 4.3.2 Overview
- **Target RN:** `admin/app/(dashboard)/overview.tsx`
- **Purpose:** Four stat cards (active routes, active buses, active
  restaurants, today's orders).
- **API:** `OPEN — admin overview endpoint to build` — until then,
  derive from list endpoints with `count` field.
- **Acceptance:** All four cards render in ≤ 1.5s.

#### 4.3.3 Routes
- **Target RN:** `admin/app/(dashboard)/routes/index.tsx`
- **Purpose:** List, create, edit routes (origin / destination /
  distance_km / estimated_duration_min).
- **API:** `GET/POST /fleet/routes/`,
  `GET/PATCH /fleet/routes/{id}/`.
- **Validation:** zod — origin & destination 1–120 chars, distance > 0,
  duration ≥ 1.
- **Errors:** Standard form errors.
- **Acceptance:** Save / cancel from `EntitySheet` works as on web.

#### 4.3.4 Buses
- **Target RN:** `admin/app/(dashboard)/buses/index.tsx`
- **Purpose:** List buses; create/edit with operator + route + plate +
  capacity; show QR token; toggle is_active.
- **API:** `GET/POST /fleet/buses/`, `PATCH /fleet/buses/{id}/`.
- **Validation:** Plate format `^[A-Z]{2}\\d{1,2}[A-Z]{1,3}\\d{1,4}$`
  (India default; relax with `OPEN — confirm format with stakeholder`).
- **Acceptance:** "Show QR" reveals the token in a sheet with a "Copy
  to clipboard" button. v2 will render a QR image.

#### 4.3.5 Operators
- **Target RN:** `admin/app/(dashboard)/operators/index.tsx`
- **Purpose:** List, create, edit BusOperator companies.
- **API:** `GET/POST /fleet/operators/`,
  `PATCH /fleet/operators/{id}/`.
- **Validation:** Name 1–120, contact phone E.164.
- **Acceptance:** Same as routes.

#### 4.3.6 Restaurants
- **Target RN:** `admin/app/(dashboard)/restaurants/index.tsx`
- **Purpose:** List restaurants with FSSAI / location; create / edit.
- **API:** `GET/POST /restaurants/`, `PATCH /restaurants/{id}/`.
- **Validation:** FSSAI 14 digits; location lat/lng required.
- **Acceptance:** Lat/lng input via either map picker
  (`react-native-maps`) or two number inputs (v1 uses inputs to keep
  scope tight).

#### 4.3.7 Assignments
- **Target RN:** `admin/app/(dashboard)/assignments/index.tsx`
- **Purpose:** View bus → restaurant assignments; filter by active /
  inactive; search.
- **API:** `GET /fleet/assignments/?bus=…&restaurant=…&is_active=…`,
  `POST /restaurants/{id}/assign_restaurant/`.
- **Acceptance:** Filter persists across tab switches.

#### 4.3.8 Profile
- **Target RN:** `admin/app/(dashboard)/profile.tsx`
- **Purpose:** Edit admin name / email; sign out.

### 4.4 Cross-app screen behaviours (apply everywhere)

- **Pull-to-refresh** on all primary list screens via `RefreshControl`.
- **Skeletons over spinners** for first-paint loads (≤ 1s budget).
- **Spinners** only for action-bound loads (form submit, payment
  launch).
- **Toasts** for transient feedback (success / failure of a mutation),
  via `sonner-native`.
- **Bottom sheets** (`@gorhom/bottom-sheet`) for confirm dialogs and
  secondary forms; never iOS-style `Alert` for confirmations.
- **Errors with retry** for any failed network read.

---

## SECTION 5 — Auth, session, and security architecture

### 5.1 OTP flow (canonical, all roles)

1. **Phone collection** (UI): user enters E.164 phone (default +91 in
   India build).
2. **Request OTP**: `POST /auth/otp/request/ {phone_number}` → 200
   `{status: "sent"}`. Response is the same regardless of whether the
   phone exists (do not leak existence).
3. **Code entry** (UI): 6-digit numeric grid; auto-submit on 6th digit;
   resend disabled for 30s.
4. **Verify**: `POST /auth/otp/verify/ {phone_number, code}` → 200
   `{user, tokens: {access, refresh}}`.
5. **Role gate** (client):
   - Passenger app: accept any role; UX is the same.
   - Restaurant app: require `user.role === 'RESTAURANT_STAFF'` AND at
     least one active `Membership` with `org_type='restaurant'`.
   - Admin app: require `user.role === 'ADMIN'`.
   - On rejection, immediately discard tokens locally, show inline
     error explaining the role requirement, and surface a "Wrong app?
     Open ETA Eats" link to the passenger app store page.
6. **Token persistence**: see § 5.2.
7. **First navigation**: route to the app's main authed screen.

### 5.2 Secure token storage (RN)

| Token / value         | Storage mechanism                                         |
|-----------------------|-----------------------------------------------------------|
| `access` (JWT)        | `expo-secure-store` keychain item, key `eta.access.<app>` |
| `refresh` (JWT)       | `expo-secure-store` keychain item, key `eta.refresh.<app>` |
| FCM device token      | `expo-secure-store` (PII-adjacent), key `eta.fcm.<app>` |
| User profile          | MMKV (non-sensitive subset only — id, role, name, phone last 4) |
| Cart / journey state  | MMKV (non-sensitive)                                      |
| Sound prefs / UI flags| MMKV                                                      |

**SecureStore configuration:**
- iOS: `keychainAccessible = SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY`
  (no iCloud sync, no transferable backups).
- Android: `requireAuthentication = false` (we don't want to prompt
  biometrics on every read), `accessGroup` not set.
- Per-app key prefix prevents cross-app token collision when a single
  device has multiple ETA Eats apps installed.

`packages/auth/src/secureStorage.ts`:

```ts
import * as SecureStore from 'expo-secure-store';

const APP_PREFIX = process.env.EXPO_PUBLIC_APP_NAME ?? 'eta';

export const tokenStore = {
  async get() {
    const [a, r] = await Promise.all([
      SecureStore.getItemAsync(`${APP_PREFIX}.access`),
      SecureStore.getItemAsync(`${APP_PREFIX}.refresh`),
    ]);
    return a && r ? { access: a, refresh: r } : null;
  },
  async set(access: string, refresh: string) {
    await Promise.all([
      SecureStore.setItemAsync(`${APP_PREFIX}.access`, access, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
      SecureStore.setItemAsync(`${APP_PREFIX}.refresh`, refresh, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    ]);
  },
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(`${APP_PREFIX}.access`),
      SecureStore.deleteItemAsync(`${APP_PREFIX}.refresh`),
    ]);
  },
};
```

### 5.3 Refresh-token lifecycle

- On every API response with status 401 and the request's
  `original._retry !== true`:
  1. If a refresh is in flight, queue this request; resume with the new
     access on success.
  2. Otherwise, set `isRefreshing = true`, call
     `POST /auth/token/refresh/ {refresh}`, save the new access (and
     possibly new refresh — SimpleJWT can rotate), drain the queue, and
     retry the original request.
  3. If refresh fails: clear tokens, signal the auth store to log the
     user out, navigate to `/(auth)/login`.
- This is a **single-flight refresh**, identical to the web's pattern —
  port verbatim.
- On app start, hydrate the auth store from SecureStore. If only access
  exists or only refresh exists, treat as logged out and clear.
- On `AppState` transition `background → active`, eagerly refresh the
  access token if it expires within 60s (decode the JWT `exp` claim).

### 5.4 App lock / session expiry

- Passenger app: no biometric lock (consumer expectation). Token expiry
  is the only gate.
- Restaurant app: optional biometric on cold start
  (`expo-local-authentication`); off by default; enabled per-staff via
  Profile setting. Stored as MMKV flag.
- Admin app: biometric on cold start mandatory if hardware available;
  fall back to PIN entry of the admin's last-4 phone digits if hardware
  unavailable.
- Idle timeout: admin app auto-locks after 15 minutes in background;
  restaurant after 60 minutes (kitchens leave the app open). Passenger
  never auto-locks.

### 5.5 Transport / API hardening checklist

- [ ] HTTPS-only in staging and production. Reject HTTP responses (axios
      `validateStatus` rejects unencrypted URLs at the env layer).
- [ ] Public API base URL pinned to a single domain per env. Wildcard
      base URLs forbidden.
- [ ] Certificate pinning via `react-native-ssl-pinning` for production
      passenger + restaurant + admin.
      `OPEN — provide cert SPKI hashes before phase 7 (production)`.
- [ ] Razorpay keys are publishable keys only (`rzp_live_…` / `rzp_test_…`),
      never server-side secrets.
- [ ] FCM token rotates on app reinstall and is patched to backend via
      `PATCH /auth/me/`.
- [ ] WebSocket URL uses `wss://` in staging and production.
- [ ] App Transport Security (iOS) does not have arbitrary load
      exceptions in production builds.
- [ ] Android `network_security_config.xml` permits only HTTPS in
      production; cleartext is enabled only for the dev IP range.

### 5.6 Secure logging + PII redaction

- `packages/utils/src/logger.ts` provides `log.debug | info | warn |
  error` that:
  - Goes to console in dev.
  - Goes to Sentry breadcrumbs in staging + production.
  - Runs every payload through a PII redactor that masks: phone numbers
    (keeps last 4), emails (keeps domain), JWT tokens (replaces value
    with `<JWT redacted>`), Razorpay payment IDs (last 4 only),
    addresses, OTP codes (always fully redacted), and any key matching
    `/(token|password|otp|secret|key|signature)/i`.
- Sentry configured with `beforeSend` hook applying the same redactor
  defensively.
- Crash reports never include `useAuthStore` or `useCartStore` raw
  state — only counts and shapes.
- Network errors logged with URL and status only — never request /
  response body.

---

## SECTION 6 — Real-time and background behavior

### 6.1 WebSocket strategy

Backend channels (from `apps/notifications/routing.py`):
- `/ws/user/?token=<access>` — passenger receives notifications scoped
  to their own user (order events, in-app messages).
- `/ws/restaurant/<restaurant_id>/?token=<access>` — restaurant staff
  receives all order events for that restaurant.

**Wrapper API** — `packages/realtime/src/socket.ts`:

```ts
export type SocketState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface SocketOptions {
  url: () => string | null; // builder; returns null if cannot connect (no token)
  onMessage: (data: unknown) => void;
  onStateChange?: (state: SocketState) => void;
  enabled?: boolean;
  maxAttempts?: number; // default 5
  baseBackoffMs?: number; // default 1000
}

export function createSocket(opts: SocketOptions): { close: () => void; state: () => SocketState };
```

Behaviour:
1. On `connect()`: build URL via `opts.url()`. If null, set state
   `disconnected` and stop.
2. On `open`: state `connected`, reset `attempt` counter.
3. On `message`: `JSON.parse` defensively (try/catch). Pass to
   `onMessage` only if parse succeeded.
4. On `close`: inspect `event.code`.
   - 1000 (normal) → state `disconnected`, do not retry.
   - 4401 / 4403 (auth) → trigger token refresh; on success, retry
     once. On failure, log out.
   - Else → if `attempt < maxAttempts`, schedule retry with backoff
     `baseBackoffMs * 2^attempt + jitter`, state `reconnecting`. After
     `maxAttempts`, state `disconnected` with manual retry CTA.
5. On `error`: trigger close; reconnect logic handles it.

### 6.2 Reconnect / backoff policy

- Backoff sequence: 1s, 2s, 4s, 8s, 16s (max 5 attempts).
- Jitter ±20% to avoid thundering-herd reconnection.
- After max attempts, ConnectionBadge goes red ("Disconnected") and
  exposes a "Retry" button that resets the attempt counter.
- All HTTP queries the screen relies on are still working; WS is
  additive — UI must not depend on WS being live.

### 6.3 Foreground / background transitions

- `AppState` listener in `packages/realtime/src/lifecycle.ts`:
  - On `active`: open the relevant socket if a screen has subscribed.
  - On `background`: close the socket cleanly with code 1000 after a
    15s grace period (so brief switches don't churn).
  - On return to `active`: reopen.
- Restaurant app exception: keep socket open through background up to
  5 minutes (kitchen tablets hop apps occasionally).

### 6.4 Push notification strategy

- Library: `expo-notifications`.
- iOS: APNs via Expo's relay (production EAS uses `apns-topic` matching
  the production bundle id).
- Android: FCM directly, configured via `google-services.json` in
  `android/app/`.
- **Token registration:**
  1. On first app launch and on every login, request notification
     permission.
  2. Get the device token (`expo-notifications`
     `getDevicePushTokenAsync` for native FCM/APNs token).
  3. PATCH it to backend via `/auth/me/ {fcm_token}`.
  4. On logout, clear the token by patching `{fcm_token: null}`.
- **Payload routing:**
  - Backend sends `data: {order_id, event, status}` plus
    notification title/body. The client opens the right deep link on
    tap based on `event`:
    - Passenger: `etaeats://order/<order_id>`.
    - Restaurant: `etaeatskitchen://orders/<order_id>` (deep into
      Kanban with that card focused).
  - Foreground push: do not show OS notification — show a custom
    in-app toast and play the kitchen chime if restaurant app.
- **Per-channel categorisation (Android):**
  - `order_lifecycle` channel — high importance (heads-up).
  - `marketing` channel — low importance (off by default).
  - Customer in-app chat (future): default channel.

### 6.5 Event de-duplication & eventual consistency

- Every push payload includes a `notification.id` (UUID) where backend
  produced it. Client maintains a small in-memory ring buffer (last 50
  ids) and ignores duplicates that arrive within 60s.
- For order status changes, the WS event triggers
  `queryClient.invalidateQueries(['order', orderId])`; the source of
  truth becomes the next HTTP fetch — so a stale push can never
  permanently mis-render the UI.
- If WS and push deliver the same event, both update the same query
  cache; React Query's structural sharing makes this idempotent.
- Order status mutation results from the server overwrite local
  cached status in the same query — never trust the WS event over a
  fresh HTTP response.

---

## SECTION 7 — Performance and reliability standards

### 7.1 Performance budgets

| Metric                                  | Target on Pixel 4a (low-end Android) | Target on iPhone 12 |
|-----------------------------------------|--------------------------------------|---------------------|
| Cold start → first interactive          | ≤ 2.5s                               | ≤ 1.8s              |
| Warm start                              | ≤ 1.0s                               | ≤ 0.6s              |
| Navigation transition                   | ≤ 200ms                              | ≤ 150ms             |
| List scroll fps (orders, menu)          | ≥ 55                                 | ≥ 58                |
| WS event → UI update                    | ≤ 250ms                              | ≤ 200ms             |
| Memory steady state (foreground)        | ≤ 220 MB                             | ≤ 200 MB            |
| JS bundle (per app, post-Hermes)        | ≤ 4 MB                               | ≤ 4 MB              |
| App-store binary (per app, AAB / IPA)   | ≤ 60 MB                              | ≤ 80 MB             |

### 7.2 List rendering rules

- Use `FlatList` with `keyExtractor`, `getItemLayout` where item
  heights are known (orders list, kanban cards). Use `FlashList` from
  Shopify if `FlatList` underperforms (only after measurement).
- `removeClippedSubviews={true}` on Android.
- `windowSize=5`, `initialNumToRender=10`.
- Memoise row components with `React.memo`; row props must be stable.
- Skeletons render the same height as final content to avoid layout
  shift.

### 7.3 Image handling

- `expo-image` (not `Image`) for caching, content-aware placeholders,
  and faster decode.
- All remote images served via S3 with `Cache-Control: max-age=86400`
  (`OPEN — confirm S3 cache headers are set before phase 6`).
- Use `placeholder` prop with a base64 thumbnail or solid color from
  the design system.

### 7.4 Network optimization

- Axios global timeout 12s.
- Concurrent requests deduplicated by TanStack Query.
- Request batching not needed at v1 scale.
- Compression: backend serves gzip; axios accepts encoded responses.
- Avoid `JSON.stringify` of large objects on hot paths; rely on RN's
  built-in serialiser for fetch payloads.

### 7.5 Crash / error monitoring

- **Sentry** (`@sentry/react-native`) initialised in `_layout.tsx` of
  each app before any other provider.
- Source maps uploaded automatically by EAS Build via Sentry plugin.
- Release tag: `${appName}@${appVersion}+${buildNumber}`.
- DSN per app per environment (6 DSNs total):
  - passenger-staging, passenger-prod, restaurant-staging,
    restaurant-prod, admin-staging, admin-prod.
- `tracesSampleRate`: 0.10 in production, 1.0 in staging.
- `profilesSampleRate`: 0.05 in production.

### 7.6 Observability & alerting

- Sentry alerts:
  - Crash rate ≥ 0.5% over 24h → Slack #eta-mobile-alerts.
  - New error class with > 50 events / hour → page on-call.
- PostHog dashboards:
  - Funnel: scan → menu view → cart → checkout → payment_succeeded.
  - Funnel: login start → otp_requested → otp_verified.
  - Restaurant: orders received per hour, average advance latency.
- Custom metric: `ws_connection_duration_seconds` per restaurant
  device, surfaced via PostHog event sampled every 60s while
  connected.

### 7.7 Reliability invariants

- **Never crash the app on a malformed server response.** All API
  responses pass through Zod schemas in `packages/api-client/`. On
  parse failure, log to Sentry and return a typed `DomainError`
  (`code='schema_violation'`).
- **Never block the JS thread for > 16ms.** Heavy work
  (large list filtering, JSON parsing > 100kb) runs in a microtask via
  `InteractionManager.runAfterInteractions`.
- **Every screen has an error boundary** (root-level boundary in
  `_layout.tsx`; per-screen boundaries for screens with risky
  third-party components like Razorpay).

---

## SECTION 8 — QA and testing strategy

### 8.1 Test pyramid

| Layer                | Scope                                      | Tooling                       | Run frequency |
|----------------------|--------------------------------------------|-------------------------------|---------------|
| Unit                 | Pure functions, hooks, reducers, schemas   | Vitest + React Testing Library RN | Every commit (CI) |
| Component            | UI primitives in isolation                  | Vitest + RNTL + jest-expo     | Every commit  |
| Integration          | Multi-component flows with mocked API      | Vitest + MSW (HTTP mock)      | Every commit  |
| Contract             | Real API schemas vs client Zod schemas      | Pact-style or in-house schema diff | Nightly      |
| E2E                  | Real app on simulator/emulator             | Maestro                       | Per PR + nightly |
| Visual regression    | Screenshot diffs of design-system parity    | Loki (Storybook RN) or Maestro screenshots | Nightly |
| Manual smoke         | Pre-release on physical low-end device      | Tester checklist              | Pre-release   |

### 8.2 Unit + integration coverage targets

- `packages/utils/`: 100% line coverage.
- `packages/api-client/`: 100% on interceptors / refresh / errors;
  ≥ 80% on endpoint wrappers.
- `packages/auth/`: 100% on store, hooks, secureStorage.
- `packages/realtime/`: 100% on backoff logic, state transitions.
- App-level code: ≥ 60% line coverage gate; PRs failing gate require
  written justification.

### 8.3 Contract tests

- Each app's `tests/contracts/` directory contains a Vitest suite
  that, in nightly CI, hits the staging backend and validates
  responses against the client's Zod schemas.
- Failures block the next release until either the schema or the
  backend is reconciled.

### 8.4 Visual regression

- Storybook for React Native (`@storybook/react-native`) renders every
  primitive and every screen in 3 states (default / loading / error).
- Loki captures screenshots on iPhone 14 + Pixel 4a Android emulators.
- Nightly diff against `main` baseline; > 5px / 0.1% pixel delta blocks
  merges.

### 8.5 Device matrix (mandatory test set per release)

- **Android low-end:** Pixel 4a (Android 13), 4 GB RAM.
- **Android mid-range:** Samsung A14 (Android 14), 4 GB RAM.
- **iOS low-end:** iPhone SE 2nd gen (iOS 17).
- **iOS modern:** iPhone 14 (iOS 18).
- **iOS large:** iPhone 15 Pro Max (iOS 18) — for layout sanity.
- **Tablet:** iPad (10th gen) — restaurant app only must function in
  landscape; passenger / admin must not crash but layout is best-effort
  in v1.

### 8.6 Release gating checklist (PASS = all green)

- [ ] All unit + integration tests green on the target branch.
- [ ] Maestro E2E smoke (see § 8.7) green on iOS sim + Android
      emulator.
- [ ] Sentry release health from previous prod build: crash-free
      sessions ≥ 99.5%.
- [ ] Cold start measured on Pixel 4a within budget (§ 7.1).
- [ ] No "OPEN — RESOLVE BEFORE PHASE X" markers for the current phase
      remaining in `design.md`.
- [ ] Manual smoke checklist signed off by one human reviewer per app.
- [ ] App size delta vs previous release ≤ 10%.

### 8.7 Maestro E2E smoke flows (per app)

**Passenger:**
1. Cold start → splash → landing.
2. Phone entry → OTP request → verify (mock OTP `123456` in dev) →
   home.
3. Tap Scan → grant camera → simulate QR (Maestro inputText to
   manual-entry fallback) → menu loads.
4. Add 2 items to cart → cart screen → quantity adjust → checkout →
   Razorpay test mode → success → tracking screen.

**Restaurant:**
1. Login → role-gate accepts staff phone.
2. Kanban shows all four columns.
3. Inject WS message via test harness → new card appears + chime
   plays.
4. Advance order PENDING → CONFIRMED → PREPARING → READY → PICKED_UP.

**Admin:**
1. Login → role-gate accepts admin phone.
2. Open Routes → create new route → row appears in list.
3. Open Buses → edit existing → save → row reflects change.

---

## SECTION 9 — CI/CD and release engineering

### 9.1 Branch strategy

- `main` — protected; only fast-forward merges from PRs.
- `release/*` — created from `main` for each release candidate; only
  hotfixes merge in via cherry-pick.
- Feature branches: `feat/<scope>/<short-desc>`,
  `fix/<scope>/<short-desc>`. Scope is one of `passenger`, `restaurant`,
  `admin`, `packages-<name>`, or `ci`.
- PRs require: 1 human reviewer + 1 AI reviewer (`/ultrareview` invoked
  by author before merge).
- Squash merge is the only allowed merge style (clean linear history).

### 9.2 Environments

| Env         | API base                          | WS base                          | App identity                    |
|-------------|-----------------------------------|----------------------------------|---------------------------------|
| development | `http://<lan-ip>:8000`            | `ws://<lan-ip>:8000`             | `app.eta.<role>.dev`            |
| staging     | `https://stg-api.etaeats.app`     | `wss://stg-api.etaeats.app`      | `app.eta.<role>.staging`        |
| production  | `https://api.etaeats.app`         | `wss://api.etaeats.app`          | `app.eta.<role>` (passenger/kitchen/admin) |

### 9.3 Secrets handling

- All secrets in **EAS Secrets** scoped per-app per-env.
- `.env.<profile>` files contain only NON-secret config (URLs,
  feature flags). Committed to git only when sanitised.
- Razorpay key id is publishable; the secret never lives in the mobile
  app.
- Sentry DSN is publishable; rate-limited at Sentry side.
- FCM `google-services.json` and APNs `.p8` private keys live in EAS
  Secrets and are injected at build time.

### 9.4 Build pipelines

- EAS Build profiles (`<app>/eas.json`):
  ```json
  {
    "build": {
      "development": { "developmentClient": true, "distribution": "internal", "channel": "development" },
      "preview":     { "distribution": "internal", "channel": "staging" },
      "production":  { "channel": "production", "autoIncrement": "version" }
    },
    "submit": {
      "production": {
        "ios":     { "appleId": "ops@etaeats.app", "ascAppId": "<ASC_APP_ID>" },
        "android": { "serviceAccountKeyPath": "./eas-secrets/play-service-account.json", "track": "production", "releaseStatus": "draft" }
      }
    }
  }
  ```
- GitHub Actions trigger:
  - On PR: lint + typecheck + unit + integration.
  - On merge to `main`: build a `preview` artifact for each app,
    upload to Expo internal distribution, post Slack notification.
  - On `release/*` tag (`vX.Y.Z-passenger`, `-restaurant`, `-admin`):
    build production artifact, run Maestro on EAS hosted device, gate
    on green tests, then EAS Submit to App Store Connect (manual
    promote) and Play Console (draft).

### 9.5 Versioning

- Semver per app. `1.0.0` for first store release.
- `version` in `app.config.ts` is the user-visible version.
- iOS `buildNumber` and Android `versionCode` auto-incremented by EAS.
- Changelog generated by Conventional Commits parser; ships in store
  release notes for production.

### 9.6 Staged rollout / canary

- iOS App Store: phased release enabled (1% → 2% → 5% → 10% → 50% → 100%
  over 7 days).
- Play Store: staged rollout starting at 5% → 20% → 50% → 100% over
  72 hours, gated on Sentry crash-free sessions ≥ 99.5%.
- EAS Update OTA used for **non-native** fixes (JS-only) between
  binary releases. OTA bundles signed with code signing certificate
  per app.

### 9.7 Rollback playbook

| Failure mode                                  | Action                                                               |
|-----------------------------------------------|----------------------------------------------------------------------|
| Crash spike from latest OTA                   | EAS Update: republish previous bundle to the same channel within 5m. |
| Crash spike from latest binary                | iOS: halt phased release in App Store Connect.<br>Android: halt staged rollout in Play Console. Promote previous build to 100%. |
| Backend incident                              | Mobile shows "We're having trouble — please try again" via NetInfo + 5xx detection. No client rollback needed. |
| Razorpay outage                               | Disable checkout via remote feature flag (`OPEN — wire feature-flag service before phase 7`). Show "Payments temporarily unavailable" inline on checkout. |
| Compromised refresh token endpoint            | Force-rotate JWT signing key on backend (out of scope here). Mobile users see logout-on-401 and must re-OTP. |

### 9.8 Store submission readiness checklist

- [ ] App icon: 1024×1024, no transparency, RGB.
- [ ] iOS launch screen: matches splash from `expo-splash-screen`.
- [ ] App Store description, keywords, screenshots (5 sizes per app).
- [ ] Privacy Policy URL hosted at `https://etaeats.app/legal/privacy`.
- [ ] Apple App Privacy questionnaire filled (we collect: contact info
      [phone], identifiers [user id], purchases [order history]).
- [ ] Play Store data safety section filled identically.
- [ ] Razorpay payment compliance: in-app purchases (Apple) policy
      reviewed — physical food delivery is out of scope for IAP.
- [ ] Camera + Notifications + (passenger only) Location permission
      strings written in `app.config.ts`.
- [ ] Maturity rating: 4+ / Everyone (no objectionable content).

---

## SECTION 10 — Phased implementation roadmap

A phase is a 1-2 week unit. Each phase has milestones, dependencies,
risks, mitigations, deliverables, and a Definition of Done (DoD).

### Phase 0 — Foundation (week 1)

**Milestones:**
- pnpm workspace initialised at `frontendApps/`.
- Each app scaffolded with Expo SDK 52+ and TypeScript strict.
- Shared packages skeleton in place with empty exports.
- ESLint + Prettier + commitlint + Husky configured.
- GitHub Actions running lint + typecheck on PRs.

**Dependencies:** none.

**Risks:** Monorepo Metro setup is fragile.
**Mitigations:** Use the canonical Expo monorepo recipe (§ 2.2);
verify each app boots `pnpm --filter passenger dev` before declaring
done.

**Deliverables:**
- 3 Expo apps that boot to a "Hello {role}" screen.
- 7 shared packages with `index.ts` and `tsconfig.json`.
- CI green on `main`.

**DoD:**
- [ ] `pnpm install` completes from a clean clone.
- [ ] `pnpm --filter passenger dev` starts Metro + opens iOS sim.
- [ ] Same for restaurant + admin.
- [ ] CI typecheck + lint green.

**Parallelisable agents:** 1 agent on workspace + CI; 1 agent per
Expo app scaffold (3); 1 agent on package skeletons. 5 in parallel.

### Phase 1 — Design system + primitives (week 2)

**Milestones:**
- `packages/ui-tokens/` complete with all values from § 3.1.
- `packages/ui-components/` ships: Button, IconButton, Input, OTPInput,
  Card, Badge, Chip, Stepper, Spinner, EmptyState, SectionHeader,
  Skeleton, BottomSheet, ConnectionBadge, Toast wrapper.
- Storybook RN running locally per app.
- Visual regression baseline captured.

**Dependencies:** Phase 0.

**Risks:** Font licensing for Satoshi.
**Mitigations:** If Satoshi license blocked, ship Inter Variable as a
single-line swap in `typography.ts`. Document in
`docs/proposals/font-license.md`.

**Deliverables:**
- Token files exported and importable.
- 15 primitive components with stories.
- `THEME_PROVIDER` hooked into all 3 apps.
- Loki baseline images committed.

**DoD:**
- [ ] All token values match § 3.1 verbatim (snapshot test enforces).
- [ ] Storybook lists ≥ 15 components.
- [ ] Loki baseline captured for iOS + Android.
- [ ] Manual visual diff against passenger web design system passes
      stakeholder review.

**Parallelisable agents:** 1 agent per primitive (15+ in parallel).

### Phase 2 — API client + types + auth (week 3)

**Milestones:**
- `packages/api-client/` with axios + interceptors + refresh queue +
  error envelope parser.
- `packages/types/` with all backend domain types + ALLOWED_STATUS_TRANSITIONS.
- `packages/auth/` with secure storage, zustand store, hooks,
  per-role guards.
- All three apps gate on auth and route to a stub login screen.
- OTP request + verify wired end-to-end against staging backend.

**Dependencies:** Phase 1 (for primitives used by login screens).

**Risks:**
- SimpleJWT token refresh edge cases.
- Role gating ambiguity for users with multiple memberships.

**Mitigations:**
- Port the web's exact refresh-queue pattern verbatim; write unit tests
  for concurrent 401s.
- `packages/auth/src/guards.ts` exposes a single `useRequireRole`
  hook per app; reject path is logged to Sentry for ops review.

**Deliverables:**
- All 3 apps log in and persist sessions across cold starts.

**DoD:**
- [ ] Concurrent-refresh unit test green.
- [ ] Manual: kill app mid-session → reopen → still logged in.
- [ ] Wrong-role login shows the rejection screen.
- [ ] Logout clears SecureStore + zustand + TanStack cache.

**Parallelisable agents:** 1 on api-client, 1 on types, 1 on auth, 1
per app's login wiring (3). 6 in parallel.

### Phase 3 — Passenger MVP (weeks 4-5)

**Milestones:**
- All 15 passenger screens live (§ 4.1).
- Razorpay integration end-to-end (test mode).
- WebSocket live tracking on order screen.
- Pull-to-refresh and skeletons everywhere.

**Dependencies:** Phase 2.

**Risks:**
- Camera permission UX on Android.
- Razorpay native module config.

**Mitigations:**
- Always show a manual-entry fallback for QR.
- Follow `react-native-razorpay` setup exactly; build a sandbox app
  early in this phase to validate.

**Deliverables:** Passenger app installable from Expo internal
distribution, fully functional against staging.

**DoD:**
- [ ] Maestro passenger smoke (§ 8.7) green on iOS + Android.
- [ ] End-to-end test order placed and tracked through WS to PICKED_UP.
- [ ] Sentry crash-free in 4-hour soak on Pixel 4a.

**Parallelisable agents:** 1 per screen (15+); 1 on Razorpay; 1 on
WebSocket integration. 17+ in parallel.

### Phase 4 — Restaurant MVP (weeks 6-7)

**Milestones:**
- 7+ restaurant screens (§ 4.2).
- Live Kanban with WS event-driven invalidation.
- New-order chime + haptic.
- Menu CRUD with photo upload.

**Dependencies:** Phase 2; can start in parallel with Phase 3 if a
second team is available.

**Risks:**
- WS reconnect race with token refresh.
- Audio session on Android in background.

**Mitigations:**
- Refresh-then-reconnect path tested explicitly.
- Use `expo-av` `setAudioModeAsync` with `playsInSilentModeIOS=true`
  and `staysActiveInBackground=false`.

**Deliverables:** Restaurant app installable, fully functional in
kitchen-shift soak test (8 hours).

**DoD:**
- [ ] Maestro restaurant smoke green.
- [ ] 8-hour foreground soak: zero crashes, < 2% memory growth.
- [ ] Kitchen pilot at one restaurant: written sign-off from staff.

**Parallelisable agents:** 1 per screen; 1 on WS hook; 1 on chime /
audio. 10+ in parallel.

### Phase 5 — Admin MVP (week 8)

**Milestones:**
- 9 admin screens (§ 4.3).
- All CRUD via shared `EntitySheet` pattern.

**Dependencies:** Phase 2.

**Risks:** Less stakeholder testing means more chances of UX gaps.
**Mitigations:** Walkthrough with internal admin user before sign-off.

**Deliverables:** Admin app installable, fully functional.

**DoD:**
- [ ] Maestro admin smoke green.
- [ ] Internal admin user tests all 6 entity flows successfully.

**Parallelisable agents:** 1 per entity (6); 1 on overview; 1 on auth
wiring. 8 in parallel.

### Phase 6 — Polish + observability (week 9)

**Milestones:**
- Sentry integrated with PII-redacted logger.
- PostHog events wired per § 7.6.
- All accessibility audits passed (§ 3.3).
- Performance budgets verified (§ 7.1).
- Push notifications (FCM/APNs) live on all 3 apps.

**Dependencies:** Phases 3-5.

**Risks:** Push setup on iOS requires APNs key from Apple Developer.
**Mitigations:** Request APNs auth key in week 8 to overlap.

**Deliverables:** All 3 apps observable in production-equivalent
staging.

**DoD:**
- [ ] Sentry shows breadcrumbs for navigation, network, WS state.
- [ ] PostHog dashboard shows funnels populating.
- [ ] axe-style accessibility audit (manual): zero blockers.
- [ ] All performance budgets verified on Pixel 4a.
- [ ] Test push notification delivered to all 3 apps in staging.

**Parallelisable agents:** 1 on Sentry; 1 on PostHog; 1 on push (per
app: 3); 1 on a11y audit. 6 in parallel.

### Phase 7 — Production hardening + store submission (week 10)

**Milestones:**
- Certificate pinning enabled in production builds.
- All "OPEN — RESOLVE BEFORE PHASE 7" items closed.
- Store assets created (icons, splash, screenshots).
- Privacy + data safety questionnaires submitted.
- Production EAS submit run for each app.

**Dependencies:** Phase 6.

**Risks:** Apple App Review for Razorpay (food delivery, not IAP).
**Mitigations:** Reference precedent (Zomato, Swiggy use external
payments). Have a written rationale ready to upload with submission.

**Deliverables:** All 3 apps in store review queues.

**DoD:**
- [ ] Production builds signed and submitted.
- [ ] Privacy + data safety published.
- [ ] EAS Update channel `production` configured per app.
- [ ] Rollback playbook (§ 9.7) rehearsed (dry-run revert of an OTA).

**Parallelisable agents:** 1 per app on store assets (3); 1 on
pinning; 1 on submissions. 5 in parallel.

### Phase 8 — Launch + post-launch (week 11+)

**Milestones:**
- Phased rollout to 100%.
- Crash dashboards monitored daily for 14 days.
- Hotfix capacity reserved (no new feature work first 14 days).
- Retro and cleanup (remove dead code, archive unused packages).

**DoD:**
- [ ] Crash-free sessions ≥ 99.5% sustained 14 days.
- [ ] No P0 / P1 issues open.
- [ ] Roadmap for V2 features written.

### 10.1 Critical path

`Phase 0 → Phase 1 → Phase 2` is fully serial (each blocks the next).
Phases 3-5 can run in parallel with sufficient agent capacity. Phase 6
is partly parallelisable but waits on Phases 3-5 to be feature-complete.
Phase 7 cannot start until Phase 6 closes its DoD.

### 10.2 Risk hotspots (rank-ordered)

1. **Font licensing** — blocks Phase 1 visual fidelity.
2. **Razorpay native integration** — could slip Phase 3 by a week if
   the SDK has unexpected issues.
3. **WebSocket auth refresh race** — subtle bug, potentially flaky;
   needs explicit unit tests in Phase 2.
4. **Apple App Review for food + payments** — could slip Phase 7 store
   submission by 1-2 weeks.
5. **Cold-start time on low-end Android** — Hermes + tree-shaking is
   expected to hit budget, but verify early in Phase 3 with a real
   device.

---

## SECTION 11 — Code standards and best practices

### 11.1 File / module conventions

- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components.
- One default export per file for components; named exports for
  utilities and hooks.
- `index.ts` barrels are allowed only at package boundaries
  (`packages/<name>/src/index.ts`), never inside app code (avoid
  circular imports).
- Path alias per app: `@/*` → `./src/*`. Cross-package imports use the
  workspace name: `@eta/ui-tokens`, `@eta/auth`, etc.

### 11.2 Naming standards

- Hooks: `useThing`, returning `{ data, isLoading, error }` for
  queries or `[value, setter]` for state.
- Mutations: `useThingMutation`.
- Zustand stores: `useThingStore`. Always export the `Store` type.
- Components: `Thing` (PascalCase). Variants are props, not separate
  components.
- Constants: `SCREAMING_SNAKE_CASE` for module-level constants.
- Enums: prefer `as const` object + union type over TS `enum`.

### 11.3 Error envelope handling

- HTTP errors are caught in `packages/api-client/src/errors.ts` and
  rethrown as a typed `DomainError`:
  ```ts
  export class DomainError extends Error {
    constructor(
      public readonly code: string,
      message: string,
      public readonly details?: Record<string, unknown>,
      public readonly statusCode?: number,
    ) { super(message); }
  }
  ```
- Screens never read `error.response.data` directly. They `catch`
  `DomainError` and switch on `error.code`:
  ```ts
  catch (e) {
    if (e instanceof DomainError && e.code === 'restaurant_mismatch') {
      openSwitchRestaurantSheet();
    } else {
      toast.error('Something went wrong');
      log.error('addToCart failed', { code: (e as DomainError).code });
    }
  }
  ```
- Unknown errors are logged to Sentry via the logger and surfaced as
  the generic toast.

### 11.4 API typing & schema validation

- Every endpoint has:
  1. A TypeScript request type.
  2. A TypeScript response type.
  3. A Zod schema for the response, used in dev (full validation) and
     in production (sampled validation, log to Sentry on mismatch).
- Schemas live in `packages/api-client/src/endpoints/<domain>.ts`
  next to the request function.
- TanStack Query keys are tuples: `['orders', 'my', { status, page }]`.
  No string concatenation.

### 11.5 Reusable component rules

A component goes into `packages/ui-components/` only if:
1. ≥ 2 of the 3 apps use it.
2. It has zero domain logic (no API calls, no role checks).
3. Its API is theme-token-driven (variants, not hardcoded colors).
4. It is documented in a per-component README.

App-specific components stay in `<app>/src/components/`.

### 11.6 PR quality standards

PR description must include:
- **What & why** in one paragraph.
- **Screens / packages touched** as a checklist.
- **Risk** rating (low / medium / high) and what could break.
- **Test plan** as a checklist (unit / integration / Maestro / manual).
- **Screenshots** before/after for any UI change.

PR review checklist for the reviewer:
- [ ] Tokens used (no inline hex / spacing literals).
- [ ] No business logic in zustand stores.
- [ ] No new third-party libraries without an ADR in
      `docs/proposals/`.
- [ ] Error paths covered or explicitly justified.
- [ ] Accessibility props present on every Pressable / Touchable.
- [ ] Analytics events added if user-visible behaviour changed.
- [ ] No `console.log` left in code; use `log.*`.
- [ ] No `any` without `// eslint-disable-next-line ... -- reason`.
- [ ] If a public package was changed, all 3 apps still typecheck.

---

## SECTION 12 — Concrete first sprint plan

A **2-week sprint** to land Phases 0 and 1 with the highest possible
de-risking of the design-system parity question.

### Sprint goal

By end of Sprint 1:
1. The monorepo boots, all 3 apps render a "design system gallery"
   screen showing every primitive in every variant.
2. A stakeholder side-by-side comparison of the gallery vs the
   passenger web design system passes visual approval.
3. The auth scaffold (no API yet) routes from "logged out" to "logged
   in" via a stub login screen.

### Day-by-day plan

**Day 1 — Repository skeleton**
- Create `frontendApps/` (already done by this scaffold).
- Initialise pnpm workspace, `pnpm-workspace.yaml`,
  `tsconfig.base.json`, `.gitignore`, `.nvmrc`.
- Set up Husky + commitlint + lint-staged.
- Verify `pnpm install` + `pnpm typecheck` green from clean clone.

**Day 2 — Expo apps scaffolded**
- `pnpm dlx create-expo-app passenger -t expo-template-blank-typescript`
  (and same for restaurant, admin).
- Configure each app's `metro.config.js` for the monorepo (§ 2.2).
- Each app boots to "Hello {role}" on iOS sim and Android emulator.

**Day 3 — Shared packages skeleton + CI**
- Create the 7 packages with `package.json`, `tsconfig.json`, empty
  `src/index.ts`.
- Add GitHub Actions workflow: lint + typecheck on PR.
- Verify CI green on a no-op PR.

**Day 4 — Tokens (colors, spacing, radius)**
- Implement `packages/ui-tokens/src/{colors,spacing,radius}.ts` with
  exact values from § 3.1.
- Add a snapshot test that fails if values drift from § 3.1.

**Day 5 — Tokens (typography, shadow, motion) + theme**
- Implement remaining token files.
- Add `theme.ts` barrel and `ThemeProvider`.
- Wire `ThemeProvider` into all 3 app `_layout.tsx`.

**Day 6 — Font loading + first 3 primitives**
- Acquire Satoshi-Variable font file (or fallback to Inter Variable
  if license unavailable — record decision in
  `docs/proposals/font-license.md`).
- Implement font load gate in `_layout.tsx`.
- Implement Button, Input, Card primitives with all variants.

**Day 7 — Primitives continued**
- Implement IconButton, Badge, Chip, Stepper, Spinner.
- Each component has props validated and documented in its README.

**Day 8 — Primitives finished**
- Implement EmptyState, SectionHeader, Skeleton, BottomSheet,
  ConnectionBadge, Toast wrapper, OTPInput.

**Day 9 — Design-system gallery screens**
- Create `<app>/app/_dev/gallery.tsx` in each app rendering every
  primitive in every variant.
- Side-by-side review with the passenger web design system; capture
  diffs and fix.

**Day 10 — Auth scaffold (no API)**
- Implement `packages/auth/` zustand store + secure storage + hooks
  (with a stub `verifyOTP` that always succeeds for any code in dev).
- Each app's `(auth)/login.tsx` collects phone, navigates to
  `(auth)/otp.tsx`, which routes to home on stub success.
- Verify cold-start hydration works.

**Day 11 — API client skeleton + types**
- Implement axios instance + interceptors + refresh queue (using stub
  refresh endpoint).
- Implement Zod schemas for `User`, `Order`, `OrderStatus`,
  `Restaurant`, `MenuItem` in `packages/types/`.
- Wire one real endpoint: `GET /auth/me/` against staging backend.

**Day 12 — Real OTP flow end-to-end**
- Replace stub `verifyOTP` with real `/auth/otp/request/` +
  `/auth/otp/verify/` calls.
- Test in all 3 apps against staging.
- Implement role-gating per app.

**Day 13 — Stabilise**
- Bug bash on the gallery + auth flow.
- Performance check: cold start on Pixel 4a measured.
- Set up Sentry in staging for all 3 apps (smoke).

**Day 14 — Sprint review + handoff**
- Demo: 3 apps booting, design system gallery rendering, OTP flow
  working end-to-end.
- Update `design.md` with any decisions made during the sprint.
- Plan Sprint 2 (Phase 3 — passenger MVP).

### Do first / Do later / Avoid now

**Do first:**
- Monorepo + Expo scaffolding (everything else depends on it).
- Design tokens (every component needs them).
- Auth scaffold (every screen is gated by it).
- Visual gallery (de-risks the entire design parity question early).

**Do later:**
- Storybook RN + Loki visual regression (Phase 1 / Phase 6).
- Push notifications (Phase 6 — needs APNs key).
- Certificate pinning (Phase 7).
- Dark mode (post-launch).
- Tablet layouts beyond restaurant landscape (post-launch).

**Avoid now:**
- Adding NativeWind, styled-components, Tamagui, NativeBase, or any
  styling system other than `StyleSheet` + theme tokens. Reason: every
  one of these has a learning curve and a runtime cost we don't need.
- Writing a custom WebSocket library. The wrapper in
  `packages/realtime/` is < 200 lines and handles everything we need.
- Building a deep notification UI (in-app inbox UX). v1 ships with
  toasts only; the inbox is a v2 feature.
- Building offline-first cart sync. v1 keeps cart in MMKV and retries
  on reconnect — that's enough.
- Building i18n. v1 ships English-only. Layout must accommodate longer
  strings (test prop `accessibilityLabel="…long string…"` to verify),
  but actual translations are deferred.
- Building a feature-flag service. v1 uses build-time env flags. v2
  introduces a runtime service if needed.

---

**Document status:** v1, 2026-05-02. Authored from a full read of the
existing web frontends and the Django backend. Resume from § 10 phase
DoD list to pick up work.

**Open items to resolve before the noted phase:**
- `OPEN — Confirm S3 cache headers for menu images` — Phase 6.
- `OPEN — Resolve Satoshi font license vs Inter fallback` — Phase 1.
- `OPEN — Provide cert SPKI hashes for pinning` — Phase 7.
- `OPEN — Build / confirm signed-URL upload endpoint for menu photos` — Phase 4.
- `OPEN — Define analytics endpoint contract` — Phase 5 (restaurant analytics).
- `OPEN — Define admin overview endpoint contract` — Phase 5 (admin overview).
- `OPEN — Confirm Indian plate format regex with stakeholder` — Phase 5.
- `OPEN — Wire feature-flag service for kill-switches` — Phase 7 (rollback playbook).
- `OPEN — Apple Developer team ID + App Store Connect ASC App IDs per app` — Phase 0 / Phase 7.
- `OPEN — Google Play Console service-account JSON per app` — Phase 0 / Phase 7.

---

## APPENDIX A — Multi-app deployment from one monorepo (proof)

> **Purpose:** Lock down the proof that 3 separate App Store and Play
> Store apps can be shipped from a single pnpm workspace. Future
> agents reading this document should NOT re-debate the architecture.
> If a stakeholder asks "are you sure we can deploy 3 apps from a
> monorepo?", point them at this appendix.

### A.1 What Apple and Google actually see

A submission to either store is a **single signed binary** plus
metadata. Apple sees a `.ipa`. Google sees an `.aab`. Neither store
inspects, cares about, or rejects based on your source repository
layout. The store sees:

- A **bundle identifier** (e.g. `app.etaeats.passenger`).
- A **signing certificate** (Apple Distribution / Play App Signing).
- A **version + build number**.
- The compiled JavaScript + native code in the binary.
- Store metadata you upload separately (App Store Connect / Play
  Console listing).

The monorepo is invisible. From Apple's perspective, our 3 apps look
identical to 3 apps from 3 separate companies. From a user's
perspective, they install 3 distinct apps with 3 distinct icons that
do not share code or storage at runtime.

### A.2 Why this works specifically for Expo

EAS Build officially supports the monorepo workflow
(`https://docs.expo.dev/guides/monorepos/`). The build pipeline:

1. EAS Build clones the monorepo.
2. Runs `pnpm install` at the workspace root.
3. Changes directory into the target app (`passenger/`).
4. Runs `eas build` with that app's `app.config.ts` and `eas.json`.
5. Metro bundles the app's code **plus its workspace dependencies**
   into a single self-contained JS bundle.
6. The bundle is compiled and packaged into a `.ipa` / `.aab` signed
   with that app's certificate.
7. EAS Submit pushes the artifact to the matching App Store Connect /
   Play Console entry.

There is **no shared dependency at runtime**. Each app's bundle is
self-contained. Updating `@eta/ui-tokens` requires re-building each
app to pick up the change — exactly like updating a third-party npm
package.

### A.3 Per-app store identity (locked)

These identifiers are committed; do not invent new ones without
updating this table.

| Concern                  | Passenger                          | Restaurant                         | Admin                              |
|--------------------------|------------------------------------|------------------------------------|------------------------------------|
| Workspace folder         | `passenger/`                       | `restaurant/`                      | `admin/`                           |
| Display name (iOS)       | "ETA Eats"                         | "ETA Eats Kitchen"                 | "ETA Eats Admin"                   |
| Display name (Android)   | "ETA Eats"                         | "ETA Eats Kitchen"                 | "ETA Eats Admin"                   |
| iOS bundle id            | `app.etaeats.passenger`            | `app.etaeats.kitchen`              | `app.etaeats.admin`                |
| Android applicationId    | `app.etaeats.passenger`            | `app.etaeats.kitchen`              | `app.etaeats.admin`                |
| Custom URL scheme        | `etaeats://`                       | `etaeatskitchen://`                | `etaeatsadmin://`                  |
| App Store Connect record | "ETA Eats" (consumer)              | "ETA Eats Kitchen"                 | "ETA Eats Admin"                   |
| Play Console record      | "ETA Eats"                         | "ETA Eats Kitchen"                 | "ETA Eats Admin"                   |
| App Store category       | Food & Drink                       | Business                           | Business                           |
| Distribution             | Public, India region               | Public, India region (or internal) | Internal track only (Play) / TestFlight (App Store) |
| Maturity / age rating    | 4+ / Everyone                      | 4+ / Everyone                      | 4+ / Everyone                      |
| Apple Team ID            | OPEN — fill before Phase 0 closes  | (same Apple Developer account)     | (same)                             |
| ASC App ID               | OPEN — provision in Phase 7        | OPEN — provision in Phase 7        | OPEN — provision in Phase 7        |
| Play Console package     | OPEN — provision in Phase 7        | OPEN — provision in Phase 7        | OPEN — provision in Phase 7        |
| EAS Project ID           | OPEN — created at Phase 0 first build | OPEN — same                     | OPEN — same                        |
| EAS Update channel       | `production` / `staging` / `development` | (same naming, separate namespace) | (same)                          |
| Sentry DSN (prod)        | OPEN — Phase 6                     | OPEN — Phase 6                     | OPEN — Phase 6                     |
| FCM project              | shared `eta-eats-prod` project     | shared `eta-eats-prod` project     | shared `eta-eats-prod` project     |
| FCM Android app entry    | one per applicationId              | one per applicationId              | one per applicationId              |
| APNs auth key (.p8)      | one shared `.p8` (per Apple Dev account) — auto-discovers all bundle IDs | (same .p8) | (same .p8) |
| Razorpay key id          | `rzp_live_…`                       | n/a (no payments)                  | n/a (no payments)                  |

### A.4 Signing strategy

**iOS:**
- One Apple Developer Program account (Organization tier, $99/yr).
- One Distribution certificate, shared across all 3 apps via EAS
  managed credentials.
- Three App IDs (one per bundle id), each provisioned with
  Push Notifications + Sign In With Apple capabilities.
- EAS Submit handles upload to each ASC record using the same Apple
  ID + app-specific password (or App Store Connect API key — preferred).

**Android:**
- One Google Play Developer account ($25 one-time).
- **Three Play Console apps** (one per applicationId).
- **Play App Signing enabled per app** (Google holds the upload key
  signing certificate; we keep the upload keystore).
- One Play Console service account JSON, granted access to all 3
  apps; used by EAS Submit to push releases.

**No shared keystore between Android apps.** Each app has its own
upload key managed by EAS. Compromise of one keystore does not affect
the other apps.

### A.5 Push notifications across 3 apps

- **APNs:** A single `.p8` auth key from Apple is sufficient for all
  3 bundle IDs in the same Apple Developer team. Stored as an EAS
  Secret. Backend's FCM-via-APNs integration uses the same key for
  routing.
- **FCM:** One Firebase project (`eta-eats-prod`) with three Android
  app registrations (one per applicationId). Each app's
  `google-services.json` is downloaded from Firebase and committed
  per-app at `<app>/google-services.json` (non-secret — these are
  publishable client config files).
- **Backend routing:** Backend's `notifications.services.push_to_user`
  sends to the user's `fcm_token`. The token is registered per-device
  with the bundle id baked in by FCM, so the right app receives the
  right push automatically. No backend changes needed to support 3
  apps.

### A.6 Independent release cadence (the actual benefit)

| Scenario                                          | What happens                                                                 |
|---------------------------------------------------|------------------------------------------------------------------------------|
| Passenger needs a marketing-driven feature        | Bump passenger version, build, submit. Restaurant + admin untouched.         |
| Restaurant has a Kanban bug at 2pm                | EAS Update: republish JS-only fix to restaurant `production` channel. Live in 5 minutes. Passenger + admin: zero risk. |
| Admin needs a new CRUD entity                     | Bump admin version, build, submit to internal track only. Public users never see it. |
| Apple rejects passenger app's payment description | Iterate on passenger metadata + resubmit. Restaurant + admin keep shipping.  |
| Shared `@eta/ui-tokens` color tweak               | Update tokens, rebuild all 3 apps, ship together at the next coordinated release. |
| Restaurant needs a native module passenger doesn't | Add it to `restaurant/package.json` only. Passenger's binary stays slim.    |

### A.7 Code-side safety guarantees

- Each app's `metro.config.js` only resolves `node_modules/` from the
  workspace root + its own folder. It cannot accidentally import code
  from a sibling app folder. (See § 2.2 for the exact config.)
- A lint rule (`eslint-plugin-import` `no-restricted-paths`) forbids
  any `import` from `passenger/`, `restaurant/`, or `admin/` to a
  sibling app folder. Cross-app imports are a CI-blocking error.
- Shared packages cannot import from any app folder either — the
  dependency graph only flows app → packages, never app → app or
  package → app.

### A.8 Migration off the monorepo (just in case)

If we ever decide a single app needs its own repo (it will not), the
extraction is mechanical:

1. Copy that app's folder to a new repo.
2. Replace `@eta/*` workspace references with published npm packages
   (publish the shared packages to a private npm registry first) or
   inline them.
3. Adjust `metro.config.js` to drop the monorepo paths.
4. Continue shipping. Bundle ID, Play Console / ASC entry, and EAS
   project all stay the same — the store sees zero change.

This is a 1-day exit cost, not a multi-week migration. The hybrid
monorepo is therefore **not a one-way door**. Choosing it now does
not lock us in.

### A.9 Verification checklist (close in Phase 0)

Before declaring Phase 0 done, confirm each of these:

- [ ] `pnpm --filter passenger exec eas build --platform ios --profile preview --non-interactive --no-wait` succeeds for each of the 3 apps.
- [ ] Each successful build appears as a separate artifact in the EAS dashboard with the correct bundle id.
- [ ] Each app installs on a device side-by-side (3 distinct icons on the home screen).
- [ ] Each app's bundle is independent — confirmed by inspecting `npx expo export` output per app.
- [ ] Lint rule blocks an attempted `import` from `passenger/src/...` inside `restaurant/src/...`.

If all five pass, the multi-app deployment story is proven end-to-end
and we never have to ask this question again.
