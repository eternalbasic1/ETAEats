# ETA Eats Passenger App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ETA Eats passenger web app — a mobile-first Next.js 14 PWA that lets bus passengers scan a QR code, browse a menu, pay, and track their order live.

**Architecture:** Standalone Next.js 14 App Router app at `ETA-Eats-v2/frontend/passenger/`. Connects to the Django/DRF v2 backend at `localhost:8000`. Three Zustand stores (auth, cart, session) + TanStack Query for server state + native WebSocket for real-time order tracking.

**Tech Stack:** Next.js 14, TypeScript 5 strict, Tailwind CSS 3, Framer Motion 10, Zustand 4, TanStack Query 5, Axios 1, React Hook Form 7, Zod 3, Sonner 1, next-pwa 5.

---

## Backend prerequisite — JWT WebSocket middleware

The Django Channels `AuthMiddlewareStack` authenticates via Django sessions, not JWT. Before the frontend WebSocket code works, a one-file backend addition is needed.

### Task 0: Add JWT WebSocket auth middleware to backend

**Files:**
- Create: `backend/apps/accounts/ws_middleware.py`
- Modify: `backend/config/asgi.py`

- [ ] **Step 0.1 — Create JWT WebSocket middleware**

Create `backend/apps/accounts/ws_middleware.py`:

```python
"""
JWT authentication middleware for Django Channels WebSocket connections.
Reads ?token=<access_token> from the query string and populates scope['user'].
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


@database_sync_to_async
def _get_user(token_key: str):
    from apps.accounts.models import User
    try:
        token = AccessToken(token_key)
        return User.objects.get(id=token['user_id'])
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware:
    """Authenticates WebSocket connections using a JWT token in the query string."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token_list = params.get('token', [])

        if token_list:
            scope['user'] = await _get_user(token_list[0])
        else:
            scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
```

- [ ] **Step 0.2 — Wire middleware into asgi.py**

Replace `backend/config/asgi.py`:

```python
import os

import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

django_asgi_app = get_asgi_application()

from apps.accounts.ws_middleware import JWTAuthMiddlewareStack  # noqa: E402
from apps.notifications.routing import websocket_urlpatterns    # noqa: E402

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(URLRouter(websocket_urlpatterns))
    ),
})
```

- [ ] **Step 0.3 — Commit backend change**

```bash
cd ETA-Eats-v2/backend
git add apps/accounts/ws_middleware.py config/asgi.py
git commit -m "feat(ws): add JWT auth middleware for Channels WebSocket connections"
```

---

## Frontend tasks

All subsequent tasks live under `ETA-Eats-v2/frontend/passenger/`.

---

### Task 1: Project Scaffold

**Files:**
- Create: `frontend/passenger/` — entire Next.js app

- [ ] **Step 1.1 — Scaffold Next.js 14 app**

```bash
cd ETA-Eats-v2/frontend
npx create-next-app@14 passenger \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
```

When prompted, accept all defaults. This creates `frontend/passenger/`.

- [ ] **Step 1.2 — Install dependencies**

```bash
cd passenger
npm install \
  axios@^1.7.0 \
  zustand@^4.5.0 \
  @tanstack/react-query@^5.40.0 \
  framer-motion@^11.0.0 \
  react-hook-form@^7.51.0 \
  zod@^3.23.0 \
  @hookform/resolvers@^3.6.0 \
  sonner@^1.5.0 \
  lucide-react@^0.400.0

npm install --save-dev \
  next-pwa@^5.6.0 \
  @types/node@^20.0.0
```

- [ ] **Step 1.3 — Set up environment files**

Create `frontend/passenger/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Create `frontend/passenger/.env.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

- [ ] **Step 1.4 — Update tsconfig.json for strict mode**

Replace `frontend/passenger/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 1.5 — Update next.config.ts**

Replace `frontend/passenger/next.config.ts`:

```ts
import type { NextConfig } from 'next'
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

module.exports = withPWA(nextConfig)
```

- [ ] **Step 1.6 — Verify scaffold compiles**

```bash
npm run build
```

Expected: build succeeds (ignore PWA warnings in dev).

- [ ] **Step 1.7 — Commit**

```bash
cd ETA-Eats-v2/frontend/passenger
git add .
git commit -m "feat(passenger): scaffold Next.js 14 app with all dependencies"
```

---

### Task 2: Design System — Tokens, Tailwind, Base Components

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Spinner.tsx`
- Create: `src/components/ui/index.ts`

- [ ] **Step 2.1 — Dark Premium design tokens in globals.css**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg:             #0D0D0D;
  --surface:        #111111;
  --surface-2:      #1A1A2E;
  --border:         rgba(255,255,255,0.08);
  --primary:        #7C5CFC;
  --primary-soft:   #a78bfa;
  --primary-glow:   rgba(124,92,252,0.25);
  --text-primary:   #FFFFFF;
  --text-secondary: #888888;
  --text-muted:     #444444;
  --success:        #22c55e;
  --error:          #ef4444;
  --warning:        #f59e0b;
  --radius-sm:      8px;
  --radius-md:      12px;
  --radius-lg:      16px;
  --radius-xl:      20px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--bg);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
}

/* Scrollbar hidden on mobile menu tabs */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

- [ ] **Step 2.2 — Tailwind config with Dark Premium tokens**

Replace `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:        'var(--bg)',
        surface:   'var(--surface)',
        surface2:  'var(--surface-2)',
        primary:   'var(--primary)',
        'primary-soft': 'var(--primary-soft)',
        'primary-glow': 'var(--primary-glow)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        success:   'var(--success)',
        error:     'var(--error)',
        warning:   'var(--warning)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--primary), var(--primary-soft))',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2.3 — Add Inter font to layout.tsx**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ETA Eats — Order Before You Arrive',
  description: 'Pre-order highway food from your bus',
  manifest: '/manifest.json',
  themeColor: '#0D0D0D',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2.4 — Button component**

Create `src/components/ui/Button.tsx`:

```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary: 'bg-gradient-primary text-white shadow-lg shadow-primary/30 active:scale-95',
      ghost:   'bg-surface2 text-text-secondary hover:text-text-primary border border-white/8',
      danger:  'bg-error/10 text-error border border-error/30',
    }
    const sizes = {
      sm: 'h-9  px-4 text-sm',
      md: 'h-11 px-6 text-sm',
      lg: 'h-13 px-8 text-base',
    }
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
```

- [ ] **Step 2.5 — Card component**

Create `src/components/ui/Card.tsx`:

```tsx
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Card({ glow, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-white/8 p-4',
        glow && 'shadow-lg shadow-primary-glow border-primary/30',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2.6 — Badge component**

Create `src/components/ui/Badge.tsx`:

```tsx
import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'primary', dot, className, children }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-primary/15 text-primary-soft border-primary/30',
    success: 'bg-success/15 text-success border-success/30',
    error:   'bg-error/15 text-error border-error/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    muted:   'bg-surface2 text-text-secondary border-white/8',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
      variants[variant], className,
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full bg-current')} />}
      {children}
    </span>
  )
}
```

- [ ] **Step 2.7 — Spinner component**

Create `src/components/ui/Spinner.tsx`:

```tsx
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 rounded-full border-2 border-white/20 border-t-primary animate-spin',
        className,
      )}
    />
  )
}
```

- [ ] **Step 2.8 — Create utils helper and barrel exports**

Create `src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install clsx and tailwind-merge:

```bash
npm install clsx tailwind-merge
```

Create `src/components/ui/index.ts`:

```ts
export { Button }  from './Button'
export { Card }    from './Card'
export { Badge }   from './Badge'
export { Spinner } from './Spinner'
```

- [ ] **Step 2.9 — Commit**

```bash
git add .
git commit -m "feat(passenger): design system — Dark Premium tokens, Tailwind config, base UI components"
```

---

### Task 3: API Client + TypeScript Types

**Files:**
- Create: `src/lib/api.types.ts`
- Create: `src/lib/api.ts`
- Create: `src/lib/razorpay.ts`

- [ ] **Step 3.1 — Define all backend response types**

Create `src/lib/api.types.ts`:

```ts
// ── Auth ──────────────────────────────────────────────────────────────────
export interface User {
  id: string
  phone_number: string
  full_name: string
  email: string | null
  gender: 'M' | 'F' | 'O' | ''
  role: 'PASSENGER' | 'RESTAURANT_STAFF' | 'BUS_OPERATOR' | 'ADMIN'
  fcm_token: string
  is_active: boolean
  is_staff: boolean
  created_at: string
  updated_at: string
}

export interface Tokens {
  access: string
  refresh: string
}

export interface AuthResponse {
  user: User
  tokens: Tokens
}

// ── Scan ──────────────────────────────────────────────────────────────────
export interface BusScanResult {
  bus: {
    id: number
    name: string
    number_plate: string
  }
  restaurant: Restaurant | null
  menu: MenuItem[]
  detail?: string
}

// ── Restaurant ────────────────────────────────────────────────────────────
export interface Restaurant {
  id: number
  name: string
  owner_name: string
  phone_number: string
  email: string
  address: string
  fssai_license_number: string
  hygiene_rating: string | null
  latitude: number
  longitude: number
  is_active: boolean
  created_at: string
}

// ── Menu ──────────────────────────────────────────────────────────────────
export interface MenuCategory {
  id: number
  name: string
  sort_order: number
}

export interface MenuItem {
  id: number
  restaurant: number
  category: number | null
  category_name: string | null
  name: string
  description: string
  price: string
  photo_url: string
  is_available: boolean
  prep_time_minutes: number
  created_at: string
}

// ── Cart ──────────────────────────────────────────────────────────────────
export interface CartItem {
  id: number
  menu_item: number
  menu_item_name: string
  quantity: number
  unit_price: string
  line_total: string
}

export interface Cart {
  id: string
  bus: number | null
  restaurant: number | null
  items: CartItem[]
  total: string
  created_at: string
  updated_at: string
}

// ── Orders ────────────────────────────────────────────────────────────────
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'CANCELLED'
export type PaymentStatus = 'UNPAID' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED'

export interface OrderItem {
  id: number
  menu_item: number
  menu_item_name: string
  quantity: number
  unit_price: string
  line_total: string
}

export interface Order {
  id: string
  passenger: string
  bus: number
  bus_name: string
  restaurant: number
  restaurant_name: string
  status: OrderStatus
  payment_status: PaymentStatus
  total_amount: string
  items: OrderItem[]
  razorpay_order_id: string
  razorpay_payment_id: string
  confirmed_at: string | null
  ready_at: string | null
  picked_up_at: string | null
  cancelled_reason: string
  created_at: string
  updated_at: string
}

// ── Payments ──────────────────────────────────────────────────────────────
export interface RazorpayOrderPayload {
  razorpay_order_id: string
  amount: number
  currency: string
  key_id: string
}

// ── WebSocket ─────────────────────────────────────────────────────────────
export interface OrderStatusPayload {
  order_id: string
  event: string
  status: OrderStatus
  title?: string
  body?: string
}

// ── Pagination ────────────────────────────────────────────────────────────
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

- [ ] **Step 3.2 — Axios instance with JWT interceptors**

Create `src/lib/api.ts`:

```ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// ── Token helpers ─────────────────────────────────────────────────────────
// These read/write directly to localStorage so the interceptor can use them
// synchronously without importing the Zustand store (avoids circular deps).
const TOKEN_KEY   = 'eta-auth'

export function getStoredTokens(): { access: string; refresh: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ access, refresh }))
}

export function clearStoredTokens() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

// ── Request interceptor — attach access token ─────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getStoredTokens()
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`
  }
  return config
})

// ── Response interceptor — silent refresh on 401 ─────────────────────────
let isRefreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const tokens = getStoredTokens()
    if (!tokens?.refresh) {
      clearStoredTokens()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((newAccess: string) => {
          original.headers.Authorization = `Bearer ${newAccess}`
          resolve(api(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/v1/auth/token/refresh/`,
        { refresh: tokens.refresh },
      )
      const newAccess: string = data.access
      setStoredTokens(newAccess, tokens.refresh)
      queue.forEach((cb) => cb(newAccess))
      queue = []
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch {
      clearStoredTokens()
      queue = []
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
```

- [ ] **Step 3.3 — Razorpay script loader**

Create `src/lib/razorpay.ts`:

```ts
import type { RazorpayOrderPayload } from './api.types'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  prefill: { contact: string }
  theme: { color: string }
  handler: (response: RazorpayResponse) => void
  modal: { ondismiss: () => void }
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
}

export function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Razorpay failed to load'))
    document.body.appendChild(script)
  })
}

export async function openRazorpay(
  payload: RazorpayOrderPayload,
  phoneNumber: string,
  onSuccess: (res: RazorpayResponse) => void,
  onDismiss: () => void,
) {
  await loadRazorpay()
  const rp = new window.Razorpay({
    key:        payload.key_id,
    amount:     payload.amount,
    currency:   payload.currency,
    order_id:   payload.razorpay_order_id,
    name:       'ETA Eats',
    description: 'Highway food pre-order',
    prefill:    { contact: phoneNumber },
    theme:      { color: '#7C5CFC' },
    handler:    onSuccess,
    modal:      { ondismiss: onDismiss },
  })
  rp.open()
}
```

- [ ] **Step 3.4 — Commit**

```bash
git add .
git commit -m "feat(passenger): API client, TypeScript types, Razorpay loader"
```

---

### Task 4: Zustand Stores

**Files:**
- Create: `src/stores/auth.store.ts`
- Create: `src/stores/cart.store.ts`
- Create: `src/stores/session.store.ts`

- [ ] **Step 4.1 — Auth store**

Create `src/stores/auth.store.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/api.types'
import { setStoredTokens, clearStoredTokens } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, access: string, refresh: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, access, refresh) => {
        setStoredTokens(access, refresh)
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true })
      },

      clearAuth: () => {
        clearStoredTokens()
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'eta-auth',
      // Only persist tokens + user — not the whole state object
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)
```

- [ ] **Step 4.2 — Cart store**

Create `src/stores/cart.store.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/lib/api.types'

interface CartState {
  cartId: string | null
  busId: number | null
  restaurantId: number | null
  items: CartItem[]
  setCart: (cartId: string, busId: number | null, restaurantId: number | null, items: CartItem[]) => void
  setItems: (items: CartItem[]) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      busId: null,
      restaurantId: null,
      items: [],

      setCart: (cartId, busId, restaurantId, items) =>
        set({ cartId, busId, restaurantId, items }),

      setItems: (items) => set({ items }),

      clearCart: () =>
        set({ cartId: null, busId: null, restaurantId: null, items: [] }),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + parseFloat(i.line_total), 0),
    }),
    { name: 'eta-cart' }
  )
)
```

- [ ] **Step 4.3 — Session store (not persisted)**

Create `src/stores/session.store.ts`:

```ts
import { create } from 'zustand'

interface BusInfo {
  id: number
  name: string
  numberPlate: string
}

interface RestaurantInfo {
  id: number
  name: string
  address: string
  hygieneRating: string | null
}

interface SessionState {
  qrToken: string | null
  bus: BusInfo | null
  restaurant: RestaurantInfo | null
  setSession: (qrToken: string, bus: BusInfo, restaurant: RestaurantInfo) => void
  clearSession: () => void
}

// NOT persisted — intentional. A new QR scan always starts fresh.
export const useSessionStore = create<SessionState>()((set) => ({
  qrToken: null,
  bus: null,
  restaurant: null,

  setSession: (qrToken, bus, restaurant) =>
    set({ qrToken, bus, restaurant }),

  clearSession: () =>
    set({ qrToken: null, bus: null, restaurant: null }),
}))
```

- [ ] **Step 4.4 — Wrap app in QueryClientProvider + Toaster**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ETA Eats — Order Before You Arrive',
  description: 'Pre-order highway food from your bus',
  manifest: '/manifest.json',
  themeColor: '#0D0D0D',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1A1A2E',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
```

Create `src/components/layout/Providers.tsx`:

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 5 * 60 * 1000, retry: 1 },
      },
    })
  )
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

- [ ] **Step 4.5 — Commit**

```bash
git add .
git commit -m "feat(passenger): Zustand stores (auth, cart, session) and QueryClient provider"
```

---

### Task 5: Middleware + App Root Redirect

**Files:**
- Create: `src/middleware.ts`
- Modify: `src/app/page.tsx`

- [ ] **Step 5.1 — Root page redirects to scan/invalid**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/scan/invalid')
}
```

- [ ] **Step 5.2 — Middleware protects /orders and /profile**

Create `src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/orders', '/profile']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const raw = request.cookies.get('eta-auth')?.value
      ?? request.headers.get('x-eta-auth')

    // For client-side auth (localStorage) we can't read tokens in middleware.
    // Instead we let the page handle the redirect by checking Zustand on mount.
    // Middleware only handles the case where the cookie exists (future SSR auth).
    // The page component does the actual guard.
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/orders/:path*', '/profile/:path*'],
}
```

> Note: Because auth is stored in localStorage (client-side only), the actual redirect for unauthenticated users happens in each protected page component via a `useEffect` that checks `useAuthStore`. The middleware is scaffolded for future server-side auth.

- [ ] **Step 5.3 — Commit**

```bash
git add .
git commit -m "feat(passenger): middleware scaffold and root redirect"
```

---

### Task 6: Scan Pages

**Files:**
- Create: `src/app/scan/[qr_token]/page.tsx`
- Create: `src/app/scan/invalid/page.tsx`
- Create: `src/app/scan/no-restaurant/page.tsx`
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 6.1 — useAuth hook**

Create `src/hooks/useAuth.ts`:

```ts
import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import type { AuthResponse } from '@/lib/api.types'

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  async function requestOTP(phoneNumber: string): Promise<boolean> {
    setLoading(true)
    try {
      await api.post('/auth/otp/request/', { phone_number: phoneNumber })
      return true
    } catch {
      toast.error('Could not send OTP. Check your number and try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>('/auth/otp/verify/', {
        phone_number: phoneNumber,
        code,
      })
      setAuth(data.user, data.tokens.access, data.tokens.refresh)
      return true
    } catch {
      toast.error('Invalid OTP. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    clearAuth()
  }

  return { requestOTP, verifyOTP, logout, loading, isAuthenticated, user }
}
```

- [ ] **Step 6.2 — Scan QR page**

Create `src/app/scan/[qr_token]/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Utensils, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useSessionStore } from '@/stores/session.store'
import api from '@/lib/api'
import type { BusScanResult } from '@/lib/api.types'

export default function ScanPage() {
  const router = useRouter()
  const { qr_token } = useParams<{ qr_token: string }>()
  const { setSession } = useSessionStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!qr_token) return

    api.get<BusScanResult>(`/restaurants/scan/${qr_token}/`)
      .then(({ data }) => {
        if (!data.restaurant) {
          router.replace('/scan/no-restaurant')
          return
        }
        setSession(
          qr_token,
          { id: data.bus.id, name: data.bus.name, numberPlate: data.bus.number_plate },
          {
            id: data.restaurant.id,
            name: data.restaurant.name,
            address: data.restaurant.address,
            hygieneRating: data.restaurant.hygiene_rating,
          },
        )
        router.replace(`/menu/${data.restaurant.id}`)
      })
      .catch(() => setError('This QR code is invalid or has expired.'))
  }, [qr_token, router, setSession])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!error ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className="text-center"
          >
            <motion.div
              className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-primary mx-auto mb-8"
              animate={{ boxShadow: ['0 0 20px rgba(124,92,252,0.3)', '0 0 60px rgba(124,92,252,0.6)', '0 0 20px rgba(124,92,252,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Utensils className="h-14 w-14 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">ETA Eats</h1>
            <div className="flex items-center justify-center gap-2 text-text-secondary">
              <Spinner className="h-4 w-4" />
              <span className="text-sm">Loading your menu…</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/20 mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-error" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Invalid QR Code</h2>
            <p className="text-text-secondary text-sm mb-6">{error}</p>
            <p className="text-text-muted text-xs">Scan the QR code pasted inside your bus.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 6.3 — Invalid QR page**

Create `src/app/scan/invalid/page.tsx`:

```tsx
import { QrCode } from 'lucide-react'

export default function ScanInvalidPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface2 border border-white/8 mx-auto mb-6">
        <QrCode className="h-10 w-10 text-text-secondary" />
      </div>
      <h1 className="text-xl font-bold text-text-primary mb-3">
        Scan your bus QR code
      </h1>
      <p className="text-text-secondary text-sm max-w-xs">
        Look for the ETA Eats QR code sticker inside your bus — usually near the seats or on the back of the seat in front of you.
      </p>
    </div>
  )
}
```

- [ ] **Step 6.4 — No-restaurant page**

Create `src/app/scan/no-restaurant/page.tsx`:

```tsx
import { Utensils } from 'lucide-react'

export default function NoRestaurantPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/10 border border-warning/30 mx-auto mb-6">
        <Utensils className="h-10 w-10 text-warning" />
      </div>
      <h1 className="text-xl font-bold text-text-primary mb-3">
        No restaurant assigned yet
      </h1>
      <p className="text-text-secondary text-sm max-w-xs">
        This bus doesn't have a restaurant assigned right now. Check back once your bus is closer to the food stop.
      </p>
    </div>
  )
}
```

- [ ] **Step 6.5 — Verify scan flow works end-to-end**

Start the Django backend (`python manage.py runserver`), start the Next.js app (`npm run dev`).

From the seed data, get any `qr_token` from the admin panel or from running:
```bash
cd ETA-Eats-v2/backend
python manage.py shell -c "from apps.fleet.models import Bus; [print(b.qr_token) for b in Bus.objects.all()[:2]]"
```

Navigate to `http://localhost:3000/scan/<qr_token>`.
Expected: loading animation → redirects to `/menu/<restaurant_id>` (404 page for now, but redirect should work).

Navigate to `http://localhost:3000/`.
Expected: redirects to `/scan/invalid`.

- [ ] **Step 6.6 — Commit**

```bash
git add .
git commit -m "feat(passenger): scan pages — QR entry, invalid, no-restaurant states"
```

---

### Task 7: Menu Page

**Files:**
- Create: `src/app/menu/[restaurantId]/page.tsx`
- Create: `src/components/menu/CategoryTabs.tsx`
- Create: `src/components/menu/MenuItemRow.tsx`
- Create: `src/components/menu/SearchOverlay.tsx`
- Create: `src/components/menu/CartBar.tsx`

- [ ] **Step 7.1 — CategoryTabs component**

Create `src/components/menu/CategoryTabs.tsx`:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface CategoryTabsProps {
  categories: string[]
  active: string
  onChange: (cat: string) => void
}

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [active])

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
      {['All', ...categories].map((cat) => {
        const isActive = cat === active
        return (
          <button
            key={cat}
            ref={isActive ? activeRef : undefined}
            onClick={() => onChange(cat)}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
              isActive
                ? 'bg-gradient-primary text-white shadow-md shadow-primary/30'
                : 'bg-surface2 text-text-secondary border border-white/8',
            )}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 7.2 — MenuItemRow component**

Create `src/components/menu/MenuItemRow.tsx`:

```tsx
'use client'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CartItem, MenuItem } from '@/lib/api.types'

interface MenuItemRowProps {
  item: MenuItem
  cartItem: CartItem | undefined
  onAdd: (item: MenuItem) => void
  onIncrement: (cartItemId: number) => void
  onDecrement: (cartItemId: number, quantity: number) => void
}

export function MenuItemRow({ item, cartItem, onAdd, onIncrement, onDecrement }: MenuItemRowProps) {
  const unavailable = !item.is_available

  return (
    <div className={cn(
      'flex items-center gap-3 py-3 border-b border-white/5',
      unavailable && 'opacity-40',
    )}>
      {/* Emoji / photo placeholder */}
      <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-surface2 flex items-center justify-center text-2xl">
        🍛
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
          {unavailable && (
            <span className="flex-shrink-0 text-xs text-text-muted bg-surface2 px-2 py-0.5 rounded-full">
              Unavailable
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-text-secondary truncate mt-0.5">{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm font-bold text-primary-soft">₹{item.price}</span>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="h-3 w-3" />{item.prep_time_minutes} min
          </span>
        </div>
      </div>

      {/* Add / quantity controls */}
      {!unavailable && (
        <div className="flex-shrink-0">
          {cartItem ? (
            <div className="flex items-center rounded-lg border border-primary/40 bg-surface2 overflow-hidden">
              <button
                onClick={() => onDecrement(cartItem.id, cartItem.quantity)}
                className="px-3 py-1.5 text-primary-soft text-base font-bold"
              >−</button>
              <span className="px-2 py-1.5 text-sm font-bold text-text-primary bg-primary/10">
                {cartItem.quantity}
              </span>
              <button
                onClick={() => onIncrement(cartItem.id)}
                className="px-3 py-1.5 text-primary-soft text-base font-bold"
              >+</button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => onAdd(item)}
              className="rounded-lg bg-gradient-primary text-white text-xs font-bold px-4 py-2 shadow shadow-primary/30"
            >
              + ADD
            </motion.button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7.3 — SearchOverlay component**

Create `src/components/menu/SearchOverlay.tsx`:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import type { MenuItem } from '@/lib/api.types'

interface SearchOverlayProps {
  open: boolean
  items: MenuItem[]
  onClose: () => void
  onAdd: (item: MenuItem) => void
}

export function SearchOverlay({ open, items, onClose, onAdd }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const results = query.trim().length < 2
    ? []
    : items.filter((i) =>
        i.is_available &&
        (i.name.toLowerCase().includes(query.toLowerCase()) ||
         i.description.toLowerCase().includes(query.toLowerCase()))
      )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-bg flex flex-col"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 p-4 border-b border-white/8">
            <Search className="h-5 w-5 text-text-secondary flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dal, chicken, lassi…"
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted text-sm focus:outline-none"
            />
            <button onClick={onClose}>
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4">
            {query.trim().length < 2 && (
              <p className="text-center text-text-muted text-sm mt-8">Type at least 2 characters…</p>
            )}
            {query.trim().length >= 2 && results.length === 0 && (
              <p className="text-center text-text-muted text-sm mt-8">No items found for "{query}"</p>
            )}
            {results.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{item.category_name}</p>
                  <p className="text-sm font-bold text-primary-soft mt-1">₹{item.price}</p>
                </div>
                <button
                  onClick={() => { onAdd(item); onClose() }}
                  className="rounded-lg bg-gradient-primary text-white text-xs font-bold px-4 py-2"
                >
                  + ADD
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 7.4 — CartBar component**

Create `src/components/menu/CartBar.tsx`:

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart.store'

export function CartBar() {
  const router = useRouter()
  const totalItems = useCartStore((s) => s.totalItems())
  const totalPrice = useCartStore((s) => s.totalPrice())

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-40 p-4"
        >
          <button
            onClick={() => router.push('/cart')}
            className="w-full rounded-xl bg-gradient-primary text-white shadow-xl shadow-primary/40 px-5 py-4 flex items-center justify-between"
          >
            <span className="text-sm font-semibold">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className="text-sm font-bold">View Cart  ₹{totalPrice.toFixed(0)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 7.5 — Menu page**

Create `src/app/menu/[restaurantId]/page.tsx`:

```tsx
'use client'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search, Star } from 'lucide-react'
import { toast } from 'sonner'
import { CategoryTabs } from '@/components/menu/CategoryTabs'
import { MenuItemRow } from '@/components/menu/MenuItemRow'
import { SearchOverlay } from '@/components/menu/SearchOverlay'
import { CartBar } from '@/components/menu/CartBar'
import { Spinner } from '@/components/ui'
import { useSessionStore } from '@/stores/session.store'
import { useCartStore } from '@/stores/cart.store'
import api from '@/lib/api'
import type { Cart, MenuItem, Paginated } from '@/lib/api.types'

export default function MenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>()
  const restaurant = useSessionStore((s) => s.restaurant)
  const bus = useSessionStore((s) => s.bus)
  const { cartId, items: cartItems, setCart } = useCartStore()

  const [activeCategory, setActiveCategory] = useState('All')
  const [searchOpen, setSearchOpen] = useState(false)

  // Fetch menu items
  const { data: menuData, isLoading, isError, refetch } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () =>
      api.get<Paginated<MenuItem>>(
        `/restaurants/menu-items/?restaurant=${restaurantId}&is_available=true&page_size=100`
      ).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const allItems = menuData?.results ?? []

  const categories = useMemo(
    () => [...new Set(allItems.map((i) => i.category_name ?? 'Other').filter(Boolean))],
    [allItems]
  )

  const displayed = useMemo(
    () => activeCategory === 'All'
      ? allItems
      : allItems.filter((i) => i.category_name === activeCategory),
    [allItems, activeCategory]
  )

  // Group by category for display
  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return { [activeCategory]: displayed }
    return displayed.reduce<Record<string, MenuItem[]>>((acc, item) => {
      const cat = item.category_name ?? 'Other'
      acc[cat] = [...(acc[cat] ?? []), item]
      return acc
    }, {})
  }, [displayed, activeCategory])

  async function handleAdd(item: MenuItem) {
    if (!bus) { toast.error('Bus information missing. Please scan the QR again.'); return }
    try {
      const { data } = await api.post<Cart>('/orders/cart/', {
        menu_item: item.id,
        quantity: 1,
        bus_id: bus.id,
      })
      setCart(data.id, data.bus, data.restaurant, data.items)
    } catch (err: any) {
      if (err?.response?.data?.error?.code === 'restaurant_mismatch') {
        toast.error('Your cart has items from another restaurant. Clear cart to continue.')
      } else {
        toast.error('Could not add item. Try again.')
      }
    }
  }

  async function handleIncrement(cartItemId: number) {
    const current = cartItems.find((i) => i.id === cartItemId)
    if (!current || !cartId) return
    try {
      const { data } = await api.patch<Cart>(`/orders/cart/items/${cartItemId}/`, {
        quantity: current.quantity + 1,
      })
      setCart(cartId, data.bus, data.restaurant, data.items)
    } catch { toast.error('Could not update quantity.') }
  }

  async function handleDecrement(cartItemId: number, quantity: number) {
    if (!cartId) return
    try {
      if (quantity <= 1) {
        const { data } = await api.delete<Cart>(`/orders/cart/items/${cartItemId}/`)
        setCart(cartId, data.bus, data.restaurant, data.items)
      } else {
        const { data } = await api.patch<Cart>(`/orders/cart/items/${cartItemId}/`, {
          quantity: quantity - 1,
        })
        setCart(cartId, data.bus, data.restaurant, data.items)
      }
    } catch { toast.error('Could not update quantity.') }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-text-secondary">Could not load menu. Check your connection.</p>
        <button onClick={() => refetch()} className="text-primary-soft text-sm font-semibold">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-bg border-b border-white/5">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-text-primary">{restaurant?.name ?? 'Menu'}</h1>
              {restaurant?.hygieneRating && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span className="text-xs text-text-secondary">{restaurant.hygieneRating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="mt-3 w-full flex items-center gap-2 bg-surface2 rounded-xl px-4 py-2.5 border border-white/8"
          >
            <Search className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-muted">Search dal, chicken, lassi…</span>
          </button>
        </div>

        {/* Category tabs */}
        <CategoryTabs
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {/* Menu items grouped by category */}
      <div className="px-4">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            {activeCategory === 'All' && (
              <h2 className="text-sm font-bold text-text-primary mt-5 mb-1 pb-1 border-b border-white/8">
                {cat}
              </h2>
            )}
            {items.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                cartItem={cartItems.find((c) => c.menu_item === item.id)}
                onAdd={handleAdd}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            ))}
          </div>
        ))}
      </div>

      <SearchOverlay
        open={searchOpen}
        items={allItems}
        onClose={() => setSearchOpen(false)}
        onAdd={handleAdd}
      />

      <CartBar />
    </div>
  )
}
```

- [ ] **Step 7.6 — Verify menu page**

With the backend running and seed data loaded, navigate to `http://localhost:3000/scan/<qr_token>`.
Expected: loads, redirects to `/menu/<id>`, shows restaurant name, category tabs (Starters, Main Course, Breads, Beverages, Combos), item list. Tapping `+ ADD` calls the cart API and the CartBar slides up from bottom.

- [ ] **Step 7.7 — Commit**

```bash
git add .
git commit -m "feat(passenger): menu page — category tabs, item list, search overlay, cart bar"
```

---

### Task 8: Cart Page + Auth Bottom Sheet + OTP Flow

**Files:**
- Create: `src/components/cart/OTPInput.tsx`
- Create: `src/components/cart/AuthBottomSheet.tsx`
- Create: `src/app/cart/page.tsx`

- [ ] **Step 8.1 — OTPInput component (6-digit, auto-advance)**

Create `src/components/cart/OTPInput.tsx`:

```tsx
'use client'
import { useRef } from 'react'

interface OTPInputProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  function handleChange(idx: number, char: string) {
    if (!/^\d?$/.test(char)) return
    const arr = value.padEnd(6, ' ').split('')
    arr[idx] = char || ' '
    const next = arr.join('').trimEnd()
    onChange(next)
    if (char && idx < 5) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-10 rounded-xl bg-surface2 border border-white/8 text-center text-lg font-bold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 8.2 — AuthBottomSheet component**

Create `src/components/cart/AuthBottomSheet.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OTPInput } from './OTPInput'
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

interface AuthBottomSheetProps {
  open: boolean
  onSuccess: () => void
  onClose: () => void
}

type Step = 'phone' | 'otp'

export function AuthBottomSheet({ open, onSuccess, onClose }: AuthBottomSheetProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const { requestOTP, verifyOTP, loading } = useAuth()

  async function handleSendOTP() {
    const number = `+91${phone.replace(/\D/g, '')}`
    const ok = await requestOTP(number)
    if (ok) setStep('otp')
  }

  async function handleVerifyOTP() {
    const number = `+91${phone.replace(/\D/g, '')}`
    const ok = await verifyOTP(number, otp)
    if (ok) { onSuccess() }
  }

  function handleClose() {
    setStep('phone')
    setPhone('')
    setOtp('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-2xl border-t border-white/8 p-6"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            {step === 'phone' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-text-primary">Almost there!</p>
                  <p className="text-sm text-text-secondary mt-1">Sign in to place your order. Your cart is saved.</p>
                </div>
                <div className="flex items-center gap-2 bg-surface2 rounded-xl border border-white/8 px-4 py-3">
                  <span className="text-sm text-text-secondary">🇮🇳 +91</span>
                  <div className="w-px h-4 bg-white/20" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSendOTP}
                  loading={loading}
                  disabled={phone.length < 10}
                >
                  Send OTP
                </Button>
                <p className="text-center text-xs text-text-muted">No account needed — just your phone</p>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-lg font-bold text-text-primary">Enter OTP</p>
                  <p className="text-sm text-text-secondary mt-1">Sent to +91 {phone}</p>
                </div>
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                <Button
                  className="w-full"
                  onClick={handleVerifyOTP}
                  loading={loading}
                  disabled={otp.length < 6}
                >
                  Verify & Continue
                </Button>
                <button
                  onClick={() => setStep('phone')}
                  className="w-full text-center text-xs text-text-secondary"
                >
                  Change number
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 8.3 — Cart page**

Create `src/app/cart/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthBottomSheet } from '@/components/cart/AuthBottomSheet'
import { Button } from '@/components/ui'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { Cart } from '@/lib/api.types'

export default function CartPage() {
  const router = useRouter()
  const { cartId, items, busId, restaurantId, setCart, clearCart, totalPrice } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [authOpen, setAuthOpen] = useState(false)

  async function handleRemove(cartItemId: number) {
    if (!cartId) return
    try {
      const { data } = await api.delete<Cart>(`/orders/cart/items/${cartItemId}/`)
      setCart(cartId, data.bus, data.restaurant, data.items)
    } catch { toast.error('Could not remove item.') }
  }

  async function handleUpdate(cartItemId: number, quantity: number) {
    if (!cartId) return
    try {
      const { data } = await api.patch<Cart>(`/orders/cart/items/${cartItemId}/`, { quantity })
      setCart(cartId, data.bus, data.restaurant, data.items)
    } catch { toast.error('Could not update quantity.') }
  }

  function handleCheckout() {
    if (!isAuthenticated) { setAuthOpen(true); return }
    router.push('/checkout')
  }

  function onAuthSuccess() {
    setAuthOpen(false)
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 p-6 text-center">
        <ShoppingBag className="h-12 w-12 text-text-muted" />
        <p className="text-text-secondary">Your cart is empty</p>
        <button onClick={() => router.back()} className="text-primary-soft text-sm font-semibold">
          ← Go back to menu
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Your Cart</h1>
        <span className="text-sm text-text-muted ml-auto">{items.length} item{items.length > 1 ? 's' : ''}</span>
      </div>

      {/* Items */}
      <div className="px-4 py-2">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            className="flex items-center gap-3 py-4 border-b border-white/5"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">{item.menu_item_name}</p>
              <p className="text-sm text-primary-soft font-bold mt-0.5">₹{item.unit_price} × {item.quantity}</p>
            </div>
            {/* Quantity controls */}
            <div className="flex items-center gap-1 bg-surface2 rounded-lg border border-white/8 overflow-hidden">
              <button
                onClick={() => item.quantity > 1 ? handleUpdate(item.id, item.quantity - 1) : handleRemove(item.id)}
                className="px-3 py-1.5 text-primary-soft"
              >−</button>
              <span className="px-2 py-1.5 text-sm font-bold text-text-primary">{item.quantity}</span>
              <button
                onClick={() => handleUpdate(item.id, item.quantity + 1)}
                className="px-3 py-1.5 text-primary-soft"
              >+</button>
            </div>
            <button onClick={() => handleRemove(item.id)} className="ml-1">
              <Trash2 className="h-4 w-4 text-text-muted" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mx-4 mt-4 rounded-xl bg-surface2 border border-white/8 p-4">
        <div className="flex justify-between text-sm text-text-secondary mb-2">
          <span>Subtotal</span><span>₹{totalPrice().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-text-primary border-t border-white/8 pt-2 mt-2">
          <span>Total</span><span>₹{totalPrice().toFixed(2)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-bg border-t border-white/8">
        <Button className="w-full" size="lg" onClick={handleCheckout}>
          Place Order  ₹{totalPrice().toFixed(0)}
        </Button>
      </div>

      <AuthBottomSheet open={authOpen} onSuccess={onAuthSuccess} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 8.4 — Verify auth bottom sheet flow**

Navigate to menu, add items, tap cart bar → `/cart` page. Tap "Place Order" without being logged in.
Expected: Auth bottom sheet slides up with blur backdrop. Enter phone → "Send OTP" → OTP screen → enter OTP from server console → sheet closes → navigates to `/checkout` (404 for now).

- [ ] **Step 8.5 — Commit**

```bash
git add .
git commit -m "feat(passenger): cart page, auth bottom sheet, OTP input flow"
```

---

### Task 9: Checkout Page + Razorpay

**Files:**
- Create: `src/app/checkout/page.tsx`

- [ ] **Step 9.1 — Checkout page**

Create `src/app/checkout/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { useSessionStore } from '@/stores/session.store'
import { openRazorpay } from '@/lib/razorpay'
import api from '@/lib/api'
import type { Order, RazorpayOrderPayload } from '@/lib/api.types'

export default function CheckoutPage() {
  const router = useRouter()
  const { cartId, busId, items, totalPrice, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const { bus, restaurant } = useSessionStore()
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    if (!cartId || !busId) { toast.error('Cart session expired. Please go back.'); return }
    setLoading(true)
    try {
      // 1. Checkout cart → create order
      const { data: order } = await api.post<Order>('/orders/checkout/', {
        cart_id: cartId,
        bus_id: busId,
      })

      // 2. Create Razorpay order
      const { data: rpPayload } = await api.post<RazorpayOrderPayload>(
        '/payments/razorpay/order/', { order_id: order.id }
      )

      // 3. Open Razorpay sheet
      await openRazorpay(
        rpPayload,
        user?.phone_number ?? '',
        async (rpResponse) => {
          // 4. Confirm payment
          try {
            await api.post('/payments/razorpay/confirm/', {
              order_id: order.id,
              razorpay_order_id: rpResponse.razorpay_order_id,
              razorpay_payment_id: rpResponse.razorpay_payment_id,
              razorpay_signature: rpResponse.razorpay_signature,
            })
            clearCart()
            router.replace(`/order/${order.id}`)
          } catch {
            toast.error('Payment confirmation failed. Contact support with your order ID.')
            router.replace(`/order/${order.id}`)
          }
        },
        () => {
          toast('Payment cancelled.')
          setLoading(false)
        },
      )
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Checkout failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Order Summary</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Bus + Restaurant */}
        <div className="rounded-xl bg-surface2 border border-white/8 p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Pickup from</p>
          <p className="text-sm font-semibold text-text-primary">{restaurant?.name}</p>
          <p className="text-xs text-text-secondary mt-0.5">{restaurant?.address}</p>
          <div className="mt-3 pt-3 border-t border-white/8">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Your bus</p>
            <p className="text-sm text-text-primary">{bus?.name} · {bus?.numberPlate}</p>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-xl bg-surface2 border border-white/8 p-4 space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Your order</p>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-text-secondary">{item.menu_item_name} × {item.quantity}</span>
              <span className="text-text-primary font-medium">₹{item.line_total}</span>
            </div>
          ))}
          <div className="flex justify-between text-base font-bold text-text-primary border-t border-white/8 pt-3 mt-2">
            <span>Total</span>
            <span>₹{totalPrice().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Pay CTA */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-bg border-t border-white/8">
        <Button className="w-full" size="lg" onClick={handlePay} loading={loading}>
          Pay ₹{totalPrice().toFixed(0)} with Razorpay
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 9.2 — Commit**

```bash
git add .
git commit -m "feat(passenger): checkout page with Razorpay payment flow"
```

---

### Task 10: Order Tracking — WebSocket Hook + Stepper Page

**Files:**
- Create: `src/hooks/useOrderSocket.ts`
- Create: `src/components/order/StatusStepper.tsx`
- Create: `src/app/order/[orderId]/page.tsx`
- Create: `src/app/order/[orderId]/complete/page.tsx`

- [ ] **Step 10.1 — useOrderSocket hook**

Create `src/hooks/useOrderSocket.ts`:

```ts
'use client'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import type { OrderStatus, OrderStatusPayload } from '@/lib/api.types'

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface UseOrderSocketOptions {
  orderId: string
  onStatusChange: (status: OrderStatus) => void
}

export function useOrderSocket({ orderId, onStatusChange }: UseOrderSocketOptions) {
  const { accessToken } = useAuthStore()
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxRetries = 3

  useEffect(() => {
    if (!accessToken) return

    function connect() {
      const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000'
      const url = `${WS_BASE}/ws/user/?token=${accessToken}`
      const ws = new WebSocket(url)
      wsRef.current = ws
      setConnectionState(retryCount.current > 0 ? 'reconnecting' : 'connecting')

      ws.onopen = () => {
        setConnectionState('connected')
        retryCount.current = 0
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data as string) as OrderStatusPayload
          if (payload.order_id === orderId && payload.status) {
            onStatusChange(payload.status)
          }
        } catch { /* ignore malformed messages */ }
      }

      ws.onclose = (event) => {
        // Code 1000 = intentional close; 4401 = unauthenticated
        if (event.code === 1000 || event.code === 4401) {
          setConnectionState('disconnected')
          return
        }
        if (retryCount.current < maxRetries) {
          const delay = Math.pow(2, retryCount.current) * 1000  // 1s, 2s, 4s
          retryCount.current += 1
          setConnectionState('reconnecting')
          retryTimer.current = setTimeout(connect, delay)
        } else {
          setConnectionState('disconnected')
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
      wsRef.current?.close(1000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, orderId])

  return { connectionState }
}
```

- [ ] **Step 10.2 — StatusStepper component**

Create `src/components/order/StatusStepper.tsx`:

```tsx
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/api.types'

const STEPS: { status: OrderStatus; label: string; emoji: string; message: string }[] = [
  { status: 'PENDING',   label: 'Order Placed',       emoji: '🧾', message: 'We received your order.' },
  { status: 'CONFIRMED', label: 'Confirmed',           emoji: '✅', message: 'Restaurant confirmed your order.' },
  { status: 'PREPARING', label: 'Preparing',           emoji: '🍳', message: 'Kitchen is cooking your food.' },
  { status: 'READY',     label: 'Ready for Pickup',    emoji: '🔔', message: 'Your food is ready — head to the counter!' },
  { status: 'PICKED_UP', label: 'Picked Up',           emoji: '🎉', message: 'Enjoy your meal!' },
]

const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0, CONFIRMED: 1, PREPARING: 2, READY: 3, PICKED_UP: 4, CANCELLED: -1,
}

interface StatusStepperProps {
  currentStatus: OrderStatus
  timestamps: {
    created_at: string
    confirmed_at: string | null
    ready_at: string | null
    picked_up_at: string | null
  }
}

export function StatusStepper({ currentStatus, timestamps }: StatusStepperProps) {
  const currentRank = STATUS_RANK[currentStatus] ?? 0

  const getTimestamp = (status: OrderStatus): string | null => {
    switch (status) {
      case 'PENDING':   return timestamps.created_at
      case 'CONFIRMED': return timestamps.confirmed_at
      case 'READY':     return timestamps.ready_at
      case 'PICKED_UP': return timestamps.picked_up_at
      default: return null
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-surface2" />

      {STEPS.map((step, i) => {
        const rank = STATUS_RANK[step.status]!
        const isDone    = rank < currentRank
        const isActive  = rank === currentRank
        const isPending = rank > currentRank
        const ts = getTimestamp(step.status)

        return (
          <div key={step.status} className={cn('relative flex gap-4 mb-6 last:mb-0', isPending && 'opacity-40')}>
            {/* Circle */}
            <div className="absolute -left-8 flex items-center justify-center">
              {isDone ? (
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              ) : isActive ? (
                <motion.div
                  className="h-7 w-7 rounded-full bg-gradient-primary shadow-lg shadow-primary/50"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-surface2 border-2 border-white/10" />
              )}
            </div>

            {/* Content */}
            <div className={cn('flex-1 rounded-xl p-3', isActive && 'bg-primary/10 border border-primary/30')}>
              <div className="flex items-center gap-2">
                <span className="text-base">{step.emoji}</span>
                <span className={cn(
                  'text-sm font-semibold',
                  isActive ? 'text-text-primary' : isDone ? 'text-primary-soft' : 'text-text-muted',
                )}>
                  {step.label}
                </span>
                {ts && (
                  <span className="ml-auto text-xs text-text-muted">{formatTime(ts)}</span>
                )}
              </div>
              {isActive && (
                <p className="text-xs text-text-secondary mt-1">{step.message}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 10.3 — Order tracking page**

Create `src/app/order/[orderId]/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Badge, Spinner } from '@/components/ui'
import { StatusStepper } from '@/components/order/StatusStepper'
import { useOrderSocket } from '@/hooks/useOrderSocket'
import api from '@/lib/api'
import type { Order, OrderStatus } from '@/lib/api.types'

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get<Order>(`/orders/my/${orderId}/`).then((r) => r.data),
  })

  const effectiveStatus = liveStatus ?? order?.status ?? 'PENDING'

  const { connectionState } = useOrderSocket({
    orderId,
    onStatusChange: (status) => {
      setLiveStatus(status)
      if (status === 'PICKED_UP') {
        setTimeout(() => router.replace(`/order/${orderId}/complete`), 1500)
      }
    },
  })

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg border-b border-white/8 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-text-primary">{order.restaurant_name}</h1>
            <p className="text-xs text-text-muted">Order #{order.id.slice(0, 8)}</p>
          </div>
          {connectionState === 'connected' && (
            <Badge variant="primary" dot>LIVE</Badge>
          )}
          {connectionState === 'reconnecting' && (
            <Badge variant="warning" dot>Reconnecting…</Badge>
          )}
          {connectionState === 'disconnected' && (
            <Badge variant="muted">Offline</Badge>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Ready banner */}
        {effectiveStatus === 'READY' && (
          <div className="rounded-xl bg-success/10 border border-success/30 p-4 mb-6 text-center">
            <p className="text-success font-bold">🔔 Your food is ready!</p>
            <p className="text-sm text-text-secondary mt-1">Head to the counter to pick it up.</p>
          </div>
        )}

        <StatusStepper
          currentStatus={effectiveStatus}
          timestamps={{
            created_at:  order.created_at,
            confirmed_at: order.confirmed_at,
            ready_at:    order.ready_at,
            picked_up_at: order.picked_up_at,
          }}
        />

        {/* Order items summary */}
        <div className="mt-8 rounded-xl bg-surface2 border border-white/8 p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Your order</p>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span className="text-text-secondary">{item.menu_item_name} × {item.quantity}</span>
              <span className="text-text-primary">₹{item.line_total}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold text-text-primary border-t border-white/8 pt-2 mt-2">
            <span>Total</span><span>₹{order.total_amount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 10.4 — Order complete page**

Create `src/app/order/[orderId]/complete/page.tsx`:

```tsx
'use client'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'

export default function OrderCompletePage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-7xl mb-6"
      >
        🎉
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-text-primary mb-2">Enjoy your meal!</h1>
        <p className="text-text-secondary text-sm mb-2">
          Order #{(orderId as string).slice(0, 8)} picked up successfully.
        </p>
        <p className="text-text-muted text-xs mb-8">Safe travels!</p>

        <Button onClick={() => router.push('/orders')} variant="ghost">
          View order history
        </Button>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 10.5 — Verify order tracking end-to-end**

Using a seed order in PREPARING status, navigate to `/order/<orderId>`. Expected: stepper shows first 2 steps done, "Preparing" step active with pulsing circle. LIVE badge visible if WebSocket connects.

To test status advance: log into admin panel as restaurant staff, advance the order to READY. Expected: stepper animates to READY step, green banner appears.

- [ ] **Step 10.6 — Commit**

```bash
git add .
git commit -m "feat(passenger): order tracking page — WebSocket hook, vertical stepper, complete screen"
```

---

### Task 11: Order History + Profile Pages

**Files:**
- Create: `src/app/orders/page.tsx`
- Create: `src/app/profile/page.tsx`

- [ ] **Step 11.1 — Orders history page**

Create `src/app/orders/page.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package } from 'lucide-react'
import { Badge, Spinner } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { Order, OrderStatus, Paginated } from '@/lib/api.types'

const STATUS_BADGE: Record<OrderStatus, { variant: 'primary' | 'success' | 'error' | 'warning' | 'muted'; label: string }> = {
  PENDING:   { variant: 'warning', label: 'Pending' },
  CONFIRMED: { variant: 'primary', label: 'Confirmed' },
  PREPARING: { variant: 'primary', label: 'Preparing' },
  READY:     { variant: 'success', label: 'Ready' },
  PICKED_UP: { variant: 'muted',   label: 'Picked Up' },
  CANCELLED: { variant: 'error',   label: 'Cancelled' },
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/')
  }, [isAuthenticated, router])

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<Paginated<Order>>('/orders/my/').then((r) => r.data),
    enabled: isAuthenticated,
  })

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-10 bg-bg border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Order History</h1>
      </div>

      <div className="px-4 py-4">
        {isLoading && (
          <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
        )}

        {!isLoading && data?.results.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No orders yet</p>
          </div>
        )}

        {data?.results.map((order) => {
          const badge = STATUS_BADGE[order.status]
          return (
            <button
              key={order.id}
              onClick={() => router.push(
                order.status === 'PICKED_UP' || order.status === 'CANCELLED'
                  ? `/order/${order.id}`
                  : `/order/${order.id}`
              )}
              className="w-full text-left rounded-xl bg-surface2 border border-white/8 p-4 mb-3"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{order.restaurant_name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <p className="text-xs text-text-secondary">
                {order.items.map((i) => `${i.menu_item_name} ×${i.quantity}`).join(', ')}
              </p>
              <p className="text-sm font-bold text-text-primary mt-2">₹{order.total_amount}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 11.2 — Profile page**

Create `src/app/profile/page.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/')
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) return null

  function handleLogout() {
    logout()
    router.replace('/scan/invalid')
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-10 bg-bg border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Profile</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <div className="h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center text-3xl mb-3">
            {user.full_name ? user.full_name[0]?.toUpperCase() : '👤'}
          </div>
          <p className="text-lg font-bold text-text-primary">{user.full_name || 'Passenger'}</p>
          <p className="text-sm text-text-secondary">{user.phone_number}</p>
        </div>

        {/* Details */}
        <div className="rounded-xl bg-surface2 border border-white/8 divide-y divide-white/5">
          <div className="flex items-center gap-3 p-4">
            <Phone className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Phone</p>
              <p className="text-sm text-text-primary">{user.phone_number}</p>
            </div>
          </div>
          {user.email && (
            <div className="flex items-center gap-3 p-4">
              <User className="h-4 w-4 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Email</p>
                <p className="text-sm text-text-primary">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        <Button variant="danger" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 11.3 — Commit**

```bash
git add .
git commit -m "feat(passenger): order history and profile pages"
```

---

### Task 12: PWA Manifest + Not Found Page

**Files:**
- Create: `public/manifest.json`
- Modify: `src/app/not-found.tsx`

- [ ] **Step 12.1 — PWA manifest**

Create `public/manifest.json`:

```json
{
  "name": "ETA Eats",
  "short_name": "ETA Eats",
  "description": "Pre-order highway food from your bus",
  "start_url": "/scan/invalid",
  "display": "standalone",
  "background_color": "#0D0D0D",
  "theme_color": "#0D0D0D",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Create placeholder icons directory:

```bash
mkdir -p public/icons
# Add icon-192.png and icon-512.png — use any 192×192 and 512×512 PNG for now.
# Replace with branded icons before launch.
curl -o public/icons/icon-192.png "https://via.placeholder.com/192/7C5CFC/ffffff?text=ETA" 2>/dev/null || echo "Add icons manually to public/icons/"
curl -o public/icons/icon-512.png "https://via.placeholder.com/512/7C5CFC/ffffff?text=ETA" 2>/dev/null || echo "Add icons manually to public/icons/"
```

- [ ] **Step 12.2 — Not found page**

Replace `src/app/not-found.tsx`:

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">🤔</div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Page not found</h2>
      <p className="text-text-secondary text-sm mb-6">
        This page doesn't exist. Scan the QR code in your bus to get started.
      </p>
      <Link href="/scan/invalid" className="text-primary-soft font-semibold text-sm">
        Go to start
      </Link>
    </div>
  )
}
```

- [ ] **Step 12.3 — Final build check**

```bash
npm run build
```

Expected: builds successfully. Check for TypeScript errors and fix any that appear.

- [ ] **Step 12.4 — Final commit**

```bash
git add .
git commit -m "feat(passenger): PWA manifest, not-found page, complete MVP build"
```

---

## Self-Review Against Spec

| Spec requirement | Covered in |
|-----------------|------------|
| QR scan → session store → redirect to menu | Task 6 |
| Invalid QR state | Task 6 |
| No-restaurant state | Task 6 |
| Menu: category tabs + vertical list | Task 7 |
| Menu: search overlay | Task 7 |
| Menu: sticky cart bar | Task 7 |
| Menu: unavailable items greyed out | Task 7 (MenuItemRow) |
| Anonymous cart (no auth to browse) | Task 7 (post to cart API, no auth gate) |
| Optimistic add-to-cart | Task 7 |
| restaurant_mismatch error handling | Task 7 |
| Auth bottom sheet on checkout | Task 8 |
| OTP 6-digit auto-advance input | Task 8 |
| Cart item quantity management | Tasks 7, 8 |
| Checkout summary | Task 9 |
| Razorpay payment flow | Task 9 |
| Live order tracking — vertical stepper | Task 10 |
| WebSocket connection + LIVE badge | Task 10 |
| Reconnect with exponential backoff | Task 10 (useOrderSocket) |
| Polling fallback after 3 WS failures | Task 10 (useOrderSocket — note: uses TanStack Query refetch on disconnect) |
| READY banner | Task 10 |
| Auto-navigate to /complete on PICKED_UP | Task 10 |
| Order complete / pickup screen | Task 10 |
| Order history | Task 11 |
| Profile page | Task 11 |
| Route protection (/orders, /profile) | Tasks 5, 11 |
| JWT token refresh interceptor | Task 3 |
| Dark Premium design tokens | Task 2 |
| Framer Motion animations | Tasks 6, 7, 8, 10, 11 |
| PWA manifest | Task 12 |
| Backend JWT WebSocket middleware | Task 0 |

> **One gap noted and corrected:** `useOrderSocket` handles WS disconnect but the polling fallback is implicit (TanStack Query will refetch on window focus). For active polling every 8s after 3 WS failures, add `refetchInterval: 8000` to the order query in Task 10 when `connectionState === 'disconnected'`. This is a one-line change in `/order/[orderId]/page.tsx`:
>
> ```ts
> const { data: order } = useQuery({
>   queryKey: ['order', orderId],
>   queryFn: () => api.get<Order>(`/orders/my/${orderId}/`).then((r) => r.data),
>   refetchInterval: connectionState === 'disconnected' ? 8000 : false,
> })
> ```
> This requires passing `connectionState` from `useOrderSocket` before the query — reorder those two hooks in the page component so `useOrderSocket` runs first.
