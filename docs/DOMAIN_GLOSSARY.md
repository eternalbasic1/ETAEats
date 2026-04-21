# Domain Glossary

Terms that mean something specific in this codebase.

---

**Assignment** — A `BusRestaurantAssignment` row. Links one bus to one
restaurant. Only one active assignment per bus (partial unique index).
Rotating = deactivate the old row + create a new one; always via
`fleet.services.assign_restaurant`.

**Bus** — A physical vehicle. Has a `qr_token` (UUID) passengers scan.
Bus has `current_location` (PostGIS point, latest) + a history table
`BusGPSLog`.

**Bus Operator** — The company that owns buses. **Not a user row.**
Login happens via a `User` with `role=BUS_OPERATOR` + a `Membership`
pointing at this operator.

**Cart** — Session-keyed for anonymous browsers; user-keyed after login.
Single-restaurant constraint (items from more than one restaurant = error).
Clears on checkout.

**Dhaba** — Indian highway roadside restaurant. In the data model these
are `Restaurant` rows located along bus routes.

**FCM** — Firebase Cloud Messaging. The mobile push channel. Token per
user is stored on `User.fcm_token`.

**Fleet** — The `apps/fleet/` domain: operator, routes, buses,
assignments, GPS.

**GPS ping** — `POST /api/v1/fleet/buses/<id>/gps/`. Authenticated call
that updates `Bus.current_location` and appends to `BusGPSLog`. Reserved
for the GPS trigger service (shared secret auth planned via
`INTERNAL_API_SECRET`).

**Membership** — `accounts.Membership` row linking a `User` to a
`Restaurant` OR `BusOperator` (exactly one — DB check constraint) with
an `org_role` (`RESTAURANT_OWNER`, `RESTAURANT_MANAGER`, `RESTAURANT_COOK`,
`OPERATOR_OWNER`, `OPERATOR_ADMIN`). One user may have multiple
memberships.

**OTP** — One-time password. Phone number is the identifier; code is
stored as HMAC-SHA256(code, SECRET_KEY). See `accounts.services.request_otp`
and `verify_otp`. Locked for `OTP_LOCKOUT_SECONDS` after
`OTP_MAX_ATTEMPTS` wrong guesses.

**Passenger** — Bus traveller. `User.role = PASSENGER`. No membership;
they don't belong to an organisation.

**Pickup** — When the bus reaches the restaurant and the passenger
collects their food. Signalled by transitioning the order to `PICKED_UP`.

**Price snapshot** — `OrderItem.unit_price` and `OrderItem.menu_item_name`
are copied from `MenuItem` at checkout time. Updating the menu later
must not change historical orders.

**Proximity trigger** — Planned Celery Beat job that fires when a bus
moves within N km of its assigned restaurant's location. Will emit a
`notify_order_event(..., event='eta_near')` so the restaurant can
start cooking.

**QR scan** — Public, no-auth endpoint
`GET /api/v1/restaurants/scan/<qr_token>/`. Returns bus info + currently
assigned restaurant + menu. The landing page after a passenger scans the
code printed on the bus.

**Razorpay** — Payment gateway. Two verification paths: client-side
signature verify on checkout, and webhook-based reconciliation. Both
use HMAC-SHA256 with `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
respectively.

**Restaurant Staff** — Any user with `role=RESTAURANT_STAFF`. The
specific capability (OWNER / MANAGER / COOK) is on their `Membership`.

**Role** — `User.role` enum: one of `PASSENGER`, `RESTAURANT_STAFF`,
`BUS_OPERATOR`, `ADMIN`. This is the top-level identity. Org-scoped
sub-roles live on `Membership.org_role`.

**Route** — `fleet.Route` — origin + destination + distance. Buses
optionally run on a route; multiple buses per route is fine.

**Session key** — Django session id. Used to identify an anonymous
cart so a passenger can browse + add to cart before login, then merge
on OTP verify (see `orders.services.merge_anonymous_cart_into_user`).

**State transition** — Legal moves in the order lifecycle. Defined in
`ALLOWED_STATUS_TRANSITIONS`. Enforced by `advance_status`.

**WebSocket group** — Channels group name. Two patterns used:
`user.{uuid}` (per-user) and `restaurant.{id}` (staff room). Fan-out
via `notifications.services.ws_to_user` / `ws_to_restaurant`.
