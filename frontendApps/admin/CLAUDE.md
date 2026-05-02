# Admin app — Claude / agent guide

> **Read `../CLAUDE.md` and `../design.md` first.** This file is a
> per-app cheat sheet.

## What this app is

The **operator-facing** ETA Eats mobile app. Admins:
1. Log in via OTP (must be `role === 'ADMIN'`).
2. View an overview dashboard with platform stats.
3. CRUD: routes, buses, operators, restaurants.
4. View bus → restaurant assignments.
5. Edit their own profile.

This is internal tooling. Optimise for clarity, not flair. List + modal
form pattern across the board (matching the web).

## Role

Logged-in user is `role === 'ADMIN'`. Login rejects any other role.
`BUS_OPERATOR` users use this app in v2 (with reduced scope) — out of
scope for v1.

## Screens (9)

See `../design.md` § 4.3. File-system map:

```
app/
├── _layout.tsx
├── index.tsx                          # → /(auth)/login or /(dashboard)/overview
├── (auth)/login.tsx                   # 4.3.1
└── (dashboard)/
    ├── _layout.tsx                    # tabs: Overview, Routes, Buses, Operators, Restaurants, Assignments, Profile
    ├── overview.tsx                   # 4.3.2 — 4 stat cards
    ├── routes/index.tsx               # 4.3.3
    ├── buses/index.tsx                # 4.3.4
    ├── operators/index.tsx            # 4.3.5
    ├── restaurants/index.tsx          # 4.3.6
    ├── assignments/index.tsx          # 4.3.7
    └── profile.tsx                    # 4.3.8
```

## Admin-specific stores

- Only auth (from `@eta/auth`). No domain stores.

All other state is React Query cache or local component state.

## Critical behaviours

- **Reuse a single `EntitySheet` component** for every CRUD modal —
  routes, buses, operators, restaurants. Compose with React Hook Form
  + Zod schemas. The reduction in surface area is huge.
- **Biometric on cold start** is mandatory if hardware supports it
  (`expo-local-authentication`). Fall back to a PIN of the admin's
  last-4 phone digits if no biometric hardware.
- **Idle timeout** of 15 minutes in background → force re-auth.
- **No optimistic mutations.** Admin actions affect everyone — wait
  for the server to confirm before showing success.
- **Search and filter** are local for v1 (in-memory) since lists are
  ≤ 200 items. Cursor pagination is a future task.

## Web counterpart

`../../frontend/admin/src/app/dashboard/...` — port behaviour. The
web admin uses page_size=200 to avoid pagination UX; the mobile app
does the same in v1.

## Stack additions specific to admin

- `expo-local-authentication` (biometric)
- `expo-clipboard` (Copy QR token from buses screen)

## Common pitfalls

- Don't add destructive actions without a confirmation bottom sheet.
- Don't fetch all entities on every navigation — TanStack Query
  staleTime should be 30-60s for admin data.
- Don't put restaurant analytics in the admin app. Restaurant
  analytics live in the restaurant app.
- Don't stream WebSocket events to the admin app. v1 admin is poll-on-
  refresh (manual or pull-to-refresh).

## Definition of "working"

- Maestro admin smoke flow (`../design.md` § 8.7) green.
- Internal admin user can complete every CRUD flow without help.
- Biometric gate works on iPhone 14 (Face ID), Pixel 4a (fingerprint),
  and falls back gracefully on a device without biometric hardware.
