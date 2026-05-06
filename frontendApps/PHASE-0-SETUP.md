# Phase 0 — setup runbook

> The workspace skeleton is in place. This file is the **exact** sequence
> of commands that takes us from skeleton → 3 booting Expo apps. Follow
> top-to-bottom; do not improvise.

## Prerequisites (verify once)

```bash
node --version       # must be >= 20.11.0 — see .nvmrc
corepack --version   # ships with Node; needed for pnpm

# If you don't have pnpm yet:
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm --version       # 9.12.0
```

## Step 1 — Install workspace dev tooling

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontendApps

# Installs root devDeps (typescript, eslint, prettier).
pnpm install
```

This will create a `pnpm-lock.yaml` at the workspace root. Commit it.

## Step 2 — Verify shared packages typecheck

```bash
pnpm typecheck
```

All 7 packages should typecheck (they only have placeholder exports
right now, so this is a smoke test of the workspace config).

## Step 3 — Scaffold the three Expo apps

These three commands each create a fresh Expo TypeScript app in the
existing folder. Run them one at a time — Expo's create script can be
chatty.

```bash
# From frontendApps/ root.
# IMPORTANT: each app folder already exists (with a CLAUDE.md).
# We use --template + --yes and accept overwrite prompts as needed.

# Passenger
pnpm dlx create-expo-app@latest passenger \
  --template blank-typescript \
  --no-install
# When prompted to overwrite the existing folder, say YES — only CLAUDE.md
# will be touched, and we'll restore it in Step 5.

# Restaurant
pnpm dlx create-expo-app@latest restaurant \
  --template blank-typescript \
  --no-install

# Admin
pnpm dlx create-expo-app@latest admin \
  --template blank-typescript \
  --no-install
```

`--no-install` is critical — we want pnpm at the workspace root to
manage installs, not npm at the app level.

## Step 4 — Wire the apps for monorepo (per app)

For each of `passenger/`, `restaurant/`, `admin/`:

### 4a. Replace `metro.config.js`

```js
// <app>/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

### 4b. Add to `<app>/package.json`

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "echo \"no tests yet\" && exit 0"
  },
  "dependencies": {
    "@eta/api-client": "workspace:*",
    "@eta/auth": "workspace:*",
    "@eta/realtime": "workspace:*",
    "@eta/types": "workspace:*",
    "@eta/ui-components": "workspace:*",
    "@eta/ui-tokens": "workspace:*",
    "@eta/utils": "workspace:*"
  }
}
```

(Keep the Expo / React deps the create script added.)

### 4c. Restore `<app>/CLAUDE.md` if Expo overwrote it

```bash
git checkout <app>/CLAUDE.md
```

## Step 5 — Convert each app to expo-router (file-based routing)

```bash
# Run inside each app folder.
pnpm --filter <app> add expo-router react-native-screens react-native-safe-area-context
pnpm --filter <app> add expo-linking expo-constants expo-status-bar
pnpm --filter <app> add zustand axios @tanstack/react-query
pnpm --filter <app> add react-hook-form zod @hookform/resolvers
pnpm --filter <app> add expo-secure-store react-native-mmkv
pnpm --filter <app> add react-native-reanimated lucide-react-native
pnpm --filter <app> add @sentry/react-native posthog-react-native
```

Then update each `<app>/package.json`:

```json
{
  "main": "expo-router/entry"
}
```

Set `expo.scheme` per app in `app.json` / `app.config.ts`:
- passenger: `"scheme": "etaeats"`
- restaurant: `"scheme": "etaeatskitchen"`
- admin: `"scheme": "etaeatsadmin"`

Set bundle IDs per `design.md § A.3`.

## Step 6 — Per-app additions (only where needed)

Passenger only:
```bash
pnpm --filter passenger add expo-camera react-native-razorpay
```

Restaurant only:
```bash
pnpm --filter restaurant add expo-av expo-haptics expo-image-picker victory-native
```

Admin only:
```bash
pnpm --filter admin add expo-local-authentication expo-clipboard
```

## Step 7 — Verify

```bash
pnpm install                # one final install at root
pnpm typecheck              # all 10 workspaces (3 apps + 7 packages) clean
pnpm passenger:start        # iOS sim should open the default Expo screen
pnpm restaurant:start
pnpm admin:start
```

If all three boot, **Phase 0 DoD is met** — see `design.md § 10 Phase 0`.

## Step 8 — First commit

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontendApps/
git status                  # sanity check
git commit -m "feat(mobile): scaffold frontendApps monorepo (Phase 0)"
```

---

## Why we did NOT run these commands inside the planning phase

Two reasons:
1. **Time + disk cost.** A full Expo install per app downloads ~500 MB
   of native dependencies. Running it 3× during a planning session is
   wasteful; you (the human) can do it in one focused 15-minute window.
2. **EAS account binding.** `pnpm dlx create-expo-app` and the first
   `eas init` bind the project to your Expo account. That's a decision
   you should make explicitly, not as a side-effect of an AI agent
   running commands.

Once these steps are done, hand control back to the agent (or any
agent) for Phase 1 (design tokens + primitives) — the workspace will
be ready.
