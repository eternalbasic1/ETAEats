# Conventions

## Python / Django

- **Python 3.11+**, Django 4.2. Type hints welcome but not enforced.
- **Four-space indent, no tabs.** Follow PEP 8; 100-column soft limit.
- **Imports**: stdlib → third-party → `django.*` → `apps.*`. One blank
  line between groups.
- **Module order** in each app: `models.py` → `selectors.py` → `services.py`
  → `serializers.py` → `permissions.py` → `views.py` → `urls.py` → `admin.py`.
  (You read them in that order when understanding a flow.)

## Model conventions

- Inherit from `apps.accounts.models.TimeStampedModel` for anything with
  `created_at` / `updated_at` (don't redeclare them).
- Use `UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`
  for externally-referenced rows (User, Cart, Order, Notification,
  WebhookEvent). Keep `BigAutoField` for internal rows.
- **String FKs** across apps: `'restaurants.Restaurant'`, not importing
  the class. Prevents import cycles.
- **`on_delete`**: `PROTECT` for orders/payments (data you can't lose),
  `CASCADE` for owned children (cart items), `SET_NULL` for soft links
  (route on a bus).
- **Partial unique indexes** for "one active X per Y" constraints — see
  `BusRestaurantAssignment.unique_active_bus_assignment`.

## Service functions

- One service function per meaningful verb: `request_otp`, `verify_otp`,
  `checkout`, `advance_status`, `record_gps`, etc.
- Wrap in `@transaction.atomic` if the function writes.
- Validate first, mutate second, return the final state (usually the
  mutated model instance).
- Raise `DomainError(message, code=..., details=...)` on rule violations —
  never return `None` / `False` to signal failure.
- Keep them callable from anywhere (views, tasks, tests, shell). No
  references to `request` or `session`.

## Serializers

- `read_only_fields` for anything the server owns (`id`, `created_at`,
  `updated_at`, audit fields, status when the caller shouldn't mutate
  it directly).
- Don't put side effects in `.create()` / `.update()` — the view should
  call a service and then render the result.
- Write dedicated input serializers for non-model payloads (e.g.
  `AddCartItemSerializer`, `AdvanceStatusSerializer`). They double as
  API docs for drf-spectacular.

## Views

- Thin. Pattern:
  1. Parse + validate with a serializer.
  2. Call a service function.
  3. Render the result with another serializer.
- Use `ViewSet` (router-wired) for CRUD. Use `APIView` for verbs that
  don't map to CRUD (`request_otp`, `scan_bus_qr`).
- `get_queryset` filters by caller scope — membership, passenger ownership,
  etc. Don't rely on permission classes alone to gate data.

## Permissions

- Use the classes in `apps.accounts.permissions`: `IsPassenger`,
  `IsRestaurantStaff`, `IsBusOperator`, `IsAdmin`, `IsAdminOrOperator`.
- Scope (which restaurant's orders can this staff see?) goes in
  `get_queryset` via `Membership` joins — not in permission classes.

## Naming

- Models: singular PascalCase (`Bus`, not `Buses`).
- Services: snake_case verbs (`request_otp`, not `otp_request`).
- URL paths: kebab-case (`/auth/otp/request/`, `/orders/cart/items/<id>/`).
- DRF actions: snake_case (`@action(url_path='mark-read')` if the URL
  differs from the method name).

## Error codes

Keep codes short, snake_case, scoped:

```
otp_not_found   otp_expired   otp_invalid   otp_locked
cart_empty   restaurant_mismatch   item_unavailable
invalid_transition
rp_mismatch   rp_bad_signature
```

New codes land in the raising service; document them in the response
schema if it's user-facing.

## Migrations

- Generate with `python manage.py makemigrations <app>`; don't hand-write
  unless doing a `RunPython` data migration.
- Squash when an app hits ~20 migrations.
- **Never** edit a committed migration — write a new one.

## Commits

- The workspace root is a git repo on branch `fixed-fe` (v1 territory).
  v2 lives in a sibling folder — decide whether it gets its own repo or
  becomes a subtree before the next commit. Ask the user.

## Documentation

- Keep `README.md` user-facing (run it, endpoints, env vars).
- Keep `docs/` contributor-facing (why decisions were made, conventions).
- When you fix a non-obvious bug, don't leave a `# was foo before` comment
  — update the doc that would've prevented it.
