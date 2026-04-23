# ETA Eats Restaurant Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ETA Eats Restaurant Dashboard — a desktop-first Next.js 14 app where kitchen staff view live orders, manage menu items, and track today's analytics. Built alongside the existing passenger app.

**Architecture:** Standalone Next.js 14 App Router app at `ETA-Eats-v2/frontend/restaurant/`. Connects to the Django/DRF v2 backend at `localhost:8000`. Auth uses the same OTP flow as the passenger app but gates on `role === 'RESTAURANT_STAFF'`. Real-time orders delivered via `ws://host/ws/restaurant/{id}/?token=...` (JWT middleware from passenger task 0 reused). State: Zustand for auth, TanStack Query for server data.

**Tech Stack:** Next.js 14, TypeScript 5 strict, Tailwind CSS 3 (Clean Professional Light theme), Framer Motion 11, Zustand 4, TanStack Query 5, Axios 1, React Hook Form 7, Zod 3, Sonner 1, Recharts 2, Lucide React.

---

## Task 0: Verify backend memberships exposure

The spec flagged that `UserSerializer` must include memberships. On inspection the backend already does this — `apps/accounts/serializers.py` has `MembershipSerializer` nested into `UserSerializer`. No backend change is needed, but we must confirm the response shape before building the frontend against it.

**Files:**
- Read: `backend/apps/accounts/serializers.py`
- Read: `backend/apps/accounts/views.py`

- [ ] **Step 0.1 — Confirm the OTP verify response includes memberships**

Start the backend:
```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/backend
python manage.py runserver
```

In another terminal, request an OTP for a seeded restaurant owner (from the seed command, Suresh Nair owns Highway Treats):
```bash
curl -X POST http://localhost:8000/api/v1/auth/otp/request/ \
  -H 'Content-Type: application/json' \
  -d '{"phone_number": "+919100000003"}'
```

Check the backend console for the OTP code (it's printed in dev). Then verify:
```bash
curl -X POST http://localhost:8000/api/v1/auth/otp/verify/ \
  -H 'Content-Type: application/json' \
  -d '{"phone_number": "+919100000003", "code": "<OTP_FROM_CONSOLE>"}' | python3 -m json.tool
```

**Expected response shape:**
```json
{
  "user": {
    "id": "...",
    "phone_number": "+919100000003",
    "role": "RESTAURANT_STAFF",
    "memberships": [
      {
        "id": ...,
        "org_type": "restaurant",
        "org_id": <restaurant_id>,
        "org_name": "Highway Treats",
        "org_role": "RESTAURANT_OWNER",
        "is_active": true
      }
    ]
  },
  "tokens": { "access": "...", "refresh": "..." }
}
```

If the `memberships` array is present, proceed to Task 1. If not, add `memberships = MembershipSerializer(many=True, read_only=True)` to `UserSerializer` and commit.

---

## Task 1: Project scaffold

**Files:**
- Create: `frontend/restaurant/` — entire Next.js app

- [ ] **Step 1.1 — Scaffold Next.js 14 app**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend
npx create-next-app@14 restaurant \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
```

- [ ] **Step 1.2 — Install dependencies**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npm install \
  axios@^1.7.0 \
  zustand@^4.5.0 \
  "@tanstack/react-query@^5.40.0" \
  "framer-motion@^11.0.0" \
  "react-hook-form@^7.51.0" \
  "zod@^3.23.0" \
  "@hookform/resolvers@^3.6.0" \
  "sonner@^1.5.0" \
  "lucide-react@^0.400.0" \
  "recharts@^2.12.0" \
  "clsx" \
  "tailwind-merge"
npm install --save-dev "@types/node@^20.0.0"
```

- [ ] **Step 1.3 — Create `.env.local` and `.env.example`**

Create `frontend/restaurant/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Create `frontend/restaurant/.env.example` with the same content.

- [ ] **Step 1.4 — Replace `tsconfig.json`**

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

- [ ] **Step 1.5 — Dev server port**

The passenger app runs on port 3000. Update `frontend/restaurant/package.json`'s `scripts.dev` to use port 3001:

```json
"scripts": {
  "dev": "next dev -p 3001",
  "build": "next build",
  "start": "next start -p 3001",
  "lint": "next lint"
}
```

- [ ] **Step 1.6 — Verify build**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npm run build
```

Expected: build succeeds.

- [ ] **Step 1.7 — Commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): scaffold Next.js 14 app with dependencies"
```

---

## Task 2: Design system — Light theme tokens + base UI

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Textarea.tsx`
- Create: `src/components/ui/Switch.tsx`
- Create: `src/components/ui/Dialog.tsx`
- Create: `src/components/ui/Spinner.tsx`
- Create: `src/components/ui/index.ts`

All paths relative to `frontend/restaurant/`.

- [ ] **Step 2.1 — Replace `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

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
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--bg);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

- [ ] **Step 2.2 — Replace `tailwind.config.ts`**

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
        'primary-dark': 'var(--primary-dark)',
        border:    'var(--border)',
        'border-strong': 'var(--border-strong)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        success:   'var(--success)',
        'success-bg': 'var(--success-bg)',
        warning:   'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        error:     'var(--error)',
        'error-bg': 'var(--error-bg)',
        info:      'var(--info)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2.3 — Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ETA Eats — Restaurant Dashboard',
  description: 'Manage live orders, menu, and operations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

(Providers are added in Task 3 after stores exist.)

- [ ] **Step 2.4 — Create `src/lib/utils.ts`**

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2.5 — Create `src/components/ui/Button.tsx`**

```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary:   'bg-primary text-white hover:bg-primary-dark',
      secondary: 'bg-surface border border-border text-text-primary hover:bg-surface2',
      ghost:     'bg-transparent text-text-secondary hover:bg-surface2 hover:text-text-primary',
      danger:    'bg-error-bg text-error border border-error/30 hover:bg-error hover:text-white',
      success:   'bg-success text-white hover:bg-success/90',
    }
    const sizes = {
      sm: 'h-8  px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    }
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
```

- [ ] **Step 2.6 — Create `src/components/ui/Card.tsx`**

```tsx
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'primary' | 'warning' | 'success' | 'error' | 'none'
}

export function Card({ accent = 'none', className, children, ...props }: CardProps) {
  const accents = {
    primary: 'border-l-[3px] border-l-primary',
    warning: 'border-l-[3px] border-l-warning',
    success: 'border-l-[3px] border-l-success',
    error:   'border-l-[3px] border-l-error',
    none:    '',
  }
  return (
    <div
      className={cn(
        'rounded-md bg-surface border border-border shadow-sm p-4',
        accents[accent],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2.7 — Create `src/components/ui/Badge.tsx`**

```tsx
import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'muted' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'primary', dot, className, children }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-primary-soft text-primary border-primary/30',
    success: 'bg-success-bg text-success border-success/30',
    warning: 'bg-warning-bg text-warning border-warning/30',
    error:   'bg-error-bg text-error border-error/30',
    muted:   'bg-surface2 text-text-secondary border-border',
    info:    'bg-blue-50 text-info border-info/30',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold',
      variants[variant], className,
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full bg-current')} />}
      {children}
    </span>
  )
}
```

- [ ] **Step 2.8 — Create `src/components/ui/Input.tsx`**

```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
```

- [ ] **Step 2.9 — Create `src/components/ui/Textarea.tsx`**

```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
```

- [ ] **Step 2.10 — Create `src/components/ui/Switch.tsx`**

```tsx
'use client'
import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onChange, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        checked ? 'bg-primary' : 'bg-border-strong',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
```

- [ ] **Step 2.11 — Create `src/components/ui/Dialog.tsx`**

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  className?: string
  children: React.ReactNode
}

export function Dialog({ open, onClose, title, className, children }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface border border-border shadow-lg p-6',
              className,
            )}
          >
            {title && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">{title}</h2>
                <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2.12 — Create `src/components/ui/Spinner.tsx`**

```tsx
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 rounded-full border-2 border-border border-t-primary animate-spin',
        className,
      )}
    />
  )
}
```

- [ ] **Step 2.13 — Create `src/components/ui/index.ts`**

```ts
export { Button }   from './Button'
export { Card }     from './Card'
export { Badge }    from './Badge'
export { Input }    from './Input'
export { Textarea } from './Textarea'
export { Switch }   from './Switch'
export { Dialog }   from './Dialog'
export { Spinner }  from './Spinner'
```

- [ ] **Step 2.14 — Type-check and commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npx tsc --noEmit
```

Then commit:
```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): design system — Clean Professional Light tokens and base UI"
```

---

## Task 3: API client, types, stores, providers

**Files:**
- Create: `src/lib/api.types.ts`
- Create: `src/lib/api.ts`
- Create: `src/stores/auth.store.ts`
- Create: `src/components/layout/Providers.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 3.1 — Create `src/lib/api.types.ts`**

```ts
// ── Auth ──────────────────────────────────────────────────────────────────
export interface Membership {
  id: number
  org_type: 'restaurant' | 'operator'
  org_id: number
  org_name: string
  org_role: string
  is_active: boolean
}

export interface User {
  id: string
  phone_number: string
  email: string | null
  full_name: string
  gender: 'M' | 'F' | 'O' | ''
  role: 'PASSENGER' | 'RESTAURANT_STAFF' | 'BUS_OPERATOR' | 'ADMIN'
  is_active: boolean
  memberships: Membership[]
  created_at: string
}

export interface Tokens {
  access: string
  refresh: string
}

export interface AuthResponse {
  user: User
  tokens: Tokens
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
  restaurant: number
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

// ── WebSocket ─────────────────────────────────────────────────────────────
export interface OrderStatusPayload {
  order_id: string
  event: string
  status?: OrderStatus
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

- [ ] **Step 3.2 — Create `src/lib/api.ts`**

```ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

const TOKEN_KEY = 'eta-restaurant-auth'

export function getStoredTokens(): { access: string; refresh: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw) as { access: string; refresh: string }) : null
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

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getStoredTokens()
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`
  }
  return config
})

let isRefreshing = false
let queue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else if (token) resolve(token)
  })
  queue = []
}

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
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (newAccess: string) => {
            original.headers.Authorization = `Bearer ${newAccess}`
            resolve(api(original))
          },
          reject,
        })
      })
    }
    original._retry = true
    isRefreshing = true
    try {
      const { data } = await axios.post<{ access: string }>(
        `${BASE_URL}/api/v1/auth/token/refresh/`,
        { refresh: tokens.refresh },
      )
      const newAccess = data.access
      setStoredTokens(newAccess, tokens.refresh)
      processQueue(null, newAccess)
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearStoredTokens()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
```

- [ ] **Step 3.3 — Create `src/stores/auth.store.ts`**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/api.types'
import { setStoredTokens, clearStoredTokens } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  restaurantId: number | null
  restaurantName: string | null
  isAuthenticated: boolean
  setAuth: (user: User, access: string, refresh: string) => void
  clearAuth: () => void
}

function pickRestaurant(user: User): { id: number | null; name: string | null } {
  const m = user.memberships.find(
    (x) => x.is_active && x.org_type === 'restaurant',
  )
  return { id: m ? m.org_id : null, name: m ? m.org_name : null }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      restaurantId: null,
      restaurantName: null,
      isAuthenticated: false,

      setAuth: (user, access, refresh) => {
        setStoredTokens(access, refresh)
        const { id, name } = pickRestaurant(user)
        set({
          user,
          accessToken: access,
          refreshToken: refresh,
          restaurantId: id,
          restaurantName: name,
          isAuthenticated: true,
        })
      },

      clearAuth: () => {
        clearStoredTokens()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          restaurantId: null,
          restaurantName: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'eta-restaurant-auth-state',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        restaurantId: s.restaurantId,
        restaurantName: s.restaurantName,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
)
```

- [ ] **Step 3.4 — Create `src/components/layout/Providers.tsx`**

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000, retry: 1 },
        },
      }),
  )
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

- [ ] **Step 3.5 — Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ETA Eats — Restaurant Dashboard',
  description: 'Manage live orders, menu, and operations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#111827',
                border: '1px solid #E5E7EB',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 3.6 — Type-check and commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npx tsc --noEmit
```

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): API client, types, auth store, providers"
```

---

## Task 4: Middleware + root redirect + login page

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/page.tsx` (replace default)
- Create: `src/hooks/useAuth.ts`
- Create: `src/components/login/OTPInput.tsx`
- Create: `src/app/login/page.tsx`

- [ ] **Step 4.1 — Create `src/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  // Auth is client-side (localStorage) in MVP. Each dashboard page guards
  // itself via useEffect + auth store. Middleware scaffolded for future
  // server-side auth.
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

- [ ] **Step 4.2 — Replace `src/app/page.tsx`**

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, restaurantId } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && restaurantId) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, restaurantId, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
```

- [ ] **Step 4.3 — Create `src/hooks/useAuth.ts`**

```ts
import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import type { AuthResponse } from '@/lib/api.types'

type VerifyResult = { ok: true } | { ok: false; reason: 'not_staff' | 'no_restaurant' | 'invalid_otp' }

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

  async function verifyOTP(phoneNumber: string, code: string): Promise<VerifyResult> {
    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>('/auth/otp/verify/', {
        phone_number: phoneNumber,
        code,
      })
      if (data.user.role !== 'RESTAURANT_STAFF') {
        return { ok: false, reason: 'not_staff' }
      }
      const hasRestaurant = data.user.memberships.some(
        (m) => m.is_active && m.org_type === 'restaurant',
      )
      if (!hasRestaurant) {
        return { ok: false, reason: 'no_restaurant' }
      }
      setAuth(data.user, data.tokens.access, data.tokens.refresh)
      return { ok: true }
    } catch {
      return { ok: false, reason: 'invalid_otp' }
    } finally {
      setLoading(false)
    }
  }

  async function logout(refreshToken: string | null) {
    if (refreshToken) {
      try { await api.post('/auth/logout/', { refresh: refreshToken }) } catch { /* ignore */ }
    }
    clearAuth()
  }

  return { requestOTP, verifyOTP, logout, loading, isAuthenticated, user }
}
```

- [ ] **Step 4.4 — Create `src/components/login/OTPInput.tsx`**

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
          className="h-12 w-11 rounded-md border border-border bg-surface text-center text-lg font-bold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4.5 — Create `src/app/login/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { OTPInput } from '@/components/login/OTPInput'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, restaurantId } = useAuthStore()
  const { requestOTP, verifyOTP, loading } = useAuth()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && restaurantId) router.replace('/dashboard')
  }, [isAuthenticated, restaurantId, router])

  async function handleSendOTP() {
    setError(null)
    const number = `+91${phone.replace(/\D/g, '')}`
    const ok = await requestOTP(number)
    if (ok) setStep('otp')
  }

  async function handleVerifyOTP() {
    setError(null)
    const number = `+91${phone.replace(/\D/g, '')}`
    const result = await verifyOTP(number, otp)
    if (result.ok) {
      router.replace('/dashboard')
      return
    }
    if (result.reason === 'not_staff') {
      setError('This portal is for restaurant staff only. Passengers should use the ETA Eats app from their bus QR.')
    } else if (result.reason === 'no_restaurant') {
      setError('Your account has no restaurant assigned. Contact the admin.')
    } else {
      setError('Invalid OTP. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="h-11 w-11 rounded-md bg-primary flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-text-primary">ETA Eats</p>
            <p className="text-xs text-text-secondary">Restaurant Portal</p>
          </div>
        </div>

        <Card className="p-6">
          {step === 'phone' && (
            <>
              <h1 className="text-xl font-bold text-text-primary mb-1">Welcome back</h1>
              <p className="text-sm text-text-secondary mb-6">Sign in with your phone number</p>
              <div className="space-y-4">
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-surface">
                  <span className="text-sm text-text-secondary">🇮🇳 +91</span>
                  <div className="w-px h-4 bg-border" />
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
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="text-xl font-bold text-text-primary mb-1">Enter OTP</h1>
              <p className="text-sm text-text-secondary mb-6">Sent to +91 {phone}</p>
              <div className="space-y-5">
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                {error && (
                  <p className="text-sm text-error bg-error-bg border border-error/30 rounded-md p-3">
                    {error}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={handleVerifyOTP}
                  loading={loading}
                  disabled={otp.length < 6}
                >
                  Verify &amp; Sign In
                </Button>
                <button
                  onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
                  className="w-full text-center text-xs text-text-secondary"
                >
                  Change number
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 4.6 — Unused import cleanup in login/page.tsx**

The file imports `Input` but doesn't use it. Remove `Input` from the import list:
```ts
import { Button, Card } from '@/components/ui'
```

- [ ] **Step 4.7 — Type-check and commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npx tsc --noEmit
```

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): middleware scaffold, root redirect, OTP login with role gate"
```

---

## Task 5: Dashboard shell — Sidebar, TopBar, layout, WebSocket hook

**Files:**
- Create: `src/hooks/useRestaurantSocket.ts`
- Create: `src/hooks/useSoundAlert.ts`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/ConnectionBadge.tsx`
- Create: `src/components/layout/SoundToggle.tsx`
- Create: `src/app/dashboard/layout.tsx`

- [ ] **Step 5.1 — Create `src/hooks/useRestaurantSocket.ts`**

```ts
'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import type { OrderStatusPayload } from '@/lib/api.types'

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface UseRestaurantSocketOptions {
  onMessage: (payload: OrderStatusPayload) => void
  enabled?: boolean
}

export function useRestaurantSocket({ onMessage, enabled = true }: UseRestaurantSocketOptions) {
  const { accessToken, restaurantId } = useAuthStore()
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxRetries = 3
  const onMessageRef = useRef(onMessage)

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  const connect = useCallback(() => {
    if (!accessToken || !restaurantId) return
    const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000'
    const url = `${WS_BASE}/ws/restaurant/${restaurantId}/?token=${accessToken}`
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
        onMessageRef.current(payload)
      } catch {
        /* ignore malformed */
      }
    }

    ws.onclose = (event) => {
      if (event.code === 1000 || event.code === 4401 || event.code === 4403) {
        setConnectionState('disconnected')
        return
      }
      if (retryCount.current < maxRetries) {
        const delay = Math.pow(2, retryCount.current) * 1000
        retryCount.current += 1
        setConnectionState('reconnecting')
        retryTimer.current = setTimeout(connect, delay)
      } else {
        setConnectionState('disconnected')
      }
    }

    ws.onerror = () => { ws.close() }
  }, [accessToken, restaurantId])

  useEffect(() => {
    if (!enabled || !accessToken || !restaurantId) {
      setConnectionState('disconnected')
      return
    }
    connect()
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
      wsRef.current?.close(1000)
    }
  }, [enabled, accessToken, restaurantId, connect])

  return { connectionState }
}
```

- [ ] **Step 5.2 — Create `src/hooks/useSoundAlert.ts`**

```ts
'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

const SOUND_KEY = 'eta-restaurant-sound-enabled'

export function useSoundAlert() {
  const [enabled, setEnabledState] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(SOUND_KEY)
    if (stored !== null) setEnabledState(stored === 'true')
    audioRef.current = new Audio('/notification.mp3')
    audioRef.current.preload = 'auto'
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_KEY, String(v))
    }
  }, [])

  // Call on any user click to unlock browser autoplay policy.
  const unlock = useCallback(() => {
    if (unlockedRef.current || !audioRef.current) return
    audioRef.current.play()
      .then(() => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
        unlockedRef.current = true
      })
      .catch(() => { /* still locked, try next time */ })
  }, [])

  const play = useCallback(() => {
    if (!enabled || !audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => { /* autoplay blocked */ })
  }, [enabled])

  return { enabled, setEnabled, play, unlock }
}
```

- [ ] **Step 5.3 — Create `src/components/layout/ConnectionBadge.tsx`**

```tsx
import { Badge } from '@/components/ui'
import type { ConnectionState } from '@/hooks/useRestaurantSocket'

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  if (state === 'connected') return <Badge variant="success" dot>LIVE</Badge>
  if (state === 'reconnecting') return <Badge variant="warning" dot>Reconnecting…</Badge>
  return <Badge variant="muted">Offline</Badge>
}
```

- [ ] **Step 5.4 — Create `src/components/layout/SoundToggle.tsx`**

```tsx
'use client'
import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SoundToggleProps {
  enabled: boolean
  onToggle: () => void
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
        enabled
          ? 'bg-success-bg text-success border border-success/30'
          : 'bg-surface2 text-text-secondary border border-border',
      )}
      title={enabled ? 'Sound alerts on' : 'Sound alerts off'}
    >
      {enabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      {enabled ? 'Sound on' : 'Sound off'}
    </button>
  )
}
```

- [ ] **Step 5.5 — Create `src/components/layout/Sidebar.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, LayoutDashboard, ClipboardList, Utensils, BarChart3, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',            label: 'Live Orders',     icon: LayoutDashboard },
  { href: '/dashboard/orders',     label: 'Order History',   icon: ClipboardList  },
  { href: '/dashboard/menu',       label: 'Menu',            icon: Utensils       },
  { href: '/dashboard/analytics',  label: 'Analytics',       icon: BarChart3      },
  { href: '/dashboard/profile',    label: 'Profile',         icon: User           },
]

export function Sidebar({ restaurantName }: { restaurantName: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-surface border-r border-border flex flex-col">
      <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
        <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
          <ChefHat className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">ETA Eats</p>
          <p className="text-xs text-text-secondary truncate">{restaurantName ?? 'Restaurant'}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 h-9 px-3 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-soft text-primary'
                  : 'text-text-secondary hover:bg-surface2 hover:text-text-primary',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 5.6 — Create `src/components/layout/TopBar.tsx`**

```tsx
'use client'
import { ConnectionBadge } from './ConnectionBadge'
import { SoundToggle } from './SoundToggle'
import type { ConnectionState } from '@/hooks/useRestaurantSocket'

interface TopBarProps {
  title: string
  subtitle?: string
  connectionState: ConnectionState
  soundEnabled: boolean
  onSoundToggle: () => void
}

export function TopBar({ title, subtitle, connectionState, soundEnabled, onSoundToggle }: TopBarProps) {
  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6">
      <div>
        <h1 className="text-base font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <SoundToggle enabled={soundEnabled} onToggle={onSoundToggle} />
        <ConnectionBadge state={connectionState} />
      </div>
    </header>
  )
}
```

- [ ] **Step 5.7 — Create `src/app/dashboard/layout.tsx`**

```tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantSocket, type ConnectionState } from '@/hooks/useRestaurantSocket'
import { useSoundAlert } from '@/hooks/useSoundAlert'
import type { OrderStatusPayload } from '@/lib/api.types'

interface DashboardCtx {
  connectionState: ConnectionState
}

const Ctx = createContext<DashboardCtx>({ connectionState: 'disconnected' })
export const useDashboard = () => useContext(Ctx)

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard':            { title: 'Live Orders' },
  '/dashboard/orders':     { title: 'Order History' },
  '/dashboard/menu':       { title: 'Menu Management' },
  '/dashboard/analytics':  { title: 'Analytics' },
  '/dashboard/profile':    { title: 'Profile' },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, restaurantId, restaurantName } = useAuthStore()
  const queryClient = useQueryClient()
  const { enabled: soundEnabled, setEnabled: setSoundEnabled, play: playSound, unlock: unlockSound } = useSoundAlert()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated || !restaurantId) router.replace('/login')
  }, [mounted, isAuthenticated, restaurantId, router])

  const handleWSMessage = (payload: OrderStatusPayload) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    if (payload.event === 'created') {
      toast('New order received', { description: payload.body ?? 'A new order is waiting.' })
      playSound()
    }
  }

  const { connectionState } = useRestaurantSocket({
    onMessage: handleWSMessage,
    enabled: mounted && isAuthenticated && !!restaurantId,
  })

  // Unlock audio on first user interaction anywhere in the dashboard.
  useEffect(() => {
    const handler = () => unlockSound()
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  }, [unlockSound])

  if (!mounted || !isAuthenticated || !restaurantId) return null

  const pageMeta = PAGE_TITLES[pathname] ?? (
    pathname.startsWith('/dashboard/menu/item') ? { title: 'Menu Management' } : { title: 'Dashboard' }
  )

  return (
    <Ctx.Provider value={{ connectionState }}>
      <div className="min-h-screen flex bg-bg">
        <Sidebar restaurantName={restaurantName} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            title={pageMeta.title}
            subtitle={pageMeta.subtitle}
            connectionState={connectionState}
            soundEnabled={soundEnabled}
            onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </Ctx.Provider>
  )
}
```

- [ ] **Step 5.8 — Create placeholder page for first run**

Create `src/app/dashboard/page.tsx` (temporary — full kanban comes in Task 6):
```tsx
export default function LiveOrdersPage() {
  return (
    <div className="p-6">
      <p className="text-text-secondary">Live orders kanban coming in Task 6.</p>
    </div>
  )
}
```

- [ ] **Step 5.9 — Add notification sound placeholder**

Create `public/notification.mp3` — if no branded asset is ready, copy a short chime. Use a silent file if needed; the UI will still function.
```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant/public

# Minimal silent/soft MP3 — or download any short notification chime.
# For MVP placeholder, create a 1-byte file to avoid a missing-asset 404:
printf '\xff\xfb\x90\x00' > notification.mp3
```

(Replace with a real chime before launch.)

- [ ] **Step 5.10 — Type-check, dev-run, and commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npx tsc --noEmit
```

Briefly run `npm run dev`, open `http://localhost:3001`, log in with seeded restaurant owner (`+919100000003`). Expected: sidebar + topbar renders, connection badge attempts to connect.

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): dashboard shell — sidebar, topbar, WS hook, sound alerts"
```

---

## Task 6: Live Orders kanban

**Files:**
- Create: `src/components/orders/OrderCard.tsx`
- Create: `src/components/orders/KanbanColumn.tsx`
- Create: `src/components/orders/CancelOrderDialog.tsx`
- Modify: `src/app/dashboard/page.tsx` (replace placeholder)

- [ ] **Step 6.1 — Create `src/components/orders/CancelOrderDialog.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { Dialog, Button, Textarea } from '@/components/ui'

const REASONS = ['Out of stock', 'Kitchen closed', 'Too busy', 'Other']

interface CancelOrderDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void> | void
  orderShortId: string
}

export function CancelOrderDialog({ open, onClose, onConfirm, orderShortId }: CancelOrderDialogProps) {
  const [reason, setReason] = useState(REASONS[0] ?? '')
  const [other, setOther] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    const finalReason = reason === 'Other' ? other.trim() : reason
    if (!finalReason) return
    setSubmitting(true)
    try { await onConfirm(finalReason) } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Cancel order #${orderShortId}?`}>
      <p className="text-sm text-text-secondary mb-4">
        This cannot be undone. The passenger will be notified and refunded if paid.
      </p>

      <div className="space-y-2 mb-4">
        {REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 p-2 rounded-md hover:bg-surface2 cursor-pointer">
            <input
              type="radio"
              name="reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="accent-primary"
            />
            <span className="text-sm text-text-primary">{r}</span>
          </label>
        ))}
      </div>

      {reason === 'Other' && (
        <Textarea
          value={other}
          onChange={(e) => setOther(e.target.value)}
          placeholder="Tell the passenger why…"
          className="mb-4"
        />
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>Keep order</Button>
        <Button variant="danger" onClick={handleConfirm} loading={submitting}>Cancel order</Button>
      </div>
    </Dialog>
  )
}
```

- [ ] **Step 6.2 — Create `src/components/orders/OrderCard.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { CancelOrderDialog } from './CancelOrderDialog'
import type { Order, OrderStatus } from '@/lib/api.types'

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus; variant: 'primary' | 'success' }>> = {
  PENDING:   { label: 'Confirm',       next: 'CONFIRMED',  variant: 'primary' },
  CONFIRMED: { label: 'Start Cooking', next: 'PREPARING',  variant: 'primary' },
  PREPARING: { label: 'Mark Ready',    next: 'READY',      variant: 'success' },
  READY:     { label: 'Picked Up',     next: 'PICKED_UP',  variant: 'success' },
}

interface OrderCardProps {
  order: Order
  isNew?: boolean
  accent: 'primary' | 'warning' | 'success'
  onAdvance: (orderId: string, next: OrderStatus) => Promise<void> | void
  onCancel: (orderId: string, reason: string) => Promise<void> | void
}

export function OrderCard({ order, isNew, accent, onAdvance, onCancel }: OrderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const action = NEXT_ACTION[order.status]
  const shortId = order.id.slice(0, 8)

  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins === 1) return '1 min ago'
    if (mins < 60) return `${mins} min ago`
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <motion.div
      layout
      initial={isNew ? { scale: 0.95, opacity: 0 } : false}
      animate={isNew ? { scale: [0.95, 1.03, 1], opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card accent={accent} className="relative">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-bold text-primary">{order.bus_name}</p>
            <p className="text-[10px] text-text-muted">#{shortId}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 text-text-muted hover:text-text-primary rounded"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-20 bg-surface border border-border rounded-md shadow-md py-1 w-36">
                  <button
                    onClick={() => { setMenuOpen(false); setCancelOpen(true) }}
                    className="w-full text-left text-xs px-3 py-2 text-error hover:bg-error-bg"
                  >
                    Cancel order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-0.5 mb-3">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between text-xs">
              <span className="text-text-primary truncate">{i.menu_item_name}</span>
              <span className="text-text-secondary flex-shrink-0">× {i.quantity}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-primary">₹{order.total_amount}</p>
            <p className="text-[10px] text-text-muted">{timeAgo(order.created_at)}</p>
          </div>
          {action && (
            <Button
              size="sm"
              variant={action.variant}
              onClick={() => onAdvance(order.id, action.next)}
            >
              {action.label}
            </Button>
          )}
        </div>
      </Card>

      <CancelOrderDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          await onCancel(order.id, reason)
          setCancelOpen(false)
        }}
        orderShortId={shortId}
      />
    </motion.div>
  )
}
```

- [ ] **Step 6.3 — Create `src/components/orders/KanbanColumn.tsx`**

```tsx
import { AnimatePresence } from 'framer-motion'
import { OrderCard } from './OrderCard'
import type { Order, OrderStatus } from '@/lib/api.types'

interface KanbanColumnProps {
  title: string
  count: number
  accent: 'primary' | 'warning' | 'success'
  orders: Order[]
  newOrderIds: Set<string>
  onAdvance: (orderId: string, next: OrderStatus) => Promise<void> | void
  onCancel: (orderId: string, reason: string) => Promise<void> | void
}

const HEADER_COLORS = {
  primary: 'text-primary',
  warning: 'text-warning',
  success: 'text-success',
}

export function KanbanColumn({ title, count, accent, orders, newOrderIds, onAdvance, onCancel }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col bg-surface2 rounded-md">
      <div className="h-11 flex items-center gap-2 px-4 border-b border-border">
        <h2 className={`text-xs font-bold uppercase tracking-wider ${HEADER_COLORS[accent]}`}>{title}</h2>
        <span className="text-xs font-bold text-text-muted bg-surface rounded-full px-2 py-0.5 border border-border">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence initial={false}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              accent={accent}
              isNew={newOrderIds.has(order.id)}
              onAdvance={onAdvance}
              onCancel={onCancel}
            />
          ))}
        </AnimatePresence>
        {orders.length === 0 && (
          <p className="text-xs text-text-muted text-center py-6">No orders here.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6.4 — Replace `src/app/dashboard/page.tsx`**

```tsx
'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KanbanColumn } from '@/components/orders/KanbanColumn'
import { Spinner } from '@/components/ui'
import api from '@/lib/api'
import type { Order, OrderStatus, Paginated } from '@/lib/api.types'

interface AdvancePayload { orderId: string; status: OrderStatus; reason?: string }

export default function LiveOrdersPage() {
  const queryClient = useQueryClient()
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
  const previousIdsRef = useRef<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', 'live'],
    queryFn: () =>
      api
        .get<Paginated<Order>>('/orders/restaurant/?page_size=100')
        .then((r) => r.data),
    refetchInterval: 8000,
  })

  const orders = data?.results ?? []

  // Detect newly-arrived PENDING orders (animate pulse on first render)
  useEffect(() => {
    const currentIds = new Set(orders.map((o) => o.id))
    const additions = new Set<string>()
    currentIds.forEach((id) => {
      if (!previousIdsRef.current.has(id)) additions.add(id)
    })
    if (previousIdsRef.current.size > 0 && additions.size > 0) {
      setNewOrderIds(additions)
      const t = setTimeout(() => setNewOrderIds(new Set()), 2000)
      previousIdsRef.current = currentIds
      return () => clearTimeout(t)
    }
    previousIdsRef.current = currentIds
  }, [orders])

  const advanceMutation = useMutation({
    mutationFn: (p: AdvancePayload) =>
      api.post(`/orders/restaurant/${p.orderId}/advance/`, {
        status: p.status,
        ...(p.reason ? { reason: p.reason } : {}),
      }),
    onMutate: async ({ orderId, status }: AdvancePayload) => {
      await queryClient.cancelQueries({ queryKey: ['orders', 'live'] })
      const prev = queryClient.getQueryData<Paginated<Order>>(['orders', 'live'])
      if (prev) {
        queryClient.setQueryData<Paginated<Order>>(['orders', 'live'], {
          ...prev,
          results: prev.results.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })
      }
      return { prev }
    },
    onError: (err: unknown, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['orders', 'live'], ctx.prev)
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(axiosErr?.response?.data?.error?.message ?? 'Could not update order.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'live'] })
    },
  })

  const handleAdvance = useCallback(
    (orderId: string, status: OrderStatus) => advanceMutation.mutateAsync({ orderId, status }),
    [advanceMutation],
  )
  const handleCancel = useCallback(
    (orderId: string, reason: string) => advanceMutation.mutateAsync({ orderId, status: 'CANCELLED', reason }),
    [advanceMutation],
  )

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <p className="text-sm text-text-secondary">Could not load orders.</p>
        <button onClick={() => refetch()} className="text-sm text-primary font-semibold">Retry</button>
      </div>
    )
  }

  const newOrders     = orders.filter((o) => o.status === 'PENDING')
  const cookingOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING')
  const readyOrders   = orders.filter((o) => o.status === 'READY')

  return (
    <div className="h-full p-6">
      <div className="h-full flex gap-4 min-h-0">
        <KanbanColumn
          title="New"
          count={newOrders.length}
          accent="primary"
          orders={newOrders}
          newOrderIds={newOrderIds}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
        />
        <KanbanColumn
          title="Cooking"
          count={cookingOrders.length}
          accent="warning"
          orders={cookingOrders}
          newOrderIds={newOrderIds}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
        />
        <KanbanColumn
          title="Ready"
          count={readyOrders.length}
          accent="success"
          orders={readyOrders}
          newOrderIds={newOrderIds}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6.5 — Type-check and commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npx tsc --noEmit
```

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): live orders kanban with WebSocket realtime, optimistic advance, cancel dialog"
```

---

## Task 7: Order History

**Files:**
- Create: `src/app/dashboard/orders/page.tsx`

- [ ] **Step 7.1 — Create `src/app/dashboard/orders/page.tsx`**

```tsx
'use client'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Badge, Card, Input, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Order, OrderStatus, Paginated } from '@/lib/api.types'

const STATUS_VARIANT: Record<OrderStatus, 'primary' | 'success' | 'warning' | 'error' | 'muted'> = {
  PENDING:   'warning',
  CONFIRMED: 'primary',
  PREPARING: 'primary',
  READY:     'success',
  PICKED_UP: 'muted',
  CANCELLED: 'error',
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'all'

function startOf(preset: DatePreset): Date | null {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (preset === 'today') return d
  if (preset === 'yesterday') { d.setDate(d.getDate() - 1); return d }
  if (preset === 'week') { d.setDate(d.getDate() - 6); return d }
  return null
}
function endOf(preset: DatePreset): Date | null {
  if (preset !== 'yesterday') return null
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setMilliseconds(-1)
  return d
}

export default function OrderHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [datePreset, setDatePreset]     = useState<DatePreset>('today')
  const [busSearch, setBusSearch]       = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'history'],
    queryFn: () =>
      api
        .get<Paginated<Order>>('/orders/restaurant/?page_size=200&ordering=-created_at')
        .then((r) => r.data),
  })

  const orders = data?.results ?? []

  const filtered = useMemo(() => {
    const fromDate = startOf(datePreset)
    const toDate = endOf(datePreset)
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
      const created = new Date(o.created_at)
      if (fromDate && created < fromDate) return false
      if (toDate && created > toDate) return false
      if (busSearch && !o.bus_name.toLowerCase().includes(busSearch.toLowerCase())) return false
      return true
    })
  }, [orders, statusFilter, datePreset, busSearch])

  const statusChips: (OrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED']

  return (
    <div className="p-6 space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-secondary uppercase">Status:</span>
            {statusChips.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'text-xs font-semibold rounded-full px-3 py-1 border transition-colors',
                  statusFilter === s
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-secondary border-border hover:border-primary',
                )}
              >
                {s === 'ALL' ? 'All' : s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-secondary uppercase">Date:</span>
            {(['today', 'yesterday', 'week', 'all'] as DatePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setDatePreset(p)}
                className={cn(
                  'text-xs font-semibold rounded-full px-3 py-1 border transition-colors capitalize',
                  datePreset === p
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-secondary border-border hover:border-primary',
                )}
              >
                {p === 'week' ? 'This week' : p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search by bus name or plate…"
              value={busSearch}
              onChange={(e) => setBusSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>
      </Card>

      {/* Results */}
      {isLoading && (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-text-secondary">No orders match these filters.</p>
        </Card>
      )}

      {!isLoading && filtered.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Bus</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-surface2">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">#{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-text-primary">{o.bus_name}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs truncate max-w-[260px]">
                    {o.items.map((i) => `${i.menu_item_name} ×${i.quantity}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-text-primary">₹{o.total_amount}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 7.2 — Type-check and commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npx tsc --noEmit
```

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): order history with status/date/bus filters"
```

---

## Task 8: Menu Management

**Files:**
- Create: `src/components/menu/AvailabilityToggle.tsx`
- Create: `src/components/menu/CategoryFormDialog.tsx`
- Create: `src/components/menu/MenuItemRow.tsx`
- Create: `src/app/dashboard/menu/page.tsx`
- Create: `src/app/dashboard/menu/item/new/page.tsx`
- Create: `src/app/dashboard/menu/item/[id]/page.tsx`

- [ ] **Step 8.1 — Create `src/components/menu/AvailabilityToggle.tsx`**

```tsx
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Switch } from '@/components/ui'
import api from '@/lib/api'
import type { MenuItem } from '@/lib/api.types'

export function AvailabilityToggle({ item }: { item: MenuItem }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (is_available: boolean) =>
      api.patch<MenuItem>(`/restaurants/menu-items/${item.id}/`, { is_available }),
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['menu-items'] })
      const prev = queryClient.getQueryData<MenuItem[]>(['menu-items'])
      if (prev) {
        queryClient.setQueryData<MenuItem[]>(
          ['menu-items'],
          prev.map((i) => (i.id === item.id ? { ...i, is_available: next } : i)),
        )
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['menu-items'], ctx.prev)
      toast.error('Could not update availability.')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['menu-items'] }),
  })

  return <Switch checked={item.is_available} onChange={(v) => mutation.mutate(v)} />
}
```

- [ ] **Step 8.2 — Create `src/components/menu/CategoryFormDialog.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, Button, Input } from '@/components/ui'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import type { MenuCategory } from '@/lib/api.types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: MenuCategory | null
}

export function CategoryFormDialog({ open, onClose, editing }: Props) {
  const { restaurantId } = useAuthStore()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('0')

  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setSortOrder(String(editing.sort_order))
    } else {
      setName('')
      setSortOrder('0')
    }
  }, [editing, open])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { restaurant: restaurantId, name, sort_order: parseInt(sortOrder) || 0 }
      if (editing) {
        return api.patch<MenuCategory>(`/restaurants/menu-categories/${editing.id}/`, payload)
      }
      return api.post<MenuCategory>('/restaurants/menu-categories/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      onClose()
      toast.success(editing ? 'Category updated' : 'Category created')
    },
    onError: () => toast.error('Could not save category.'),
  })

  return (
    <Dialog open={open} onClose={onClose} title={editing ? 'Edit category' : 'New category'}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Course" />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary block mb-1">Sort order</label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!name.trim()}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
```

- [ ] **Step 8.3 — Create `src/components/menu/MenuItemRow.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AvailabilityToggle } from './AvailabilityToggle'
import api from '@/lib/api'
import type { MenuItem } from '@/lib/api.types'

export function MenuItemRow({ item }: { item: MenuItem }) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/restaurants/menu-items/${item.id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Item deleted')
    },
    onError: () => toast.error('Could not delete item.'),
  })

  return (
    <tr className="border-t border-border hover:bg-surface2">
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">{item.name}</p>
        {item.description && (
          <p className="text-xs text-text-muted truncate max-w-sm">{item.description}</p>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">₹{item.price}</td>
      <td className="px-4 py-3 text-sm text-text-secondary">{item.prep_time_minutes} min</td>
      <td className="px-4 py-3"><AvailabilityToggle item={item} /></td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Link
            href={`/dashboard/menu/item/${item.id}`}
            className="p-2 rounded-md text-text-secondary hover:bg-surface hover:text-text-primary"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              if (confirm(`Delete ${item.name}?`)) deleteMutation.mutate()
            }}
            className="p-2 rounded-md text-error hover:bg-error-bg"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
```

- [ ] **Step 8.4 — Create `src/app/dashboard/menu/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, Spinner } from '@/components/ui'
import { MenuItemRow } from '@/components/menu/MenuItemRow'
import { CategoryFormDialog } from '@/components/menu/CategoryFormDialog'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { MenuCategory, MenuItem, Paginated } from '@/lib/api.types'

export default function MenuPage() {
  const { restaurantId } = useAuthStore()
  const queryClient = useQueryClient()
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null)

  const categoriesQ = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () =>
      api.get<Paginated<MenuCategory>>('/restaurants/menu-categories/?page_size=100').then((r) => r.data.results),
  })

  const itemsQ = useQuery({
    queryKey: ['menu-items'],
    queryFn: () =>
      api
        .get<Paginated<MenuItem>>(`/restaurants/menu-items/?restaurant=${restaurantId}&page_size=200`)
        .then((r) => r.data.results),
    enabled: !!restaurantId,
  })

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/restaurants/menu-categories/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      toast.success('Category deleted')
    },
    onError: () => toast.error('Could not delete category.'),
  })

  const categories = categoriesQ.data ?? []
  const items = itemsQ.data ?? []

  const itemsByCategory = new Map<number | null, MenuItem[]>()
  for (const item of items) {
    const key = item.category
    if (!itemsByCategory.has(key)) itemsByCategory.set(key, [])
    itemsByCategory.get(key)!.push(item)
  }

  if (categoriesQ.isLoading || itemsQ.isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Categories */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-text-primary">Categories</h2>
          <Button
            size="sm"
            onClick={() => { setEditingCat(null); setCatDialogOpen(true) }}
          >
            <Plus className="h-4 w-4" /> New category
          </Button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            No categories yet. Create one to start organising your menu.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="inline-flex items-center gap-1 rounded-md bg-surface2 border border-border pl-3 pr-1 py-1">
                <span className="text-sm font-medium text-text-primary">{cat.name}</span>
                <span className="text-xs text-text-muted">({itemsByCategory.get(cat.id)?.length ?? 0})</span>
                <button
                  onClick={() => { setEditingCat(cat); setCatDialogOpen(true) }}
                  className="p-1 text-text-muted hover:text-primary"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${cat.name}"? Items in this category will become uncategorised.`)) {
                      deleteCatMutation.mutate(cat.id)
                    }
                  }}
                  className="p-1 text-text-muted hover:text-error"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Items */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">Menu items</h2>
          <Link href="/dashboard/menu/item/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add item
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-text-muted py-12 text-center">
            No menu items yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Prep</th>
                <th className="text-left px-4 py-3">Available</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => <MenuItemRow key={item.id} item={item} />)}
            </tbody>
          </table>
        )}
      </Card>

      <CategoryFormDialog
        open={catDialogOpen}
        onClose={() => setCatDialogOpen(false)}
        editing={editingCat}
      />
    </div>
  )
}
```

- [ ] **Step 8.5 — Create `src/app/dashboard/menu/item/new/page.tsx`**

```tsx
'use client'
import { MenuItemForm } from './_form'

export default function NewItemPage() {
  return <MenuItemForm />
}
```

- [ ] **Step 8.6 — Create `src/app/dashboard/menu/item/new/_form.tsx`**

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, Input, Textarea, Switch } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { MenuCategory, MenuItem, Paginated } from '@/lib/api.types'

const schema = z.object({
  name: z.string().min(1, 'Required').max(200),
  description: z.string().max(500).optional().default(''),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid price'),
  prep_time_minutes: z.coerce.number().int().min(1).max(120),
  category: z.coerce.number().nullable().optional(),
  photo_url: z.string().max(500).optional().default(''),
  is_available: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

interface MenuItemFormProps {
  itemId?: number
  defaults?: Partial<FormValues>
}

export function MenuItemForm({ itemId, defaults }: MenuItemFormProps) {
  const router = useRouter()
  const { restaurantId } = useAuthStore()

  const categoriesQ = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () =>
      api.get<Paginated<MenuCategory>>('/restaurants/menu-categories/?page_size=100').then((r) => r.data.results),
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      prep_time_minutes: 10,
      category: null,
      photo_url: '',
      is_available: true,
      ...defaults,
    },
  })

  const isAvailable = watch('is_available')

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, restaurant: restaurantId }
      if (itemId) return api.patch<MenuItem>(`/restaurants/menu-items/${itemId}/`, payload)
      return api.post<MenuItem>('/restaurants/menu-items/', payload)
    },
    onSuccess: () => {
      toast.success(itemId ? 'Item updated' : 'Item created')
      router.push('/dashboard/menu')
    },
    onError: () => toast.error('Could not save item.'),
  })

  const onSubmit = (values: FormValues) => mutation.mutate(values)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to menu
      </button>

      <Card>
        <h1 className="text-lg font-bold text-text-primary mb-6">
          {itemId ? 'Edit menu item' : 'New menu item'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Name *</label>
            <Input {...register('name')} placeholder="e.g. Dal Makhani" />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Description</label>
            <Textarea {...register('description')} placeholder="Slow-cooked black lentils, butter" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Price (₹) *</label>
              <Input {...register('price')} placeholder="160.00" />
              {errors.price && <p className="text-xs text-error mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Prep time (minutes) *</label>
              <Input type="number" {...register('prep_time_minutes')} min={1} max={120} />
              {errors.prep_time_minutes && <p className="text-xs text-error mt-1">{errors.prep_time_minutes.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Category</label>
            <select
              {...register('category')}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              defaultValue=""
            >
              <option value="">(None)</option>
              {categoriesQ.data?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Photo URL</label>
            <Input {...register('photo_url')} placeholder="https://…" />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isAvailable} onChange={(v) => setValue('is_available', v)} />
            <span className="text-sm text-text-primary">Available</span>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>
              {itemId ? 'Save changes' : 'Create item'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 8.7 — Create `src/app/dashboard/menu/item/[id]/page.tsx`**

```tsx
'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui'
import { MenuItemForm } from '../new/_form'
import api from '@/lib/api'
import type { MenuItem } from '@/lib/api.types'

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const itemId = parseInt(id)

  const { data, isLoading } = useQuery({
    queryKey: ['menu-item', itemId],
    queryFn: () => api.get<MenuItem>(`/restaurants/menu-items/${itemId}/`).then((r) => r.data),
  })

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <MenuItemForm
      itemId={itemId}
      defaults={{
        name: data.name,
        description: data.description,
        price: data.price,
        prep_time_minutes: data.prep_time_minutes,
        category: data.category,
        photo_url: data.photo_url,
        is_available: data.is_available,
      }}
    />
  )
}
```

- [ ] **Step 8.8 — Type-check and commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npx tsc --noEmit
```

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): menu management — categories, items CRUD, availability toggle"
```

---

## Task 9: Profile page

**Files:**
- Create: `src/app/dashboard/profile/page.tsx`

- [ ] **Step 9.1 — Create `src/app/dashboard/profile/page.tsx`**

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LogOut, Mail, Phone, Store, User as UserIcon } from 'lucide-react'
import { Button, Card, Input, Spinner } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { Restaurant, User } from '@/lib/api.types'

interface ProfileForm {
  full_name: string
  email: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, restaurantId, refreshToken } = useAuthStore()
  const { logout } = useAuth()
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { isDirty } } = useForm<ProfileForm>({
    defaultValues: { full_name: user?.full_name ?? '', email: user?.email ?? '' },
  })

  const restaurantQ = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => api.get<Restaurant>(`/restaurants/${restaurantId}/`).then((r) => r.data),
    enabled: !!restaurantId,
  })

  const updateMutation = useMutation({
    mutationFn: (values: ProfileForm) => api.patch<User>('/auth/me/', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Profile updated')
    },
    onError: () => toast.error('Could not update profile.'),
  })

  async function handleLogout() {
    await logout(refreshToken)
    router.replace('/login')
  }

  const restaurant = restaurantQ.data

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* User profile */}
      <Card>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center text-primary font-bold">
            {user?.full_name ? user.full_name[0]?.toUpperCase() : <UserIcon className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Your profile</h2>
            <p className="text-xs text-text-secondary">Signed in as {user?.phone_number}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Full name</label>
            <Input {...register('full_name')} placeholder="Your name" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Email</label>
            <Input type="email" {...register('email')} placeholder="you@example.com" />
          </div>

          <div className="flex gap-3">
            <Phone className="h-4 w-4 text-text-muted mt-0.5" />
            <div>
              <p className="text-xs text-text-muted">Phone (can&apos;t be changed)</p>
              <p className="text-sm text-text-primary">{user?.phone_number}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Restaurant info (read-only) */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-text-primary">Restaurant details</h2>
        </div>

        {restaurantQ.isLoading && <Spinner className="h-6 w-6" />}
        {restaurant && (
          <dl className="divide-y divide-border">
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">Name</dt>
              <dd className="text-text-primary font-semibold">{restaurant.name}</dd>
            </div>
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">Address</dt>
              <dd className="text-text-primary text-right max-w-sm">{restaurant.address}</dd>
            </div>
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">Phone</dt>
              <dd className="text-text-primary">{restaurant.phone_number}</dd>
            </div>
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">FSSAI</dt>
              <dd className="text-text-primary font-mono text-xs">{restaurant.fssai_license_number}</dd>
            </div>
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">Hygiene rating</dt>
              <dd className="text-text-primary">{restaurant.hygiene_rating ?? '—'}</dd>
            </div>
          </dl>
        )}

        <p className="text-xs text-text-muted mt-4 flex items-center gap-2">
          <Mail className="h-3 w-3" />
          To change restaurant details, contact the ETA Eats admin.
        </p>
      </Card>

      {/* Sign out */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Sign out</h2>
            <p className="text-xs text-text-secondary">You&apos;ll need to enter your phone &amp; OTP again.</p>
          </div>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 9.2 — Type-check and commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npx tsc --noEmit
```

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): profile page with user edit, restaurant view, sign out"
```

---

## Task 10: Analytics (today)

**Files:**
- Create: `src/components/analytics/StatTile.tsx`
- Create: `src/components/analytics/HourlyRevenueChart.tsx`
- Create: `src/components/analytics/TopItemsList.tsx`
- Create: `src/app/dashboard/analytics/page.tsx`

- [ ] **Step 10.1 — Create `src/components/analytics/StatTile.tsx`**

```tsx
import { Card } from '@/components/ui'

interface StatTileProps {
  label: string
  value: string
  delta?: string
  accent?: 'primary' | 'success' | 'warning' | 'error'
}

export function StatTile({ label, value, delta, accent = 'primary' }: StatTileProps) {
  const accentColor = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    error:   'text-error',
  }[accent]

  return (
    <Card>
      <p className="text-xs font-semibold text-text-secondary uppercase">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accentColor}`}>{value}</p>
      {delta && <p className="text-xs text-text-muted mt-1">{delta}</p>}
    </Card>
  )
}
```

- [ ] **Step 10.2 — Create `src/components/analytics/HourlyRevenueChart.tsx`**

```tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface HourlyRevenueChartProps {
  data: { hour: string; revenue: number; orders: number }[]
}

export function HourlyRevenueChart({ data }: HourlyRevenueChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#4B5563' }} stroke="#E5E7EB" />
          <YAxis tick={{ fontSize: 11, fill: '#4B5563' }} stroke="#E5E7EB" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
            formatter={(value: number) => [`₹${value.toFixed(0)}`, 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#FF6B2B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 10.3 — Create `src/components/analytics/TopItemsList.tsx`**

```tsx
import { Card } from '@/components/ui'

interface TopItem {
  name: string
  count: number
  revenue: number
}

export function TopItemsList({ items }: { items: TopItem[] }) {
  return (
    <Card>
      <h3 className="text-sm font-bold text-text-primary mb-3">Top 5 items today</h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">No sales yet today.</p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li key={item.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-text-muted w-4">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                <p className="text-xs text-text-muted">Sold {item.count} · ₹{item.revenue.toFixed(0)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
```

- [ ] **Step 10.4 — Create `src/app/dashboard/analytics/page.tsx`**

```tsx
'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StatTile }            from '@/components/analytics/StatTile'
import { HourlyRevenueChart }  from '@/components/analytics/HourlyRevenueChart'
import { TopItemsList }        from '@/components/analytics/TopItemsList'
import { Card, Spinner }       from '@/components/ui'
import api from '@/lib/api'
import type { Order, Paginated } from '@/lib/api.types'

export default function AnalyticsPage() {
  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'today'],
    queryFn: () =>
      api
        .get<Paginated<Order>>(`/orders/restaurant/?page_size=200&created_at__gte=${encodeURIComponent(todayStart)}`)
        .then((r) => r.data.results),
  })

  const orders = data ?? []

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status !== 'CANCELLED')
    const cancelled = orders.filter((o) => o.status === 'CANCELLED')
    const revenue = paid.reduce((s, o) => s + parseFloat(o.total_amount), 0)

    // Top items
    const itemCounts = new Map<string, { count: number; revenue: number }>()
    paid.forEach((o) => {
      o.items.forEach((i) => {
        const existing = itemCounts.get(i.menu_item_name) ?? { count: 0, revenue: 0 }
        existing.count += i.quantity
        existing.revenue += parseFloat(i.line_total)
        itemCounts.set(i.menu_item_name, existing)
      })
    })
    const topItems = [...itemCounts.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Hourly buckets (00..23)
    const buckets: { hour: string; revenue: number; orders: number }[] = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, '0')}:00`,
      revenue: 0,
      orders: 0,
    }))
    paid.forEach((o) => {
      const h = new Date(o.created_at).getHours()
      const bucket = buckets[h]
      if (bucket) {
        bucket.revenue += parseFloat(o.total_amount)
        bucket.orders += 1
      }
    })
    // Trim to hours that have data so the chart is readable
    const firstIdx = buckets.findIndex((b) => b.orders > 0)
    const lastIdx = buckets.length - 1 - [...buckets].reverse().findIndex((b) => b.orders > 0)
    const trimmed = firstIdx === -1 ? [] : buckets.slice(firstIdx, lastIdx + 1)

    return {
      revenue,
      orderCount: paid.length,
      cancelledCount: cancelled.length,
      topItems,
      hourly: trimmed,
    }
  }, [orders])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="Today's revenue"
          value={`₹${stats.revenue.toFixed(0)}`}
          delta={`${stats.orderCount} paid order${stats.orderCount !== 1 ? 's' : ''}`}
          accent="primary"
        />
        <StatTile
          label="Orders completed"
          value={String(stats.orderCount)}
          accent="success"
        />
        <StatTile
          label="Cancelled"
          value={String(stats.cancelledCount)}
          accent="error"
        />
      </div>

      <Card>
        <h2 className="text-sm font-bold text-text-primary mb-4">Revenue by hour</h2>
        {stats.hourly.length === 0 ? (
          <p className="text-sm text-text-muted py-8 text-center">No orders yet today.</p>
        ) : (
          <HourlyRevenueChart data={stats.hourly} />
        )}
      </Card>

      <TopItemsList items={stats.topItems} />
    </div>
  )
}
```

- [ ] **Step 10.5 — Type-check and commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npx tsc --noEmit
```

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): today's analytics — stats tiles, hourly chart, top items"
```

---

## Task 11: Not-found page + final build

**Files:**
- Replace: `src/app/not-found.tsx`

- [ ] **Step 11.1 — Replace `src/app/not-found.tsx`**

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🤷</div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Page not found</h2>
      <p className="text-text-secondary text-sm mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 11.2 — Run final build and fix any errors**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2/frontend/restaurant
npm run build
```

Expected: builds cleanly. If errors appear, fix them and re-run.

- [ ] **Step 11.3 — Final commit**

```bash
cd /Users/kancharakuntlavineethreddy/Developer/Project/chinnuETAEats/ETA-Eats-v2
git add frontend/restaurant/
git commit -m "feat(restaurant): not-found page, final MVP build"
```

---

## Self-Review Against Spec

| Spec requirement | Covered in |
|------------------|-----------|
| OTP login with role check (RESTAURANT_STAFF only) | Task 4 (useAuth + login page) |
| Resolve restaurantId from active membership | Task 3 (auth.store.pickRestaurant) |
| Light theme design tokens (#FF6B2B primary) | Task 2 |
| Desktop sidebar + topbar layout | Task 5 |
| WebSocket `ws/restaurant/{id}/?token=...` | Task 5 (useRestaurantSocket) |
| New order alert: pulse + toast + sound | Tasks 5 (sound/toast) + 6 (pulse) |
| Sound toggle with localStorage persistence | Task 5 (useSoundAlert + SoundToggle) |
| Audio autoplay unlock on first click | Task 5 (unlockSound via document click handler) |
| Kanban 3 columns (New / Cooking / Ready) | Task 6 |
| Status advance buttons (Confirm / Start Cooking / Mark Ready / Picked Up) | Task 6 (OrderCard NEXT_ACTION map) |
| Cancel with reason dialog | Task 6 (CancelOrderDialog) |
| Optimistic UI on advance | Task 6 (advanceMutation.onMutate) |
| Polling fallback (8s) when WS disconnected | Task 6 (refetchInterval: 8000) |
| Order history with status/date/bus filters | Task 7 |
| Menu categories CRUD | Task 8 (CategoryFormDialog + delete) |
| Menu items CRUD (Zod validation) | Task 8 (MenuItemForm in _form.tsx) |
| Availability toggle (optimistic) | Task 8 (AvailabilityToggle) |
| User profile edit (name/email) | Task 9 |
| Restaurant profile view (read-only) | Task 9 |
| Sign out + token blacklist | Task 9 + Task 4 (useAuth.logout) |
| Today's analytics: revenue/orders/cancelled tiles | Task 10 |
| Hourly revenue chart (Recharts) | Task 10 |
| Top 5 items today | Task 10 |
| Connection badge (LIVE / Reconnecting / Offline) | Task 5 (ConnectionBadge) |
| Not-found page | Task 11 |
| Backend memberships on UserSerializer (verified — already exists) | Task 0 |

### Known scope adjustments vs spec
- **Restaurant profile edit is read-only** (spec Section 7.5 said `PATCH /restaurants/{id}/` was gated to owner — the backend currently gates it to `IsAdminOrOperator`, so staff cannot edit. This is documented in Task 9.)
- **Photo upload not included** (per MVP — text URL field only, S3 upload is V2)
- **Kitchen Display Mode, Bus ETA intelligence, multi-day analytics, FCM push** — all V2, not in plan
- **PWA manifest not included** — restaurant is desktop-first, PWA is V2

### Placeholder scan
No TBDs or TODO markers. Every step has real code.

### Type consistency
- `OrderStatus` — same definition across all files (api.types.ts is the single source)
- `advanceMutation.mutateAsync` signature — `{orderId, status, reason?}` used consistently in OrderCard and the dashboard page
- `Membership.org_type` — matches backend (`'restaurant' | 'operator'`)
