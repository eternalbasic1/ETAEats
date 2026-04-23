# ETA Eats — Restaurant Dashboard Design Spec

**Date:** 2026-04-23
**Scope:** Restaurant Dashboard only (Phase 2 of 3). Passenger app is already built; Admin platform is a separate spec.
**Backend:** Django/DRF v2 at `ETA-Eats-v2/backend/` — APIs fully built and tested.

---

## 1. Context & Product Goal

Restaurant staff (owners, managers, cooks) at highway dhabas need a fast, reliable way to see incoming pre-orders from bus passengers and move them through the state machine: confirm → start cooking → mark ready → picked up. The dashboard is used on **desktop / laptop browsers** in a kitchen environment — bright lighting, staff juggling multiple tasks, and a need to see many live orders at once.

Failure modes it must protect against:
- Missing a new order (passenger's bus leaves without their food)
- Confusing two similar orders from different buses
- Slow UI while the kitchen is in peak rush

---

## 2. Location & Architecture

**Location:** `ETA-Eats-v2/frontend/restaurant/` — a standalone Next.js 14 app, alongside the existing `frontend/passenger/`.

**Architecture decision:** Three independent apps (same as passenger). No monorepo tooling. Patterns like Axios setup and base UI components are copied from `frontend/passenger/` and adapted rather than imported.

---

## 3. Visual Direction — Clean Professional Light

White / light-gray base, **orange accent** (`#FF6B2B`), high-contrast near-black text. Left-border color accent on cards communicates urgency per column. Targets a bright kitchen environment and daytime ops.

**Design tokens (`globals.css`):**

```css
:root {
  --bg:             #F8F9FA;
  --surface:        #FFFFFF;
  --surface-2:      #F3F4F6;
  --border:         #E5E7EB;
  --border-strong:  #D1D5DB;
  --primary:        #FF6B2B;
  --primary-soft:   #FFF0EB;
  --primary-dark:   #E55A1F;
  --text-primary:   #111827;
  --text-secondary: #4B5563;
  --text-muted:     #9CA3AF;
  --success:        #16A34A;
  --success-bg:     #F0FDF4;
  --warning:        #F59E0B;
  --warning-bg:     #FFFBEB;
  --error:          #DC2626;
  --error-bg:       #FEF2F2;
  --info:           #2563EB;
  --radius-sm:      6px;
  --radius-md:      10px;
  --radius-lg:      14px;
  --shadow-sm:      0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:      0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
}
```

**Typography:** Inter, weights 400 / 500 / 600 / 700.

**Visual language:**
- Cards: white surface, 1px `--border`, `--shadow-sm`, `--radius-md`
- Each order card: 3px left-border accent in its column's color (orange for New, amber for Cooking, green for Ready)
- Primary CTA: solid `--primary` bg, white text
- Destructive actions: `--error` text on `--error-bg` tonal button

---

## 4. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 14 App Router | — |
| Language | TypeScript 5 strict | `noUncheckedIndexedAccess` on |
| Styling | Tailwind CSS 3 | Maps tokens to utilities |
| Animation | Framer Motion 11 | Card enter, kanban transitions, new-order pulse |
| Client state | Zustand 4 + persist | Auth + restaurantId |
| Server state | TanStack Query 5 | Orders, menu, analytics; auto-refetch on focus |
| HTTP | Axios 1.x | Copied interceptor pattern from passenger |
| Realtime | Native WebSocket | `ws://host/ws/restaurant/{id}/?token=...` |
| Forms | React Hook Form 7 + Zod 3 | Item editor, profile edit |
| Toasts | Sonner 1.x | Top-right, light theme |
| Charts | Recharts 2.x | Analytics screen |
| Icons | Lucide React | — |
| PWA | none for MVP | Restaurant is desktop-first; PWA added in V2 if needed |

---

## 5. Screen Map

```
/login                        ← OTP phone login (same backend flow as passenger)

/                             ← Redirects to /dashboard if authed, else /login

/dashboard                    ← Live Orders kanban — 3 columns (New / Cooking / Ready)
/dashboard/orders             ← Order history — searchable, filterable list
/dashboard/menu               ← Menu management — categories + items, with availability toggles
/dashboard/menu/item/new      ← Add menu item (modal-route)
/dashboard/menu/item/[id]     ← Edit menu item
/dashboard/profile            ← User profile + restaurant profile + sign out
/dashboard/analytics          ← Today's revenue, order count, hourly chart, top 5 items
```

**Middleware guard:** All `/dashboard/*` routes require an authenticated user whose `role === 'RESTAURANT_STAFF'`. Unauthenticated → redirect to `/login`. Wrong role → show error screen.

**Root behaviour:** `/` is a client-side redirect. If `auth.store.isAuthenticated` and `restaurantId` is set → `/dashboard`. Otherwise → `/login`.

---

## 6. Folder Structure

```
frontend/restaurant/
├── public/
│   └── notification.mp3
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx               ← Sidebar + topbar, WS connection boundary
│   │   │   ├── page.tsx                 ← Live orders kanban
│   │   │   ├── orders/page.tsx          ← History
│   │   │   ├── menu/
│   │   │   │   ├── page.tsx
│   │   │   │   └── item/
│   │   │   │       ├── new/page.tsx
│   │   │   │       └── [id]/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── analytics/page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                     ← / → redirect
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                          ← Button, Card, Badge, Input, Textarea, Switch, Dialog, Spinner
│   │   ├── orders/                      ← OrderCard, KanbanColumn, StatusActionButton, CancelOrderDialog
│   │   ├── menu/                        ← CategoryRow, CategoryFormDialog, MenuItemRow, ItemForm, AvailabilityToggle
│   │   ├── analytics/                   ← StatTile, HourlyRevenueChart, TopItemsList
│   │   └── layout/                      ← Sidebar, TopBar, ConnectionBadge, SoundToggle
│   ├── hooks/
│   │   ├── useRestaurantSocket.ts
│   │   ├── useAuth.ts
│   │   └── useSoundAlert.ts
│   ├── stores/
│   │   └── auth.store.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── api.types.ts
│   │   └── utils.ts
│   └── middleware.ts
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. Data Flow

### 7.1 Login
```
POST /api/v1/auth/otp/request/  { phone_number }
POST /api/v1/auth/otp/verify/   { phone_number, code }  → { user, tokens }

  → reject if user.role !== 'RESTAURANT_STAFF'        (show error on /login)
  → parse active restaurant membership from user payload (see §11 backend prerequisite)
  → auth.store: { user, restaurantId, tokens }
  → navigate to /dashboard
```

### 7.2 Live Orders
```
Initial fetch:
  GET /api/v1/orders/restaurant/                       ← no filter, client groups

Client-side bucketing:
  "New"     → status === 'PENDING'
  "Cooking" → status ∈ ('CONFIRMED', 'PREPARING')
  "Ready"   → status === 'READY'
  (PICKED_UP and CANCELLED fall off the kanban and go to /dashboard/orders)

Realtime:
  ws://host/ws/restaurant/{restaurantId}/?token={accessToken}
  onmessage → { event, order_id, status } or full Order
    → invalidate ['orders','live'] query → refetch
    → if event === 'created': trigger new-order alert (pulse + toast + sound)

Status actions (button clicks on card):
  PENDING   → CONFIRMED   (button: "Confirm")
  CONFIRMED → PREPARING   (button: "Start Cooking")
  PREPARING → READY       (button: "Mark Ready")
  READY     → PICKED_UP   (button: "Picked Up")
  Any       → CANCELLED   (dropdown menu: "Cancel order" → reason dialog)

  All call: POST /api/v1/orders/restaurant/{orderId}/advance/ { status, reason? }
  Optimistic UI: card moves columns immediately
  On error: rollback + Sonner toast with error.message
```

### 7.3 Order History
```
GET /api/v1/orders/restaurant/?ordering=-created_at&page=N
Client-side filters:
  status          (multi-select chips)
  date preset     (Today / Yesterday / This week / All)
  bus plate       (search box)
Pagination: 20 per page, "Load more" button
```

### 7.4 Menu Management
```
Categories:
  GET    /api/v1/restaurants/menu-categories/
  POST   /api/v1/restaurants/menu-categories/
  PATCH  /api/v1/restaurants/menu-categories/{id}/
  DELETE /api/v1/restaurants/menu-categories/{id}/

Items:
  GET    /api/v1/restaurants/menu-items/?restaurant={restaurantId}
  POST   /api/v1/restaurants/menu-items/
  PATCH  /api/v1/restaurants/menu-items/{id}/
  DELETE /api/v1/restaurants/menu-items/{id}/

Availability toggle (one-tap, optimistic):
  PATCH /api/v1/restaurants/menu-items/{id}/ { is_available: bool }

Grouping:
  UI groups items by category in the menu screen.
```

### 7.5 Profile
```
User:
  GET   /api/v1/auth/me/
  PATCH /api/v1/auth/me/          { full_name, email }

Restaurant:
  GET   /api/v1/restaurants/{restaurantId}/
  PATCH /api/v1/restaurants/{restaurantId}/   (owner membership only — backend enforces)

Sign out:
  POST  /api/v1/auth/logout/      { refresh }
  → clear auth.store → redirect to /login
```

### 7.6 Analytics (MVP — today only, client-aggregated)
```
GET /api/v1/orders/restaurant/?created_at__gte={todayStartISO}&page_size=200
Client aggregates:
  Revenue total       = sum(total_amount) where status !== CANCELLED
  Order count         = count(orders) where status !== CANCELLED
  Cancelled count     = count(orders) where status === CANCELLED
  Top 5 items         = flatten items, count by menu_item_name, sort desc
  Hourly revenue      = bucket by hour of created_at, sum total_amount

V2: dedicated backend endpoints for multi-day aggregates.
```

---

## 8. Key Component Behaviours

### 8.1 OrderCard
- 3px left-border accent in column color (orange / amber / green)
- Header: bus plate + bus name
- Body: items as "Name × qty" list
- Footer: total, timestamp ("3 min ago"), primary action button
- `...` dropdown for "Cancel order" (opens `CancelOrderDialog`)
- Card pulses (`scale: [1, 1.03, 1]` over 400ms) when it first appears from a new-order event

### 8.2 KanbanColumn
- Sticky header: column name + count badge
- Vertical stack of `OrderCard` with 8px gap
- Empty state: subtle placeholder text
- Scrolls independently inside its column

### 8.3 New-order alert sequence
- WS push with `event === 'created'` received
- Toast fires top-right: "New order from SRS Express 101 · ₹280"
- If sound is enabled in profile, play `/notification.mp3` once
- OrderCard appears with pulse animation in the "New" column

### 8.4 Sound toggle
- Lives in the Sidebar footer next to the user's name
- State persists in `localStorage` (key `eta-restaurant-sound-enabled`)
- Default: `true` on first session, so owners who never see the setting still hear alerts

### 8.5 Connection badge
- In the top bar
- Three states, mirroring passenger app: `LIVE` (green dot), `Reconnecting…` (amber, pulsing), `Offline` (gray)

### 8.6 CancelOrderDialog
- Modal with radio choices for common reasons: "Out of stock", "Kitchen closed", "Too busy", "Other"
- If "Other" → free-text input appears
- Confirm calls advance with `status: 'CANCELLED', reason: <text>`

### 8.7 Menu item form
- Fields: name (required), description, price (required, decimal), prep_time_minutes (required, 1–120), is_available, category (select), photo_url (optional, just a text URL in MVP — upload in V2)
- Zod validation, React Hook Form, submit via mutation with optimistic refetch

---

## 9. Error States

| Scenario | Behaviour |
|----------|-----------|
| OTP verify returns non-staff role | "/login" shows "This portal is for restaurant staff only. Passengers: open the ETA Eats app from your bus QR." |
| No active membership on user | "/login" shows "Your account has no restaurant assigned. Contact the admin." |
| Orders fetch fails | Centered retry card in kanban area |
| Status advance fails (invalid_transition) | Sonner toast with server message, card rolls back |
| Status advance fails (network) | Sonner toast "Couldn't update — check connection" |
| WebSocket fails | Silent fallback: TanStack Query polls orders every 8s |
| Menu item save fails | Inline error below form, don't close modal |
| Token expired | Axios interceptor silently refreshes; if refresh also fails, redirect to /login |

---

## 10. MVP Scope

### In MVP
- OTP login with role verification
- Live Orders kanban with WebSocket + polling fallback
- Order state machine advancement (all legal transitions) + cancellation with reason
- New-order alerts: pulse + toast + optional sound
- Order history with client-side filters
- Full menu category + item CRUD
- One-tap availability toggle
- User profile edit + restaurant profile edit
- Today's analytics (revenue, orders, top 5, hourly bar chart)
- Sign out with refresh token blacklist
- Connection badge

### V2
- Kitchen Display Mode (fullscreen, auto-rotate, touch-optimized)
- Bus ETA intelligence + prep planning (requires reliable GPS)
- Weekly / monthly analytics (needs backend aggregation endpoints)
- Item photo upload (S3 — backend supports it, UI not in MVP)
- Push notifications (FCM) to owner's phone when not on dashboard
- Prep time auto-tuning based on actual history
- PWA installability
- Multi-location support for owners with several restaurants

---

## 11. Backend Prerequisite

The current `UserSerializer` (in `apps/accounts/serializers.py`) does not expose the user's active restaurant membership, so the frontend has no way to know which restaurant the logged-in staff user belongs to. Without this, every restaurant-scoped API call would need an extra lookup.

**Required change:** Extend `UserSerializer` (or add a dedicated `MeSerializer`) to include active memberships in the response:

```json
{
  "id": "...",
  "phone_number": "...",
  "role": "RESTAURANT_STAFF",
  "memberships": [
    {
      "id": 12,
      "org_role": "RESTAURANT_OWNER",
      "restaurant": 5,
      "restaurant_name": "Punjabi Dhaba",
      "operator": null,
      "is_active": true
    }
  ]
}
```

The frontend picks the first active membership where `restaurant` is non-null and uses that as `restaurantId`. This change is Task 0 of the implementation plan.

---

## 12. Open Risks

1. **Sound autoplay**: Browsers block audio before user interaction. First play attempt after login may silently fail. Mitigation: play a silent 0ms sound on first user click (e.g., the "Confirm" button) to unlock the audio context, then subsequent `notification.mp3` plays will work. Document in the `useSoundAlert` hook.

2. **WebSocket auth reuse**: The JWT middleware added during the passenger build already serves the restaurant WS endpoint (`/ws/restaurant/{id}/`). No additional backend change needed there — the `RestaurantConsumer` checks membership after auth, which is correct behaviour.

3. **Multi-device sessions**: If an owner logs in on two machines, both will receive WS pushes. This is intentional — no dedupe needed for MVP.

---

*Next step: implementation plan via writing-plans skill.*
