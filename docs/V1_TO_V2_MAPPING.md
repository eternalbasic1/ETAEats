# v1 → v2 Migration Map

For each v1 model, where it ended up in v2. Useful when porting data,
updating the FE, or checking nothing dropped on the floor.

## Users & auth

| v1 | v2 |
|----|-----|
| `django.contrib.auth.User` | `apps.accounts.User` (custom, UUID, phone-first) |
| `PassengerProfile.user + phone_number + gender` | merged into `User` |
| `PassengerProfile.otp_*` | `apps.accounts.OTPCode` |
| `PassengerProfile.fcm_token` | `User.fcm_token` |
| `RestaurantStaff.user + role` | `User.role = RESTAURANT_STAFF` + `Membership(org_role=...)` |
| `RestaurantStaff.otp_*` | `OTPCode` (same table — purpose=LOGIN) |
| `AdminUser.user + role` | `User.role = ADMIN` (or `BUS_OPERATOR` when scoped to an operator) |
| `AdminUser.operator` FK | `Membership(operator=..., org_role='OPERATOR_ADMIN')` |

## Fleet

| v1 | v2 |
|----|-----|
| `BusOperator` | `fleet.BusOperator` (unchanged; phone/email now `PhoneNumberField`) |
| `Route` | `fleet.Route` (+ origin/destination index) |
| `Bus` (incl. `qr_token`, `current_location`) | `fleet.Bus` (unchanged) |
| `BusRestaurantAssignment` | `fleet.BusRestaurantAssignment` (+ `assigned_by` FK to User) |
| `BusGPSLog` | `fleet.BusGPSLog` (+ composite index `(bus, -recorded_at)`) |

## Restaurants & menu

| v1 | v2 |
|----|-----|
| `Restaurant` | `restaurants.Restaurant` (phone → `PhoneNumberField`; hygiene_rating now validated 0–5) |
| `Restaurant.fcm_token` | **removed** — push goes to users, not to restaurants directly. Staff `User.fcm_token` covers the same use case. |
| `MenuItem.category` (CharField) | `restaurants.MenuCategory` (table) + FK on MenuItem. Old free-text categories should map to new rows during backfill. |
| `MenuItem.deleted_at` | same, preserved |

## Orders & cart

| v1 | v2 |
|----|-----|
| `Cart` (UUID, session or user) | `orders.Cart` (unchanged shape) |
| `CartItem` | `orders.CartItem` (unchanged) |
| `Order` (int PK) | `orders.Order` (**UUID PK**; added `confirmed_at` / `ready_at` / `picked_up_at` / `cancelled_reason`) |
| `OrderItem` | `orders.OrderItem` (+ `menu_item_name` snapshot) |
| `Order.status` free CharField | **state machine** via `ALLOWED_STATUS_TRANSITIONS` + `advance_status` |
| `Order.payment_status` | added `FAILED` option |

**Breaking changes for the FE**:

- `Order.id` is now a UUID string, not an integer.
- Status transitions are `POST /orders/restaurant/<id>/advance/ {status}`
  — no more `PATCH /orders/<id>/` with status field.
- Error shape is now `{"error": {"code", "message", "details"}}`
  everywhere (v1 returned DRF defaults).

## Payments

| v1 | v2 |
|----|-----|
| Payment state on `Order.razorpay_*` + `payment_status` | unchanged |
| Webhook logic inline in `core/views/admin_views.py` | `apps.payments.services.process_webhook` + `WebhookEvent` audit table |
| Signature verification | centralised in `payments.services` (client confirm **and** webhook paths use HMAC-SHA256) |

## Notifications

| v1 | v2 |
|----|-----|
| FCM send inline in various tasks | `apps.notifications.services.push_to_user` |
| WebSocket consumers in `core/consumers.py` | `apps.notifications.consumers` (`UserConsumer`, `RestaurantConsumer`) |
| Order events fired from view code | `apps.notifications.signals` listens to `post_save` on `Order` |
| — | new `Notification` model (in-app inbox) |

## URLs

| v1 | v2 |
|----|-----|
| `/api/v1/user/...` | `/api/v1/auth/...` + `/api/v1/orders/...` + `/api/v1/restaurants/...` (split by domain) |
| `/api/v1/restaurant/...` | `/api/v1/orders/restaurant/...` (orders from the restaurant's side) + `/api/v1/restaurants/menu-items/` etc. |
| `/api/v1/admin/...` | Mostly `/api/v1/fleet/...` now (operators, routes, buses, assignments) |
| `/api/v1/user/scan/<qr>/` | `/api/v1/restaurants/scan/<qr>/` |

## Files removed

- `apps/core/` — entirely replaced.
- `apps/core/management/` — no commands were ported; reintroduce as
  needed.
- `apps/core/exceptions.py` (if any) — replaced by
  `apps.accounts.exceptions`.

## Data backfill (not yet written)

Suggested order when we do write the migration script:

1. `User`: one row per distinct phone across v1
   `PassengerProfile` + `RestaurantStaff` + `AdminUser` (de-dup by phone).
2. `Membership`: walk `RestaurantStaff` + `AdminUser.operator` to create rows.
3. `BusOperator`, `Route`, `Bus`, `Restaurant`, `MenuItem`: copy as-is.
4. `MenuCategory`: derive from distinct `MenuItem.category` strings per
   restaurant.
5. `Cart` / `CartItem`: drop (short-lived; not worth migrating).
6. `Order` / `OrderItem`: copy, generating fresh UUIDs; remap
   `menu_item_name` from current `MenuItem.name`.
7. `BusGPSLog`: copy.
8. Skip `AdminUser` table entirely — handled by User.role + Membership.
