'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search, Star, MapPin, Clock } from 'lucide-react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { CategoryTabs } from '@/components/menu/CategoryTabs'
import { MenuItemRow } from '@/components/menu/MenuItemRow'
import { SearchOverlay } from '@/components/menu/SearchOverlay'
import { CartBar } from '@/components/menu/CartBar'
import { Badge, Card, Spinner, EmptyState, Button } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'
import { useAuthStore } from '@/stores/auth.store'
import { useJourneyStore } from '@/stores/journey.store'
import { useCartStore } from '@/stores/cart.store'
import api from '@/lib/api'
import type { Cart, CartItem, MenuItem, Paginated } from '@/lib/api.types'

export default function MenuPage() {
  const router = useRouter()
  const { restaurantId } = useParams<{ restaurantId: string }>()
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const activeJourney = useJourneyStore((s) => s.activeJourney)
  const touchJourney = useJourneyStore((s) => s.touchJourney)
  const restaurant = activeJourney?.restaurant ?? null
  const bus = activeJourney?.bus ?? null
  const { cartId, items: cartItems, setCart, setItems } = useCartStore()

  const [activeCategory, setActiveCategory] = useState('All')
  const [searchOpen, setSearchOpen] = useState(false)
  const [showCategoryTabs, setShowCategoryTabs] = useState(true)
  const [showCartBar, setShowCartBar] = useState(true)
  const hasActiveJourney = Boolean(activeJourney)
  const isCorrectJourneyRestaurant =
    hasActiveJourney && String(activeJourney!.restaurant.id) === String(restaurantId)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    if (!activeJourney) {
      toast.message('Scan your bus QR to open the menu.')
      router.replace('/scan?from=menu')
      return
    }
    if (!isCorrectJourneyRestaurant) {
      router.replace(`/menu/${activeJourney.restaurant.id}`)
    }
  }, [hasHydrated, isAuthenticated, activeJourney, isCorrectJourneyRestaurant, router])

  useEffect(() => {
    let lastY = 0
    let lastToggleY = 0
    let ticking = false
    let controlsVisible = true

    // Hysteresis values to avoid rapid show/hide flips while scrolling.
    const TOP_SHOW_THRESHOLD = 72
    const HIDE_AFTER_Y = 120
    const TOGGLE_TRAVEL_PX = 28

    const setControls = (visible: boolean, y: number) => {
      if (controlsVisible === visible) return
      controlsVisible = visible
      setShowCategoryTabs(visible)
      setShowCartBar(visible)
      lastToggleY = y
    }

    function update() {
      const y = window.scrollY
      const delta = y - lastY

      // Always show near top.
      if (y <= TOP_SHOW_THRESHOLD) {
        setControls(true, y)
        lastY = y
        ticking = false
        return
      }

      if (delta > 0) {
        // Scrolling down: hide only after enough distance and only once.
        if (controlsVisible && y >= HIDE_AFTER_Y && y - lastToggleY >= TOGGLE_TRAVEL_PX) {
          setControls(false, y)
        }
      } else if (delta < 0) {
        // Scrolling up: show only after enough reverse travel.
        if (!controlsVisible && lastToggleY - y >= TOGGLE_TRAVEL_PX) {
          setControls(true, y)
        }
      }

      lastY = y
      ticking = false
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { data: menuData, isLoading, isError, refetch } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () =>
      api.get<Paginated<MenuItem>>(`/restaurants/menu-items/?restaurant=${restaurantId}&page_size=100`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: hasHydrated && isAuthenticated && isCorrectJourneyRestaurant,
  })

  const allItems = useMemo(() => menuData?.results ?? [], [menuData])

  const categories = useMemo(
    () => [...new Set(allItems.map((i) => i.category_name ?? 'Other').filter(Boolean))],
    [allItems],
  )

  const displayed = useMemo(
    () => (activeCategory === 'All' ? allItems : allItems.filter((i) => i.category_name === activeCategory)),
    [allItems, activeCategory],
  )

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return { [activeCategory]: displayed }
    return displayed.reduce<Record<string, MenuItem[]>>((acc, item) => {
      const cat = item.category_name ?? 'Other'
      acc[cat] = [...(acc[cat] ?? []), item]
      return acc
    }, {})
  }, [displayed, activeCategory])

  if (!hasHydrated || !isAuthenticated || !isCorrectJourneyRestaurant) {
    return null
  }

  async function refreshCartFromServer() {
    try {
      const { data } = await api.get<Cart>('/orders/cart/')
      setCart(data.id, data.bus, data.restaurant, data.items)
    } catch {
      // Ignore here; caller handles user-facing toast.
    }
  }

  async function handleAdd(item: MenuItem) {
    if (!bus) {
      toast.error('Bus information missing. Please scan the QR again.')
      return
    }

    const previousItems = cartItems
    const existing = cartItems.find((ci) => ci.menu_item === item.id)

    const optimisticItems: CartItem[] = existing
      ? cartItems.map((ci) =>
          ci.menu_item === item.id
            ? {
                ...ci,
                quantity: ci.quantity + 1,
                line_total: (Number(ci.unit_price) * (ci.quantity + 1)).toFixed(2),
              }
            : ci,
        )
      : [
          ...cartItems,
          {
            id: -Date.now(),
            menu_item: item.id,
            menu_item_name: item.name,
            quantity: 1,
            unit_price: Number(item.price).toFixed(2),
            line_total: Number(item.price).toFixed(2),
          },
        ]

    // Optimistic update so cart bar appears instantly after tapping "Add".
    setItems(optimisticItems)
    touchJourney()

    try {
      const { data } = await api.post<Cart>('/orders/cart/', {
        menu_item: item.id,
        quantity: 1,
        bus_id: bus.id,
      })
      setCart(data.id, data.bus, data.restaurant, data.items)
    } catch (err: unknown) {
      setItems(previousItems)
      const axiosErr = err as { response?: { data?: { error?: { code?: string } } } }
      if (axiosErr?.response?.data?.error?.code === 'restaurant_mismatch') {
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
      const { data } = await api.patch<Cart>(`/orders/cart/items/${cartItemId}/`, { quantity: current.quantity + 1 })
      setCart(cartId, data.bus, data.restaurant, data.items)
      touchJourney()
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        await refreshCartFromServer()
        toast.message('Cart refreshed. Please try again.')
        return
      }
      toast.error('Could not update quantity.')
    }
  }

  async function handleDecrement(cartItemId: number, quantity: number) {
    if (!cartId) return
    try {
      if (quantity <= 1) {
        const { data } = await api.delete<Cart>(`/orders/cart/items/${cartItemId}/`)
        setCart(cartId, data.bus, data.restaurant, data.items)
      } else {
        const { data } = await api.patch<Cart>(`/orders/cart/items/${cartItemId}/`, { quantity: quantity - 1 })
        setCart(cartId, data.bus, data.restaurant, data.items)
      }
      touchJourney()
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        await refreshCartFromServer()
        toast.message('Cart refreshed. That item is no longer available.')
        return
      }
      toast.error('Could not update quantity.')
    }
  }

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="app-shell-inner flex items-center justify-center pt-20">
          <Spinner className="h-7 w-7" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="app-shell">
        <div className="app-shell-inner pt-12">
          <EmptyState
            tone="peach"
            title="Could not load menu"
            description="Check your connection and try again."
            action={<Button variant="secondary" onClick={() => refetch()}>Try again</Button>}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="app-shell-inner lg:pt-10">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md">
          <TopBar
            title={restaurant?.name ?? 'Menu'}
            subtitle={restaurant?.address ?? undefined}
            onBack={() => router.push('/home')}
            right={
              restaurant?.hygieneRating ? (
                <Badge variant="cream" size="sm">
                  <Star className="h-3 w-3 fill-current" />
                  {restaurant.hygieneRating}
                </Badge>
              ) : undefined
            }
            sticky={false}
            transparent
          />

          <div className="pb-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-3 bg-surface rounded-pill border border-border px-5 py-3
                         shadow-e1 transition-all duration-base ease-standard
                         hover:border-border-strong hover:shadow-e2"
            >
              <Search className="h-4 w-4 text-text-tertiary" />
              <span className="text-body-sm text-text-muted">Search dal, chicken, lassi…</span>
            </button>
          </div>

          <div
            className={
              `transition-all duration-base ease-standard overflow-hidden ` +
              (showCategoryTabs
                ? 'max-h-24 opacity-100 translate-y-0 pb-1'
                : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none')
            }
          >
            <CategoryTabs categories={categories} active={activeCategory} onChange={setActiveCategory} />
          </div>
        </div>

        {/* Journey context band */}
        {bus && (
          <div className="mx-4 lg:mx-0 mt-3 rounded-xl bg-accent-powder-blue px-4 py-3 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-accent-ink-powder-blue flex-shrink-0" strokeWidth={1.8} />
            <p className="text-body-sm text-accent-ink-powder-blue flex-1 truncate">
              Assigned to your bus · <span className="font-semibold">{bus.name}</span>
            </p>
            <Clock className="h-3.5 w-3.5 text-accent-ink-powder-blue/70" />
          </div>
        )}

        <div className="pb-40 lg:pb-24">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              {activeCategory === 'All' && (
                <div className="mt-8 mb-2">
                  <p className="text-label text-text-muted">Category</p>
                  <h2 className="mt-1.5 text-h3 text-text-primary">{cat}</h2>
                </div>
              )}
              <Card tone="default" padding="none" radius="card" shadow="e1" className="px-5 lg:px-7 mt-3">
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
              </Card>
            </div>
          ))}
        </div>

        <SearchOverlay open={searchOpen} items={allItems} onClose={() => setSearchOpen(false)} onAdd={handleAdd} />
        <CartBar visible={showCartBar} />
      </div>
    </div>
  )
}
