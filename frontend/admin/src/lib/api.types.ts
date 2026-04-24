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

export interface Tokens { access: string; refresh: string }
export interface AuthResponse { user: User; tokens: Tokens }

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

// ── Fleet ─────────────────────────────────────────────────────────────────
export interface BusOperator {
  id: number
  company_name: string
  contact_name: string
  phone_number: string
  email: string
  is_active: boolean
  created_at: string
}

export interface Route {
  id: number
  origin_city: string
  destination_city: string
  distance_km: number
  estimated_duration_hours: string
}

export interface Bus {
  id: number
  operator: number
  operator_name: string
  route: number | null
  route_label: string | null
  bus_name: string
  number_plate: string
  qr_token: string
  qr_image_url: string
  total_seats: number
  is_active: boolean
  latitude: number | null
  longitude: number | null
  last_gps_update: string | null
  created_at: string
}

export interface BusRestaurantAssignment {
  id: number
  bus: number
  bus_name: string
  restaurant: number
  restaurant_name: string
  is_active: boolean
  created_at: string
}

// ── Pagination ────────────────────────────────────────────────────────────
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
