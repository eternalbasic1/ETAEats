# Shared packages

These packages are imported by all three apps (`passenger`,
`restaurant`, `admin`). See `../design.md` § 2.1 for the full layout
and § 11 for naming + reuse rules.

| Package | Purpose | Key exports |
|---------|---------|-------------|
| `@eta/ui-tokens`     | Design tokens — colors, typography, spacing, radius, shadow, motion | `lightTheme`, `palette`, `typography`, `spacing`, `radius`, `shadow`, `duration`, `easing`, `spring` |
| `@eta/ui-components` | Cross-app primitives + `ThemeProvider` | `ThemeProvider`, `useTheme`, `Button`, `Input`, `OTPInput`, `Card`, `Badge`, `Chip`, `Stepper`, `Spinner`, `EmptyState`, `SectionHeader`, `Skeleton`, `BottomSheet`, `ConnectionBadge`, `Toast` |
| `@eta/api-client`    | Axios + JWT refresh + endpoints + error parser | `api`, `endpoints.*`, `DomainError` |
| `@eta/auth`          | Token storage, zustand auth store, OTP hooks, role guards, session lifecycle | `useAuthStore`, `useAuth`, `useRequireRole`, `tokenStore` |
| `@eta/realtime`      | WebSocket wrapper + per-channel hooks + AppState gating | `createSocket`, `useUserSocket`, `useRestaurantSocket` |
| `@eta/types`         | Backend-mirrored TS types and Zod schemas | `User`, `Order`, `OrderStatus`, `ALLOWED_STATUS_TRANSITIONS`, `Restaurant`, `MenuItem`, etc. |
| `@eta/utils`         | Currency, date, phone, logger, env | `formatINR`, `parsePhone`, `log`, `env` |

## Rules for adding a new package

1. Read `../design.md` § 11.5 (Reusable component rules) and § 11.6 (PR
   standards).
2. A new package needs an ADR in `../docs/proposals/` arguing why it
   can't live in an existing package or in an app.
3. Public surface goes through `src/index.ts` only — no deep imports
   from other packages or apps.
4. Every package depends only on `@eta/*` packages plus the workspace's
   approved third-party libs (see § 1.4 stack table).
