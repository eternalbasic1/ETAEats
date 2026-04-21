# Architecture

## Layers

```
   URL router  →  View  →  Serializer (validate)
                    │
                    ▼
                 Service (mutation, txn boundary)
                    │
                    ▼
               Selector (query)  →  Model  →  Database
```

- **Views** never touch the ORM for writes. They call services.
- **Services** own transactions (`@transaction.atomic`), invariant checks,
  and domain logic. They raise `DomainError` on violations.
- **Selectors** centralise complex read queries (joins, filters). Small
  apps skip them; just query directly in the view if it's one line.
- **Serializers** are pure shape — they `validate_*` inputs and render
  outputs. Never put side effects in `.create()` / `.save()`.
- **Signals** (only used in `notifications`) keep cross-app coupling loose
  — notifications listens to `Order.post_save` instead of `orders`
  importing `notifications`.

## Why a single `User` + `Membership`

v1's three profile tables were a classic newbie mistake:

- Query: "who is this caller?" becomes three `hasattr` checks or a UNION.
- OTP logic was duplicated on `PassengerProfile` and `RestaurantStaff` —
  four fields × two tables = drift waiting to happen.
- Multi-role users (e.g. someone who owns a restaurant _and_ a bus fleet)
  were impossible without hacks.

v2:

- `User.role` is the **primary** identity. `PermissionsMixin` works out of
  the box for Django admin.
- `Membership` is a many-to-many between `User` and an organisation
  (`Restaurant` OR `BusOperator` — DB check constraint enforces exactly
  one). Org-scoped role lives here (`RESTAURANT_OWNER`, `OPERATOR_ADMIN`,
  etc.).
- A user with `role=RESTAURANT_STAFF` and two `Membership` rows can
  manage two restaurants.

## Why services + selectors

Django's default is fat views / fat managers / fat signals, which couples
HTTP concerns with business rules. Every time the v1 code wanted to
"create an order", it had to re-derive totals, validate cart, clear cart,
etc. — inside the view. In v2:

```python
# views.py
order = services.checkout(cart, user=request.user, bus=bus)
```

The service lives in `apps/orders/services.py` and can be called from
anywhere — a management command, a test, a Celery task, a future GraphQL
resolver. Views stay dumb.

## Error envelope

All API responses on error look like:

```json
{"error": {"code": "otp_invalid", "message": "Invalid OTP.", "details": {}}}
```

Three paths into this envelope:

1. **Services raise `DomainError`** — returned directly with the right
   HTTP status + code.
2. **DRF built-in errors** (validation, 404, 403) — passed through
   `api_exception_handler` and reshaped.
3. **Unhandled exceptions** — logged, returned as `{code: server_error}`
   with status 500.

## State machines

Only one so far: `Order.status`. Defined in
`apps/orders/models.py::ALLOWED_STATUS_TRANSITIONS`. Any future status
field (e.g. refund state) should follow the same pattern: a transition
map + a single service function that consults it.

## Cross-app dependencies

```
         accounts
         ▲   ▲   ▲
         │   │   │
    fleet restaurants ─┐
         ▲              │
         └─── orders ───┤
                        │
            payments ───┘
              ▲
              │
        notifications (listens to orders via signals)
```

- `accounts` depends on nothing.
- Everything else may depend on `accounts`.
- `orders` depends on `fleet` (Bus) and `restaurants` (MenuItem).
- `payments` depends on `orders`.
- `notifications` depends on `accounts` directly; on `orders` only via
  signals (loose).

No circular imports. If you find yourself wanting to import `orders` from
`restaurants`, that's a signal to rethink — talk to the user first.

## Async / realtime

- **Channels** for WebSocket fan-out. Two groups: `user.{id}` (per-user)
  and `restaurant.{id}` (per-restaurant staff room).
- **FCM** for mobile push. Called from `notifications.services.push_to_user`.
- **Celery** for any task that takes >200ms or needs retries (not heavily
  used yet; Celery Beat will host periodic proximity-trigger jobs).
