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

export interface ValidatePromoResponse {
  valid: boolean
  discount_amount: string
  final_total: string
  message: string
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
  promo_code: string
  discount_amount: string
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
