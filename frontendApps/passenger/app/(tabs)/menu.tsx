import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, Spinner, EmptyState, Button } from '@eta/ui-components';
import { api } from '@eta/api-client';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Utensils, UtensilsCrossed, Minus, Plus } from 'lucide-react-native';
import { useJourneyStore } from '../../stores/journey.store';
import { useCartStore } from '../../stores/cart.store';
import type { CartItem } from '../../stores/cart.store';

export default function MenuTabScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const activeJourney = useJourneyStore((s) => s.activeJourney);
  const touchJourney = useJourneyStore((s) => s.touchJourney);
  const invalidateIfExpired = useJourneyStore((s) => s.invalidateIfExpired);
  const clearCart = useCartStore((s) => s.clearCart);

  // Check expiry every time the menu tab comes into focus
  useFocusEffect(
    useCallback(() => {
      const expired = invalidateIfExpired();
      if (expired) clearCart();
    }, [invalidateIfExpired, clearCart]),
  );

  const bus = activeJourney?.bus ?? null;
  const restaurant = activeJourney?.restaurant ?? null;
  const restaurantId = restaurant ? String(restaurant.id) : null;
  const { items: cartItems, setLocalCart } = useCartStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () =>
      api.get(`/restaurants/menu-items/?restaurant=${restaurantId}&page_size=100`).then((r: any) => r.data),
    enabled: !!restaurantId,
  });

  const allItems = useMemo(() => data?.results ?? [], [data]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  function handleAdd(item: any) {
    if (!bus || !restaurant) return;
    const existing = cartItems.find((ci) => ci.menu_item === item.id);
    const next: CartItem[] = existing
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
            menu_item: item.id,
            menu_item_name: item.name,
            quantity: 1,
            unit_price: Number(item.price).toFixed(2),
            line_total: Number(item.price).toFixed(2),
          },
        ];
    setLocalCart(bus.id, restaurant.id, next);
    touchJourney();
  }

  function handleIncrement(menuItemId: number) {
    if (!bus || !restaurant) return;
    const current = cartItems.find((i) => i.menu_item === menuItemId);
    if (!current) return;
    const qty = current.quantity + 1;
    const next = cartItems.map((i) =>
      i.menu_item === menuItemId
        ? {
            ...i,
            quantity: qty,
            line_total: (Number(i.unit_price) * qty).toFixed(2),
          }
        : i,
    );
    setLocalCart(bus.id, restaurant.id, next);
    touchJourney();
  }

  function handleDecrement(menuItemId: number, quantity: number) {
    if (!bus || !restaurant) return;
    if (quantity <= 1) {
      const next = cartItems.filter((i) => i.menu_item !== menuItemId);
      setLocalCart(bus.id, restaurant.id, next);
    } else {
      const qty = quantity - 1;
      const next = cartItems.map((i) =>
        i.menu_item === menuItemId
          ? {
              ...i,
              quantity: qty,
              line_total: (Number(i.unit_price) * qty).toFixed(2),
            }
          : i,
      );
      setLocalCart(bus.id, restaurant.id, next);
    }
    touchJourney();
  }

  const totalCartItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartPrice = cartItems.reduce((sum, i) => sum + parseFloat(i.line_total || '0'), 0);

  if (!activeJourney) {
    return (
      <View style={[styles.container, { backgroundColor: t.colors.bg, paddingTop: insets.top + 16 }]}>
        <Text style={{ ...t.typography.label, color: t.colors.textMuted, marginBottom: 8, paddingHorizontal: 20 }}>
          BROWSE
        </Text>
        <Text style={{ ...t.typography.h1, color: t.colors.textPrimary, marginBottom: 24, paddingHorizontal: 20 }}>
          Menu
        </Text>
        <View style={{ paddingHorizontal: 20 }}>
          <EmptyState
            icon={<UtensilsCrossed size={24} color={t.colors.textMuted} />}
            title="No restaurant linked"
            description="Scan your bus QR first to see the menu for the assigned highway kitchen."
            tone="neutral"
            action={{ label: 'Scan bus QR', onPress: () => router.push('/(tabs)/scan') }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }} numberOfLines={1}>
            {restaurant?.name || 'Menu'}
          </Text>
          {restaurant?.address ? (
            <Text style={{ ...t.typography.caption, color: t.colors.textMuted }} numberOfLines={1}>
              {restaurant.address}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Bus band */}
      {bus ? (
        <View style={[styles.busBand, { backgroundColor: t.colors.accentPowderBlue }]}>
          <MapPin size={14} color={t.colors.accentPowderBlueInk} />
          <Text style={{ ...t.typography.bodySm, color: t.colors.accentPowderBlueInk }}>
            Assigned to your bus · <Text style={{ fontWeight: '700' }}>{bus.name}</Text>
          </Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: totalCartItems > 0 ? 160 : 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading && (
          <View style={styles.center}><Spinner /></View>
        )}

        {!isLoading && allItems.length === 0 && (
          <EmptyState
            icon={<Utensils size={24} color={t.colors.textMuted} />}
            title="No menu items"
            description="This restaurant hasn't added menu items yet."
            tone="neutral"
          />
        )}

        {allItems.map((item: any) => {
          const cartItem = cartItems.find((ci) => ci.menu_item === item.id);
          const outOfStock =
            item.quantity_available !== null &&
            item.quantity_available !== undefined &&
            item.quantity_available === 0;
          const unavailable = !item.is_available || outOfStock;

          return (
            <View
              key={item.id}
              style={[styles.menuItem, { borderBottomColor: t.colors.borderSubtle, opacity: unavailable ? 0.45 : 1 }]}
            >
              <View style={[styles.emojiTile, { backgroundColor: t.colors.accentSoftCream, borderColor: t.colors.borderSubtle }]}>
                <Text style={{ fontSize: 28 }}>🍛</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600' }} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, marginTop: 4 }} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                {item.quantity_available !== null &&
                 item.quantity_available !== undefined &&
                 item.quantity_available > 0 &&
                 item.quantity_available <= 5 && (
                  <View style={[styles.lowStockBadge, { backgroundColor: t.colors.warningBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: t.colors.warningFg }}>
                      Only {item.quantity_available} left
                    </Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>₹{item.price}</Text>
                  {item.prep_time_minutes ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color={t.colors.textMuted} />
                      <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>{item.prep_time_minutes} min</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {!unavailable && (
                <View style={styles.actionCol}>
                  {cartItem ? (
                    <View style={[styles.stepper, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
                      <Pressable onPress={() => handleDecrement(cartItem.menu_item, cartItem.quantity)} style={styles.stepperBtn} hitSlop={8}>
                        <Minus size={16} color={t.colors.textPrimary} />
                      </Pressable>
                      <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600', minWidth: 24, textAlign: 'center' }}>
                        {cartItem.quantity}
                      </Text>
                      <Pressable onPress={() => handleIncrement(cartItem.menu_item)} style={styles.stepperBtn} hitSlop={8}>
                        <Plus size={16} color={t.colors.textPrimary} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => handleAdd(item)} style={[styles.addBtn, { backgroundColor: t.colors.primary }]}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: t.colors.textOnDark, letterSpacing: 0.3 }}>Add</Text>
                    </Pressable>
                  )}
                </View>
              )}
              {unavailable && (
                <View style={[styles.unavailBadge, { backgroundColor: t.colors.surface2, borderColor: t.colors.border }]}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: t.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Unavailable
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Floating cart bar */}
      {totalCartItems > 0 && (
        <View style={[styles.cartBar, { paddingBottom: insets.bottom + 70 }]}>
          <Pressable onPress={() => router.push('/cart')} style={[styles.cartBarInner, { backgroundColor: t.colors.primary }]}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.colors.textOnDark }}>
              {totalCartItems} item{totalCartItems > 1 ? 's' : ''} · ready to review
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.colors.textOnDark }}>
              View cart · ₹{totalCartPrice.toFixed(0)}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  busBand: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  center: { alignItems: 'center', paddingVertical: 56 },
  menuItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 16, borderBottomWidth: 1,
  },
  emojiTile: {
    width: 64, height: 64, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  actionCol: { alignSelf: 'center' },
  addBtn: {
    height: 40, paddingHorizontal: 20, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 4,
  },
  stepperBtn: { padding: 8 },
  unavailBadge: {
    alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 8,
  },
  cartBarInner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16,
  },
  lowStockBadge: {},
});
