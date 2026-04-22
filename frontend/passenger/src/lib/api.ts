import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// ── Token helpers ─────────────────────────────────────────────────────────
const TOKEN_KEY = 'eta-auth'

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
      const { data } = await axios.post<{ access: string }>(
        `${BASE_URL}/api/v1/auth/token/refresh/`,
        { refresh: tokens.refresh },
      )
      const newAccess = data.access
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
