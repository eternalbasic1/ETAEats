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

  const { data: menuData, isLoading, isError, refetch } = useQuery({
    queryKey: ['menu', restaurantId],
    // Fetch all items (available + unavailable) so greyed-out unavailable
    // items still show. The cache is pre-seeded by the scan page, so this
    // network call is usually skipped on first load.
    queryFn: () =>
      api
        .get<Paginated<MenuItem>>(
          `/restaurants/menu-items/?restaurant=${restaurantId}&page_size=100`,
        )
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const allItems = menuData?.results ?? []

  const categories = useMemo(
    () => [
      ...new Set(
        allItems
          .map((i) => i.category_name ?? 'Other')
          .filter(Boolean),
      ),
    ],
    [allItems],
  )

  const displayed = useMemo(
    () =>
      activeCategory === 'All'
        ? allItems
        : allItems.filter((i) => i.category_name === activeCategory),
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

  async function handleAdd(item: MenuItem) {
    if (!bus) {
      toast.error('Bus information missing. Please scan the QR again.')
      return
    }
    try {
      const { data } = await api.post<Cart>('/orders/cart/', {
        menu_item: item.id,
        quantity: 1,
        bus_id: bus.id,
      })
      setCart(data.id, data.bus, data.restaurant, data.items)
    } catch (err: unknown) {
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
      const { data } = await api.patch<Cart>(`/orders/cart/items/${cartItemId}/`, {
        quantity: current.quantity + 1,
      })
      setCart(cartId, data.bus, data.restaurant, data.items)
    } catch {
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
        const { data } = await api.patch<Cart>(`/orders/cart/items/${cartItemId}/`, {
          quantity: quantity - 1,
        })
        setCart(cartId, data.bus, data.restaurant, data.items)
      }
    } catch {
      toast.error('Could not update quantity.')
    }
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
        <button
          onClick={() => refetch()}
          className="text-primary-soft text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="sticky top-0 z-30 bg-bg border-b border-white/5">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-text-primary">
                {restaurant?.name ?? 'Menu'}
              </h1>
              {restaurant?.hygieneRating && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span className="text-xs text-text-secondary">
                    {restaurant.hygieneRating}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="mt-3 w-full flex items-center gap-2 bg-surface2 rounded-xl px-4 py-2.5 border border-white/8"
          >
            <Search className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-muted">Search dal, chicken, lassi…</span>
          </button>
        </div>

        <CategoryTabs
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

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
