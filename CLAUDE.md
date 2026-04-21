# ETA Eats v2 — Claude Working Notes

Deep-dive guide for active development. Read the workspace-level
`../CLAUDE.md` first if you haven't.

## The non-negotiables

1. **One `User`, one `role`, one `OTPCode`.** Do not add profile tables.
   Org scope lives in `accounts.Membership`, not on the user row.
2. **Views are thin.** Business logic goes in `app/services.py`.
   Complex reads go in `app/selectors.py`.
3. **`Order.status` is only mutated via `orders.services.advance_status`.**
   Illegal transitions raise `DomainError(code='invalid_transition')`.
4. **Error envelope is `{"error": {"code", "message", "details"}}`.**
   Raise `apps.accounts.exceptions.DomainError` for business-rule violations.
   The DRF handler at `apps.accounts.exceptions.api_exception_handler`
   normalises built-in exceptions to the same shape.
5. **Role checks come from `apps.accounts.permissions`.** Don't inline
   `request.user.role == 'PASSENGER'` in views — use `IsPassenger` etc.
6. **OTP codes are never stored plaintext.** `services._hash_code` uses
   HMAC-SHA256 with `SECRET_KEY`; verification is `hmac.compare_digest`.
7. **Price snapshots.** `OrderItem.unit_price` and `menu_item_name` are
   copied at order time. Changing a `MenuItem` must not alter history.
8. **Cart is single-restaurant.** If a passenger adds an item from a
   different restaurant, the service raises `DomainError(code='restaurant_mismatch')`
   — don't silently overwrite.

## File map per app

Every domain app follows this shape:

```
apps/<name>/
├── apps.py              # AppConfig (label matches URL prefix)
├── models.py            # Django models only — no business logic
├── services.py          # mutations, transaction boundaries, domain rules
├── selectors.py         # complex read queries (optional; small apps skip)
├── serializers.py       # DRF serializers — no side effects
├── views.py             # thin; orchestrate serializer + service
├── urls.py              # DRF router + APIView paths
├── admin.py             # Django admin registrations
├── permissions.py       # (accounts only) role classes
├── exceptions.py        # (accounts only) DomainError + handler
└── migrations/
```

## Domain app purposes

| App | Owns |
|-----|------|
| `accounts` | `User`, `OTPCode`, `Membership`, JWT issuance, role permissions |
| `fleet` | `BusOperator`, `Route`, `Bus`, `BusRestaurantAssignment`, `BusGPSLog` |
| `restaurants` | `Restaurant`, `MenuCategory`, `MenuItem`, public QR-scan endpoint |
| `orders` | `Cart`, `CartItem`, `Order` (state machine), `OrderItem` |
| `payments` | Razorpay order creation, checkout signature verify, webhook ingest → reconciliation |
| `notifications` | FCM push, Channels WS consumers, in-app `Notification` inbox, signal listeners on `Order` |

## Order state machine (canonical)

```
PENDING ──► CONFIRMED ──► PREPARING ──► READY ──► PICKED_UP
   │             │
   └─────────────┴──► CANCELLED
```

Defined in `apps/orders/models.py::ALLOWED_STATUS_TRANSITIONS`.
`advance_status` stamps `confirmed_at` / `ready_at` / `picked_up_at` on
the relevant transitions. `payments.services.mark_payment(..., CAPTURED)`
auto-advances `PENDING → CONFIRMED`.

## Auth flow (memorise this)

1. Passenger scans QR → `GET /api/v1/restaurants/scan/<qr_token>/` (public).
2. Browses + adds to cart (session-keyed, no auth).
3. `POST /api/v1/auth/otp/request/ {phone_number}` → OTP logged to console in dev.
4. `POST /api/v1/auth/otp/verify/ {phone_number, code}` → `{user, tokens}`.
   On first login for a phone, a `User` row is created with `role=PASSENGER`.
5. Client uses `Authorization: Bearer <access>`.
6. Restaurant staff + bus operators use the **same OTP flow**. Their role
   is set when the admin creates their `User` + `Membership`.

## Common pitfalls (things I've already bumped into)

- **Don't import models across apps at module load time.** Use string refs
  in FKs (`'restaurants.Restaurant'`) and import models inside functions
  when crossing apps in services.
- **PostGIS `Point(lng, lat)` not `(lat, lng)`.** X-first. See
  `fleet.services.record_gps`.
- **Channels `AsyncJsonWebsocketConsumer` requires `AllowedHostsOriginValidator`.**
  Already set up in `config/asgi.py`; don't remove it.
- **`phonenumber_field` returns `PhoneNumber` objects, not strings.** Cast
  with `str(phone)` before passing to services that do string ops.
- **Migrations are not committed.** Run `makemigrations` locally; PostGIS
  must be installed for the Django GIS imports to resolve.

## When generating new code in this repo

- Follow `docs/CONVENTIONS.md`.
- Check `docs/DOMAIN_GLOSSARY.md` when a term feels ambiguous.
- If you're porting something from v1, log the diff in
  `docs/V1_TO_V2_MAPPING.md`.
- Don't add tests unless explicitly asked (the user said tests come in a
  later pass).

## Things still TODO in v2

- Migrations aren't generated yet — user runs `makemigrations` locally.
- No tests yet.
- SMS provider integration is a stub (`accounts.services._dispatch_sms`).
- No v1 → v2 data backfill script.
- FE (`ETA-Eats/ETA Eats FE/`) hasn't been updated for v2 API shape yet.
