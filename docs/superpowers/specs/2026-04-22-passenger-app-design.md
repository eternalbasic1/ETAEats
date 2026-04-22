# ETA Eats — Passenger Web App Design Spec

**Date:** 2026-04-22
**Scope:** Passenger app only (Phase 1 of 3). Restaurant dashboard and Admin platform are separate specs.
**Backend:** Django/DRF v2 at `ETA-Eats-v2/backend/` — APIs fully built and tested.

---

## 1. Context & Product Goal

ETA Eats solves a specific highway travel problem: bus passengers have 15–20 minutes at a highway restaurant stop. If many buses arrive simultaneously, food delays mean passengers miss meals or their bus leaves. ETA Eats lets passengers pre-order food while still on the bus so the kitchen prepares it in advance and pickup is instant.

The passenger app is the core product. Without it, the platform has no orders. It must work on a phone, on a bumpy highway, with variable connectivity, for users of all ages.

---

## 2. Location & Architecture

**Location:** `ETA-Eats-v2/frontend/passenger/` — a standalone Next.js 14 app, co-located with the v2 backend.

**Architecture decision:** Three independent Next.js apps (one per role: passenger, restaurant, admin). No monorepo tooling. Each app is self-contained with its own components, API client, and Tailwind config.

**Shared discipline:** `tailwind.config.ts` and `globals.css` (design tokens) are the single source of truth for the Dark Premium design system. These files are manually kept identical across all three apps to prevent design drift.

---

## 3. Visual Direction — Dark Premium

Deep dark background, vibrant purple accent, gradient glows. Targets a young urban audience but must remain readable under real conditions (phone brightness up, sunlight, movement).

**Design tokens (globals.css):**

```css
:root {
  --bg:           #0D0D0D;
  --surface:      #111111;
  --surface-2:    #1A1A2E;
  --border:       rgba(255,255,255,0.08);
  --primary:      #7C5CFC;
  --primary-soft: #a78bfa;
  --primary-glow: rgba(124,92,252,0.25);
  --text-primary: #FFFFFF;
  --text-secondary: #888888;
  --text-muted:   #444444;
  --success:      #22c55e;
  --error:        #ef4444;
  --warning:      #f59e0b;
  --radius-sm:    8px;
  --radius-md:    12px;
  --radius-lg:    16px;
  --radius-xl:    20px;
}
```

**Typography:** Inter (Google Fonts). Weights: 400 body, 600 label, 700 heading, 800 display.

**Motion:** Framer Motion. Entrances use `{ opacity: 0, y: 16 } → { opacity: 1, y: 0 }` at 0.2s ease-out. The bottom sheet uses a spring. Status transitions on the order tracker animate with a scale pulse.

---

## 4. Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js App Router | 14.x |
| Language | TypeScript | 5.x strict |
| Styling | Tailwind CSS | 3.x |
| Animation | Framer Motion | 10.x |
| Client state | Zustand | 4.x |
| Server state | TanStack Query | 5.x |
| HTTP | Axios | 1.x |
| Realtime | Native WebSocket | — |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| Toasts | Sonner | 1.x |
| PWA | next-pwa | 5.x |
| Package manager | npm | — |

---

## 5. Screen Map (Information Architecture)

```
/scan/[qr_token]              ← Entry from QR code — calls scan API, redirects to menu
/scan/invalid                 ← Bad / expired QR token
/scan/no-restaurant           ← Bus exists but has no active restaurant assignment

/menu/[restaurantId]          ← Menu browsing (category tabs + vertical list)
                                 Category filter via ?category= query param (no page reload)
                                 Search overlay triggered from search bar (same route)

/cart                         ← Cart review + auth bottom sheet gate

/checkout                     ← Order summary + Razorpay payment

/order/[orderId]              ← Live order tracking (vertical stepper + WebSocket)
/order/[orderId]/complete     ← Pickup confirmation

/orders                       ← Order history (requires auth — middleware redirect)
/profile                      ← User profile + past orders (requires auth — middleware redirect)

/auth/verify                  ← OTP entry for direct / deep-link access
```

**No `/` home route.** The app has no landing page — entry is always via QR scan. Users who navigate to `/` directly are redirected to `/scan/invalid` with a "Scan the QR code inside your bus" message.

**Auth scope:** `/orders` and `/profile` are protected by `middleware.ts`. All other routes are public. Auth happens inline via the bottom sheet, never via redirect.

---

## 6. Folder Structure

```
frontend/passenger/
├── public/
│   ├── manifest.json
│   └── icons/                        ← PWA icons (192, 512)
├── src/
│   ├── app/
│   │   ├── scan/
│   │   │   ├── [qr_token]/page.tsx
│   │   │   ├── invalid/page.tsx
│   │   │   └── no-restaurant/page.tsx
│   │   ├── menu/
│   │   │   └── [restaurantId]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── order/
│   │   │   └── [orderId]/
│   │   │       ├── page.tsx
│   │   │       └── complete/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── auth/verify/page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                       ← Button, Card, Sheet, Input, Badge, Spinner, Toast
│   │   ├── menu/                     ← MenuList, MenuItem, CategoryTabs, SearchOverlay, CartBar
│   │   ├── cart/                     ← CartItemRow, CartSummary, AuthBottomSheet, OTPInput
│   │   ├── order/                    ← StatusStepper, StepRow, LiveBadge, PickupCard
│   │   └── layout/                   ← AppShell, CountdownBanner, PageHeader
│   ├── hooks/
│   │   ├── useOrderSocket.ts         ← WebSocket lifecycle + reconnect + polling fallback
│   │   ├── useCountdown.ts           ← Bus arrival countdown timer
│   │   └── useAuth.ts                ← OTP request/verify, token management
│   ├── stores/
│   │   ├── auth.store.ts             ← user, accessToken, refreshToken (persisted)
│   │   ├── cart.store.ts             ← items, cartId, busId, restaurantId (persisted)
│   │   └── session.store.ts          ← busInfo, qrToken from scan (NOT persisted — session only)
│   ├── lib/
│   │   ├── api.ts                    ← Axios instance, JWT interceptors, 401 refresh logic
│   │   ├── api.types.ts              ← All backend response/request shapes typed
│   │   └── razorpay.ts               ← Razorpay script loader + checkout helper
│   └── middleware.ts                 ← Protect /orders and /profile
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. Data Flow

### QR Scan → Menu
```
GET /api/v1/restaurants/scan/{qr_token}/
  → session.store: { busId, busName, numberPlate, restaurantId, restaurantName, route }
  → navigate to /menu/[restaurantId]
```

### Menu Browsing
```
TanStack Query: GET /api/v1/restaurants/menu-items/?restaurant={id}&is_available=true
  → cached 5 minutes
  → category filtering: client-side on cached data (no extra fetches per tab)
  → search: client-side filter on same cached data
```

### Cart
```
POST /api/v1/orders/cart/ { menu_item, quantity, bus_id }
  → optimistic update: item appears immediately in cart.store
  → on backend error: rollback + Sonner toast "Couldn't add item"
  → cart.store.cartId persists across page navigation
```

### Auth Gate (bottom sheet)
```
POST /api/v1/auth/otp/request/ { phone_number }
POST /api/v1/auth/otp/verify/  { phone_number, code }
  → auth.store: { user, accessToken, refreshToken }
  → persisted to localStorage via Zustand persist middleware
  → anonymous cart auto-merges server-side (backend handles session → user merge)
  → bottom sheet dismisses, checkout proceeds
```

### Checkout → Payment
```
POST /api/v1/orders/checkout/         { cart_id, bus_id }   → Order (PENDING)
POST /api/v1/payments/razorpay/order/ { order_id }          → Razorpay order payload
  → open Razorpay checkout sheet (script loaded in razorpay.ts)
POST /api/v1/payments/razorpay/confirm/ { order_id, razorpay_order_id,
                                          razorpay_payment_id, razorpay_signature }
  → on success: navigate to /order/[orderId]
```

### Live Order Tracking
```
Initial:  GET /api/v1/orders/my/{orderId}/   ← one-time fetch for current state
Realtime: ws://{host}/ws/notifications/?token={accessToken}

useOrderSocket:
  onmessage → if payload.order_id === currentOrderId → update local order state → stepper animates
  onclose (unintentional) → exponential backoff reconnect: 1s → 2s → 4s
  after 3 failures → fallback: TanStack Query poll every 8 seconds
  show "Reconnecting..." badge on tracking page
  cleanup → disconnect when order reaches PICKED_UP or page unmounts
```

---

## 8. State Ownership

| Data | Owner | Persisted | Notes |
|------|-------|-----------|-------|
| Cart items + cartId | Zustand | Yes | Survives refresh; anonymous→auth merge |
| Auth tokens + user | Zustand | Yes | Needed synchronously in Axios interceptor |
| Bus + restaurant from scan | Zustand (session) | No | Cleared on new scan |
| Menu items | TanStack Query | Cache only | 5-min cache, stale-while-revalidate |
| Order status | Page-local state | No | Fed by WebSocket / polling |
| Order history | TanStack Query | Cache only | Paginated, refetch on focus |

---

## 9. JWT Token Lifecycle

- **Access token:** 60-minute TTL, stored in Zustand + localStorage
- **Refresh token:** 7-day TTL, stored in Zustand + localStorage
- **Axios interceptor:** on 401 response → silently calls `POST /api/v1/auth/token/refresh/` → retries original request → transparent to the user
- **Refresh failure:** clears `auth.store` → bottom sheet re-appears at next protected action
- **No cookies / no httpOnly:** mobile-first PWA — localStorage + Zustand persist is appropriate

---

## 10. Key Screen Designs

### Scan Page (`/scan/[qr_token]`)
Full-screen dark background. Centered ETA Eats logo with purple glow pulse animation. "Scanning..." spinner. On success: brief success animation then navigate. On error: GlassCard with error message and "Make sure you scanned the QR inside your bus" guidance.

### Menu Page (`/menu/[restaurantId]`)
- **Sticky header:** Restaurant name + hygiene rating + "X min left" countdown badge
- **Search bar:** always visible below header, tapping opens full-screen search overlay
- **Category tabs:** horizontal scroll pills (All, Starters, Main Course, Breads, Beverages, Combos). Active tab uses primary gradient fill.
- **Item list:** each item has emoji/photo placeholder, name, description (1 line truncated), price, prep time, `+ ADD` button. If item already in cart: shows `− 1 +` counter inline.
- **Sticky cart bar:** fixed at bottom, hidden when cart is empty. Shows item count + total + "View Cart →". Slides up with spring animation on first item add.
- **Unavailable items:** shown greyed out with "Unavailable" badge, not hidden.

### Cart Page (`/cart`)
- Full list of cart items with quantities and line totals
- Editable quantities inline
- Order total + "Place Order" CTA
- Tapping "Place Order" when unauthenticated: triggers auth bottom sheet
- Auth bottom sheet: blurs content behind, slides up from bottom, handle bar at top, phone input + "Send OTP" → OTP input (6 digits, auto-advance) → verifying state → success dismisses sheet and proceeds to checkout

### Order Tracking (`/order/[orderId]`)
- Restaurant name + order ID at top
- "LIVE" badge (purple dot + text) when WebSocket connected; "Reconnecting..." when not
- Vertical stepper: 5 steps (Placed, Confirmed, Preparing, Ready, Picked Up)
  - Completed steps: purple filled circle with checkmark + timestamp
  - Active step: pulsing purple circle + highlighted card showing current message
  - Pending steps: grey empty circle + muted text
- When order reaches READY: prominent "Your food is ready — head to the counter!" banner with green accent
- When order reaches PICKED_UP: auto-navigate to `/order/[id]/complete`

---

## 11. Error States

| Scenario | Behaviour |
|----------|-----------|
| Invalid QR token | `/scan/invalid` — "This QR code is invalid. Scan the code pasted inside your bus." |
| Bus has no restaurant | `/scan/no-restaurant` — "No restaurant is assigned to this bus right now." |
| Menu fetch fails | Retry button + "Couldn't load menu. Check your connection." |
| Add to cart fails | Sonner toast, optimistic update rolled back |
| Restaurant mismatch | Sonner toast "Your cart has items from another restaurant. Clear cart to continue?" with confirm action |
| Payment fails | Return to checkout with Sonner error, order remains PENDING (can retry) |
| WebSocket fails | Silent fallback to 8s polling, "Reconnecting..." badge shown |
| Token expired | Silent refresh via interceptor; if refresh also fails, bottom sheet reappears |

---

## 12. MVP Scope

### In MVP
- QR scan → menu → add to cart → auth gate → checkout → Razorpay payment → live order tracking → pickup confirmation
- Anonymous cart (browse without login)
- OTP auth via bottom sheet
- Order history page
- Basic profile page
- Invalid QR + no-restaurant error states
- WebSocket tracking with polling fallback
- PWA manifest (installable, does not require service worker offline caching in MVP)

### V2 (post-validation)
- Bus arrival countdown banner (requires reliable GPS from operators)
- Reorder button on history
- PWA offline menu cache (service worker)
- Push notifications via FCM ("Your food is ready")
- Order cancellation from app
- Group / seatmate ordering (requires backend changes)
- Missed-stop fallback handling
- Ratings after pickup
- Multi-language support (Hindi first)

---

## 13. Open Risk

**GPS data reliability:** The countdown "order in next X mins" urgency message requires frequent GPS pings from bus operators (`POST /api/v1/fleet/buses/{id}/gps/`). Without this, the countdown is a static field. Before launch, confirm whether operators will integrate GPS tracking or if it needs a device-side app. If GPS is unreliable, the countdown feature moves to V3.

---

*Next step: implementation plan via writing-plans skill.*
