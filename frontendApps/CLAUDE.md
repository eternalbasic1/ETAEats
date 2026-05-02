# frontendApps — React Native Migration Workspace

> **You are reading this because you're an AI agent (Claude or otherwise) or
> a new engineer who needs to understand what `frontendApps/` is, why it
> exists, and how to safely contribute. Read this file FIRST, then read
> `design.md` next to it for the full migration blueprint.**

---

## What this folder is

`frontendApps/` is the **React Native (Expo)** mobile workspace for ETA Eats.
It is the mobile counterpart to the existing Next.js web frontends in
`../frontend/`. We are migrating the three web apps —
**passenger / restaurant / admin** — to native iOS + Android using a
**hybrid monorepo** pattern (3 separate apps + shared core packages).

Web frontends in `../frontend/` are NOT being deleted. They continue to
serve the web (passenger PWA, restaurant kiosk web fallback, admin desktop
console). The mobile apps consume the **same Django REST + Channels backend**
at `../backend/` and must remain protocol-compatible at all times.

## Workspace location

```
ETA-Eats-v2/
├── backend/                  ← Django + DRF + Channels (unchanged)
├── frontend/                 ← Next.js 14 web apps (passenger / restaurant / admin)
├── frontendApps/             ← YOU ARE HERE — React Native mobile apps
│   ├── CLAUDE.md             ← this file
│   ├── design.md             ← full 12-section migration blueprint
│   ├── passenger/            ← Expo app (PASSENGER role)
│   ├── restaurant/           ← Expo app (RESTAURANT_STAFF role)
│   ├── admin/                ← Expo app (ADMIN / BUS_OPERATOR role)
│   ├── packages/             ← shared workspace packages
│   │   ├── ui-tokens/        ← design tokens (colors, spacing, radius, shadow, typography, motion)
│   │   ├── ui-components/    ← cross-app primitives (Button, Input, Card, Badge, Chip, OTPInput, etc.)
│   │   ├── api-client/       ← Axios instance, JWT interceptor, refresh-queue, error envelope parser
│   │   ├── auth/             ← OTP request/verify hooks, secure token storage, session lifecycle
│   │   ├── realtime/         ← WebSocket hook with reconnect, ping, foreground/background gating
│   │   ├── types/            ← shared API types (User, Order, Restaurant, MenuItem, Notification, etc.)
│   │   └── utils/            ← currency, date, phone, errors, logger
│   └── docs/                 ← per-screen specs, API contracts, architecture diagrams
└── CLAUDE.md (workspace root)
```

## Architecture decision (final)

**Option C — Hybrid: shared core packages + 3 separate Expo apps.**

Why this won over a super-app and over 3 fully-isolated apps:

| Factor                | A: Super-app | B: 3 isolated apps | C: Hybrid (chosen) |
|-----------------------|--------------|---------------------|---------------------|
| App Store identity    | Confusing    | Clean per role      | Clean per role      |
| Bundle size           | Heavy (3 roles in 1) | Smallest per app | Small per app       |
| Code reuse            | High         | Low (drift risk)    | High (via packages) |
| Independent release   | Hard         | Easy                | Easy                |
| Role isolation / RBAC | Runtime risk | Strong              | Strong              |
| Onboarding agents     | Cognitive load high | Duplication burden | Bounded surface per app |

The passenger app is consumer-facing (App Store + Play Store, public).
The restaurant app is staff-facing (often sideloaded or via internal track).
The admin app is operator-facing (often kept on internal/test tracks).
Their release cadences, store metadata, push channels, and risk profiles
all differ — three binaries is the right shape. Shared packages prevent
divergence of the things that **must** stay identical: design tokens,
auth contract, error envelope, real-time protocol.

See `design.md` § 1 and § 2 for the full trade-off matrix.

> **Store deployment is NOT a concern.** The hybrid monorepo ships as
> three completely separate App Store and Play Store apps — different
> bundle IDs, different signing certificates, different store records,
> different release cadences. Apple and Google never see the monorepo;
> they only see the 3 final binaries. EAS Build officially supports
> this pattern. **Do not re-debate this.** See `design.md` Appendix A
> for the full deployment proof, the locked bundle IDs per app, the
> signing strategy, and the 1-day exit cost if we ever needed to split
> the repo.

## Non-negotiable constraints

These are hard rules. Violating them creates production bugs.

1. **The passenger app's design system is the canonical source of truth
   for ALL three mobile apps.** Do NOT invent a new palette, typography
   scale, or radius system per app. Tokens live in
   `packages/ui-tokens/` and the colors `#F5F5F2`, `#0D0D0D`, `#DDEAF3`,
   `#FFF7E8`, `#FFD7C2`, `#EAF4EA` are reproduced **exactly** as listed
   in `design.md` § 3.
2. **Font stack:** `Satoshi → General Sans → Neue Montreal → Inter →
   System`. Loaded via `expo-font` from local `.otf` assets — see
   `design.md` § 3 for the loading recipe. Never substitute Roboto or
   SF Pro.
3. **One `User`, one `OTPCode`, one role enum.** This mirrors the
   backend's non-negotiables in `../CLAUDE.md`. Role flows live in
   `packages/auth/`, never inlined per app.
4. **Error envelope is `{"error": {"code", "message", "details"}}`.**
   `packages/api-client/` parses this into a typed `DomainError` class.
   UI code never reads `error.response.data.detail` directly.
5. **Token storage uses platform-secure storage (Keychain on iOS,
   Keystore-backed `EncryptedSharedPreferences` on Android).** Never
   AsyncStorage for tokens. See `design.md` § 5.
6. **`Order.status` is read-only on the client.** Mutations go through
   the backend's `advance_status` endpoint (`POST /orders/restaurant/{id}/advance/`).
   The client UI must mirror `ALLOWED_STATUS_TRANSITIONS` from
   `apps/orders/models.py` — duplicate the map in `packages/types/order.ts`
   and fail-fast in the UI.
7. **WebSocket auth uses the access token in the query string** —
   `ws://host/ws/restaurant/{id}/?token=<access>`. When 401/403 close
   codes are returned (4401, 4403), do NOT retry; trigger refresh and
   reconnect once.
8. **Cart is single-restaurant.** The backend raises `restaurant_mismatch`
   if a passenger adds an item from a different restaurant. The mobile
   client must show the bottom-sheet "switch restaurant?" dialog — do
   not silently swap.

## Tech stack (locked)

| Concern              | Choice                                          | Reason |
|----------------------|-------------------------------------------------|--------|
| Runtime              | React Native 0.76+ via Expo SDK 52+             | OTA updates, dev ergonomics, EAS build |
| Language             | TypeScript 5.5+ strict                          | Backend types are strict; client must match |
| Navigation           | Expo Router (file-based, typed routes)          | Mirrors Next.js app router mental model |
| State (client)       | Zustand 4.5+                                    | Direct port from web; persist via MMKV |
| State (server)       | TanStack Query v5                               | Direct port; cache + retries + invalidation |
| Forms                | React Hook Form + Zod                           | Direct port; works in RN unchanged |
| HTTP                 | Axios 1.7+                                      | Direct port; same interceptor logic |
| Real-time            | Native `WebSocket` (no socket.io)               | Backend uses Django Channels JSON protocol |
| Secure storage       | `expo-secure-store` (Keychain / Keystore)       | Tokens, refresh, FCM token |
| KV storage           | `react-native-mmkv`                             | 30× faster than AsyncStorage; zustand persist |
| Animations           | `react-native-reanimated` v3                    | Replaces framer-motion; 60fps on UI thread |
| Icons                | `lucide-react-native`                           | Direct match to web's `lucide-react` |
| Toasts               | `sonner-native` (or `burnt`)                    | Match web's `sonner` API |
| Push                 | `expo-notifications` + FCM (Android) / APNs (iOS) | Backend already issues FCM payloads |
| Charts (restaurant)  | `victory-native` v40+                           | Replaces web `recharts` for analytics |
| Camera (passenger)   | `expo-camera` for QR scan                       | Replaces web QR scanner |
| Payments             | `react-native-razorpay`                         | Native Razorpay checkout |
| Maps (passenger)     | `react-native-maps`                             | Live bus tracking, restaurant pin |
| Crash / errors       | Sentry (`@sentry/react-native`)                 | Source-mapped stack traces |
| Analytics            | PostHog (`posthog-react-native`)                | Already used or planned for web |
| CI/CD                | EAS Build + EAS Submit + EAS Update             | Native binaries + OTA in one pipeline |
| Testing              | Vitest (logic) + Maestro (E2E)                  | Maestro is RN-friendly; faster than Detox |

## How to work in this folder

### If you're an AI agent resuming work

1. **Read this file fully.**
2. **Read `design.md`** — it has the full screen-by-screen migration map,
   token tables, and phased roadmap.
3. **Read the per-app `CLAUDE.md`** in the app you're editing
   (`passenger/CLAUDE.md`, `restaurant/CLAUDE.md`, `admin/CLAUDE.md`).
4. **Look at the corresponding web frontend** in
   `../frontend/<app>/src/` — it is the behavioural reference. The mobile
   port must match its flows 1:1 unless explicitly noted in `design.md`.
5. **Cross-check API contracts** with the Django app's `urls.py` /
   `serializers.py` before writing client code. Do not invent endpoints.
6. **Use `TaskCreate` to track progress** on multi-step work. Mark
   `in_progress` before you start and `completed` immediately after.

### Common tasks

- **Add a new screen** → create the route file in
  `<app>/app/<route>.tsx`, wire the navigation stack in
  `<app>/app/_layout.tsx`, and put data fetching in a TanStack Query hook
  in `<app>/src/queries/`.
- **Add a new shared primitive** → put it in `packages/ui-components/`
  with a story-style example in its directory's `README.md`. Re-export
  from `packages/ui-components/index.ts`.
- **Change the design system** → update `packages/ui-tokens/` only.
  Never inline a hex value in app code; reference a token. Update
  `design.md` § 3 in the same PR.
- **Add an API call** → add the endpoint typing to
  `packages/types/<domain>.ts`, the request function to
  `packages/api-client/<domain>.ts`, and a TanStack Query hook in the
  consuming app.
- **Touch the order state machine** → update
  `packages/types/order.ts::ALLOWED_STATUS_TRANSITIONS` and confirm it
  matches `backend/apps/orders/models.py`. Fail loudly if they diverge.

### What NOT to do

- **Don't re-implement the web frontends from memory.** Always read
  `../frontend/<app>/src/` first.
- **Don't add per-app design tokens.** All visuals come from
  `packages/ui-tokens/`.
- **Don't store JWTs in AsyncStorage or MMKV.** Always
  `expo-secure-store`.
- **Don't add new color palettes, gradients, or "branding" that wasn't
  in the passenger web design system.** The product voice is "soft
  luxury / quiet premium" — see `design.md` § 3.
- **Don't add socket.io, GraphQL, Apollo, Redux, MobX, Recoil,
  styled-components, NativeBase, React Native Paper, React Native
  Elements,** or any other library that conflicts with the locked stack.
  If you genuinely need one, propose it in `docs/proposals/` first.
- **Don't bypass `packages/api-client/`.** Inline `fetch()` or `axios`
  calls in screens are forbidden — they skip the refresh interceptor.
- **Don't ship without crash reporting.** Sentry must be initialised
  before the first navigation event.

## Resuming with a fresh model (continuity protocol)

If you (the model) are starting a session with no memory of prior work:

1. Read this file (`frontendApps/CLAUDE.md`).
2. Read `frontendApps/design.md` end-to-end.
3. Read `../CLAUDE.md` (workspace root) and `../ETA-Eats-v2/CLAUDE.md`
   (backend conventions).
4. Run `git log --oneline -30 -- frontendApps/` to see what was already
   done.
5. Run `ls -la frontendApps/passenger/ frontendApps/restaurant/
   frontendApps/admin/ frontendApps/packages/` to see what exists.
6. Read the per-app `CLAUDE.md` for the app you're working on.
7. Pick up from the next unchecked item in
   `design.md § 10 (Phased roadmap)`.
8. Never claim "done" without reading the **Definition of Done** for
   that phase in `design.md § 10`.

## Authority hierarchy

When sources conflict, follow this order (highest → lowest):

1. The user's explicit current message.
2. `../CLAUDE.md` (workspace root).
3. `../ETA-Eats-v2/CLAUDE.md` (backend conventions).
4. This file (`frontendApps/CLAUDE.md`).
5. `frontendApps/design.md`.
6. Per-app `CLAUDE.md`.
7. The behaviour of the existing web frontend.
8. The behaviour of the backend (always source-of-truth for API shape).

Backend wins ties on protocol. Design wins ties on visual / UX.

## Glossary (so a fresh model isn't confused)

- **PASSENGER** — bus traveler who orders food. Auth via OTP.
- **RESTAURANT_STAFF** — kitchen / counter staff at a highway dhaba.
  Auth via OTP. Tied to a `Restaurant` via `Membership`.
- **BUS_OPERATOR** — company that owns / runs buses. Manages routes,
  buses, GPS pings.
- **ADMIN** — platform operator. Can do everything.
- **QR token** — a per-bus token printed inside the bus. Scanning it
  routes the passenger to the assigned restaurant's menu.
- **Journey** — the active bus + restaurant + QR association the
  passenger is currently shopping in. Expires after 4h on the client.
- **Cart** — single-restaurant bag of items, tied to a session for
  anonymous users or to a User for authenticated.
- **Order** — confirmed cart that progresses through
  PENDING → CONFIRMED → PREPARING → READY → PICKED_UP (or → CANCELLED
  from PENDING / CONFIRMED).
- **Assignment** — `BusRestaurantAssignment` row mapping a Bus to a
  Restaurant for a window of time.

---

**Last updated:** 2026-05-02 — initial scaffold. See `design.md` for
the full plan and `git log` for change history.
