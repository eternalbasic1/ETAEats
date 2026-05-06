# Passenger app — Claude / agent guide

> **Read `../CLAUDE.md` and `../design.md` first.** This file is a
> per-app cheat sheet, not a complete spec.

## What this app is

The **consumer-facing** ETA Eats mobile app. A bus passenger:
1. Boards a bus, scans the QR sticker inside.
2. Sees the assigned highway restaurant's menu.
3. Adds food to a single-restaurant cart.
4. Logs in (OTP) and pays via Razorpay.
5. Tracks the order live until pickup.

## Role

Logged-in user is `role === 'PASSENGER'`. The login flow accepts any
phone number — the backend creates a PASSENGER user on first sign-in.

## Screens (15 total)

See `../design.md` § 4.1 for the per-screen spec. File-system map:

```
app/
├── _layout.tsx
├── index.tsx                       # splash / route
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx                   # 4.1.2
│   └── otp.tsx                     # 4.1.3
├── (tabs)/
│   ├── _layout.tsx
│   ├── home.tsx                    # 4.1.4
│   ├── scan.tsx                    # 4.1.5
│   ├── orders.tsx                  # 4.1.10
│   └── profile.tsx                 # 4.1.13
├── scan/
│   ├── [qr_token].tsx              # 4.1.6
│   ├── invalid.tsx                 # 4.1.14
│   └── no-restaurant.tsx           # 4.1.15
├── menu/[restaurantId].tsx         # 4.1.7
├── cart.tsx                        # 4.1.8
├── checkout.tsx                    # 4.1.9
├── order/
│   ├── [orderId].tsx               # 4.1.11
│   └── [orderId]/complete.tsx      # 4.1.12
└── +not-found.tsx
```

## Passenger-specific stores

- `useCartStore` — cartId, busId, restaurantId, items[], totals.
  Persisted via MMKV.
- `useJourneyStore` — active journey (bus + restaurant + qr_token,
  4-hour expiry); last-5 history.
- `useOrderTrackingStore` — single active order banner state.

Auth, real-time, API client all come from `@eta/auth`,
`@eta/realtime`, `@eta/api-client`. Don't duplicate.

## Critical behaviours

- **Cart is single-restaurant.** If a passenger tries to add an item
  from a different restaurant, show the "Switch restaurant?" bottom
  sheet — never silently overwrite.
- **Anonymous browsing is allowed.** Cart works without login. Login
  is gated only at checkout (via `AuthBottomSheet`).
- **Camera permission is mandatory** for scanning, but always offer a
  "Type code manually" fallback.
- **Order tracking subscribes to `/ws/user/?token=…`** — the same
  socket pushes notifications. Filter by `payload.data.order_id` for
  the current screen.

## Web counterpart for behavioural reference

`../../frontend/passenger/src/app/...` — read it before porting any
screen. The mobile flow must match unless `design.md` says otherwise.

## Stack additions specific to passenger (vs the workspace defaults)

- `expo-camera` (QR scan)
- `react-native-razorpay` (checkout)
- `react-native-maps` (live tracking, optional in v1)

## Common pitfalls

- Don't request camera permission at app start. Request only on the
  Scan tab when the user actually intends to scan.
- Don't show the `AuthBottomSheet` while on `/checkout` — instead,
  redirect to `(auth)/login` with `?redirect=/checkout` so the back
  stack is sane.
- Don't trust client-side cart totals on display — always show what
  the backend's `cart` response says. The backend is the source of
  truth for prices.

## Definition of "working" for this app

- Maestro passenger smoke flow (`../design.md` § 8.7) green on iOS sim
  + Android emulator.
- Cold start ≤ 2.5s on Pixel 4a.
- Checkout end-to-end against staging Razorpay test mode succeeds.
- Crash-free for 4-hour soak on a passenger flow loop.
