# Restaurant app — Claude / agent guide

> **Read `../CLAUDE.md` and `../design.md` first.** This file is a
> per-app cheat sheet.

## What this app is

The **kitchen-facing** ETA Eats mobile app. Restaurant staff:
1. Log in via OTP (must be `role === 'RESTAURANT_STAFF'` with active
   restaurant membership).
2. See incoming orders on a live Kanban (NEW / COOKING / READY).
3. Advance order status as they cook and hand off.
4. Manage menu (categories, items, photos, availability).
5. View daily analytics.

This app is intended for kitchen tablets / phones plugged in all day.
Bias toward big touch targets, loud feedback (chime + haptic on new
orders), and resilient WebSocket reconnection.

## Role

Logged-in user is `role === 'RESTAURANT_STAFF'`. Login rejects any
other role and any STAFF without an active `Membership` of
`org_type='restaurant'`.

## Screens (8)

See `../design.md` § 4.2. File-system map:

```
app/
├── _layout.tsx
├── index.tsx                       # → /(auth)/login or /(dashboard)/orders
├── (auth)/login.tsx                # 4.2.1
└── (dashboard)/
    ├── _layout.tsx                 # tabs / drawer + ConnectionBadge + SoundToggle
    ├── orders.tsx                  # 4.2.2 — live Kanban
    ├── orders-history.tsx          # 4.2.3
    ├── menu/
    │   ├── index.tsx               # 4.2.4
    │   ├── new.tsx                 # 4.2.5
    │   └── [id].tsx                # 4.2.5
    ├── analytics.tsx               # 4.2.6
    └── profile.tsx                 # 4.2.7
```

## Restaurant-specific stores

- `useSoundStore` — sound enabled/disabled (persisted MMKV). Defaults
  to enabled.
- `useKanbanFiltersStore` (optional) — date range or status filter
  pinning; not required v1.

## Critical behaviours

- **WebSocket is `/ws/restaurant/{restaurant_id}/?token=<access>`.**
  The restaurant id comes from the active `Membership`. Use
  `@eta/realtime` `useRestaurantSocket` hook — do not hand-roll a WS.
- **On WS message:**
  - `event === 'created'` → `queryClient.invalidateQueries(['orders',
    'restaurant'])`, play chime, fire toast.
  - status events → `invalidateQueries`. Do NOT mutate query data
    optimistically from a WS event — let the refetch be the source of
    truth.
- **Status advance is server-driven.** Clients call
  `POST /orders/restaurant/{id}/advance/ {status}` and only update UI
  on the response. The backend's `ALLOWED_STATUS_TRANSITIONS` is
  duplicated in `@eta/types/order.ts` for client-side disabling of
  illegal advances, but the backend remains the gate.
- **Audio:** `expo-av` `setAudioModeAsync({ playsInSilentModeIOS:
  true, staysActiveInBackground: false })`. Lock the audio session
  on app foreground; release on background.
- **Background:** keep WS connected up to 5 minutes in background
  (kitchens hop apps). After 5 minutes, close cleanly.

## Web counterpart

`../../frontend/restaurant/src/app/dashboard/...` — port behaviour
unchanged unless `design.md` says otherwise.

## Stack additions specific to restaurant

- `expo-av` (chime audio)
- `expo-haptics` (haptic feedback on new orders)
- `victory-native` (analytics chart)
- `expo-image-picker` (menu item photo)

## Common pitfalls

- Don't auto-advance orders with timers. The kitchen drives status —
  always staff-tap.
- Don't rely on push notifications for the kitchen workflow. Push is
  a backup; the WS is primary.
- Don't fetch the full orders list on WS message — `invalidateQueries`
  lets TanStack Query handle the refetch.
- Don't render heavy charts on the orders screen — keep analytics on
  its own tab.
- Tablet landscape MUST work for this app (kitchens often run on
  iPads). Test `iPad (10th gen)` in the device matrix.

## Definition of "working"

- Maestro restaurant smoke flow (`../design.md` § 8.7) green.
- 8-hour kitchen-shift soak: zero crashes, < 2% memory growth.
- WS reconnect after dropped Wi-Fi succeeds within 30s.
- New-order chime + haptic + card appear within 500ms of WS event.
