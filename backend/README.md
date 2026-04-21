# ETA Eats v2 — Backend

Highway food pre-ordering platform. This is the revamped backend: same domain,
same stack (Django + DRF + PostGIS + Channels + Celery + SimpleJWT + FCM +
Razorpay), but with a cleaner, domain-split architecture and a single-table
user model instead of v1's three profile tables.

## What's different from v1

| v1 | v2 |
|----|----|
| 3 profile tables (`PassengerProfile`, `RestaurantStaff`, `AdminUser`) | One `User` table with a `role` enum + `Membership` table for org scope |
| OTP fields duplicated on each profile | One `OTPCode` table, one set of services |
| Single `core` Django app | 6 domain apps: `accounts`, `fleet`, `restaurants`, `orders`, `payments`, `notifications` |
| Views contained business logic | Views stay thin; logic lives in `services.py` / `selectors.py` |
| Order status as loose CharField | Explicit state machine with validated transitions |
| `settings.py` monolith | `config/settings/{base,dev,prod}.py` |

## Architecture

```
backend/
├── config/
│   ├── settings/{base,dev,prod}.py
│   ├── urls.py          # /api/v1/ mounts every app
│   ├── asgi.py          # HTTP + WebSocket routing
│   ├── wsgi.py
│   └── celery.py
├── apps/
│   ├── accounts/        # User, OTPCode, Membership, JWT
│   ├── fleet/           # BusOperator, Route, Bus, Assignment, GPS
│   ├── restaurants/     # Restaurant, MenuCategory, MenuItem, QR scan
│   ├── orders/          # Cart, CartItem, Order (state machine), OrderItem
│   ├── payments/        # Razorpay orders, checkout verify, webhooks
│   └── notifications/   # FCM push + Channels WS + in-app inbox
├── manage.py
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

Each app follows the same layout:

```
app/
├── apps.py
├── models.py
├── services.py         # business logic (mutations)
├── selectors.py        # read queries (where they get complex)
├── serializers.py
├── views.py
├── urls.py
├── admin.py
└── migrations/
```

## Data model

### Single-table User with role

`accounts.User` (`AbstractBaseUser + PermissionsMixin`):

- `id`: UUID
- `phone_number`: unique, `USERNAME_FIELD` → passengers log in with this
- `email`: optional, unique
- `role`: one of `PASSENGER`, `RESTAURANT_STAFF`, `BUS_OPERATOR`, `ADMIN`
- `full_name`, `gender`, `fcm_token`
- `is_active` / `is_staff` / `is_superuser`

`accounts.Membership` links a user to an organisation (restaurant **or**
operator — a DB check constraint enforces exactly one) with an org-scoped
sub-role (`RESTAURANT_OWNER/MANAGER/COOK`, `OPERATOR_OWNER/OPERATOR_ADMIN`).
One user can have multiple memberships.

### OTP

`accounts.OTPCode` — one row per outstanding code, keyed by `phone_number +
purpose`. Codes are HMAC-SHA256 hashed with `SECRET_KEY`; verification is
constant-time. After `OTP_MAX_ATTEMPTS` wrong guesses the phone is locked
for `OTP_LOCKOUT_SECONDS`.

### Order state machine

```
PENDING ──► CONFIRMED ──► PREPARING ──► READY ──► PICKED_UP
    │            │
    └────────────┴──► CANCELLED (with reason)
```

`orders.services.advance_status()` is the only function allowed to change
`Order.status`. Invalid transitions raise `DomainError(code=invalid_transition)`.
Payment confirmation auto-advances `PENDING → CONFIRMED`.

## Auth flow

1. Passenger opens the app on a bus → scans QR code → `GET /api/v1/restaurants/scan/<qr_token>/` (no auth) returns bus + assigned restaurant + menu.
2. Passenger adds items to cart (session-keyed, still no auth).
3. At checkout, `POST /api/v1/auth/otp/request/ {phone_number}` — OTP is logged to console in dev or dispatched via SMS provider in prod.
4. `POST /api/v1/auth/otp/verify/ {phone_number, code}` returns `{user, tokens: {access, refresh}}`. On first login for a phone, a `User` row is created with `role=PASSENGER`.
5. Client sends `Authorization: Bearer <access>` on subsequent requests.
6. `POST /api/v1/auth/token/refresh/` to rotate; `POST /api/v1/auth/logout/` blacklists the refresh.

Restaurant staff and bus operators share the same OTP flow using the phone
number attached to their `User` row. Their `Membership` determines which
restaurant(s) or operator they can manage.

## Endpoint summary

```
POST   /api/v1/auth/otp/request/
POST   /api/v1/auth/otp/verify/
POST   /api/v1/auth/token/refresh/
POST   /api/v1/auth/logout/
GET    /api/v1/auth/me/
PATCH  /api/v1/auth/me/

GET    /api/v1/restaurants/scan/<qr_token>/           (public)
CRUD   /api/v1/restaurants/                          (admin/operator write; any read)
CRUD   /api/v1/restaurants/menu-items/               (restaurant staff)
CRUD   /api/v1/restaurants/menu-categories/          (restaurant staff)

CRUD   /api/v1/fleet/operators/                      (admin/operator)
CRUD   /api/v1/fleet/routes/
CRUD   /api/v1/fleet/buses/
POST   /api/v1/fleet/buses/<id>/assign_restaurant/
POST   /api/v1/fleet/buses/<id>/gps/
GET    /api/v1/fleet/assignments/

GET/POST      /api/v1/orders/cart/                   (anon or auth)
PATCH/DELETE  /api/v1/orders/cart/items/<id>/
POST          /api/v1/orders/checkout/               (passenger)
GET           /api/v1/orders/my/                     (passenger)
GET           /api/v1/orders/restaurant/             (restaurant staff)
POST          /api/v1/orders/restaurant/<id>/advance/

POST   /api/v1/payments/razorpay/order/              (passenger)
POST   /api/v1/payments/razorpay/confirm/            (passenger)
POST   /api/v1/payments/razorpay/webhook/            (Razorpay only)

GET    /api/v1/notifications/
POST   /api/v1/notifications/<id>/mark-read/
POST   /api/v1/notifications/mark-all-read/
```

WebSocket channels:

```
ws://.../ws/user/                     (joins `user.{self.id}`)
ws://.../ws/restaurant/<restaurant_id>/   (membership-gated)
```

## Error shape

All API errors return a consistent envelope:

```json
{"error": {"code": "otp_invalid", "message": "Invalid OTP.", "details": {}}}
```

Raise `apps.accounts.exceptions.DomainError(message, code=..., details=...)`
from any service to produce this shape. DRF's built-in errors pass through the
same handler (`apps.accounts.exceptions.api_exception_handler`).

## Quick start (local, no Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # edit if needed

# Postgres+PostGIS must be running locally
createdb eta_eats_v2
psql eta_eats_v2 -c 'CREATE EXTENSION IF NOT EXISTS postgis;'

python manage.py makemigrations accounts fleet restaurants orders payments notifications
python manage.py migrate
python manage.py createsuperuser   # prompts for phone_number + password

# Run HTTP + WS via daphne
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# In another shell:
celery -A config worker -l info
celery -A config beat -l info
```

API docs: http://localhost:8000/api/docs/

## Docker

```bash
docker compose up --build
```

Spins up Postgres (PostGIS), Redis, Django (daphne), Celery worker, Celery beat.

## Environment variables

See `.env.example`. Key ones:

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | `postgis://...` — PostGIS required |
| `REDIS_URL` | Channels broker + Celery broker/result backend |
| `SECRET_KEY` | Django key **and** OTP hashing key |
| `OTP_LENGTH`, `OTP_TTL_SECONDS`, `OTP_MAX_ATTEMPTS`, `OTP_LOCKOUT_SECONDS` | OTP policy |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` / `_WEBHOOK_SECRET` | Razorpay |
| `FIREBASE_CREDENTIALS_PATH`, `FIREBASE_PROJECT_ID` | FCM push |
| `AWS_*` | S3 (optional; falls back to local media in dev) |
| `INTERNAL_API_SECRET` | Shared secret for GPS trigger service → backend |

## Next steps

- Per-app test suites (pytest + `pytest-django`).
- SMS provider integration inside `accounts.services._dispatch_sms`.
- Management command to backfill v1 data into v2 models (if migrating
  an existing deployment rather than starting fresh).
- Proximity triggers: Celery Beat job that queries buses within N km of
  their assigned restaurant and emits `notify_order_event(..., event='eta_near')`.
