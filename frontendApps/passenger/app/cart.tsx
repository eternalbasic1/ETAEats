import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, EmptyState, Button } from '@eta/ui-components';
import { api } from '@eta/api-client';
import { useAuthStore } from '@eta/auth';
import { router } from 'expo-router';
import { ArrowLeft, ShoppingBag, Trash2, Minus, Plus } from 'lucide-react-native';
import { useCartStore } from '../stores/cart.store';

export default function CartScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { cartId, items, setCart, totalPrice, clearCart } = useCartStore();

  async function handleRemove(cartItemId: number) {
    if (!cartId) return;
    try {
      const { data } = await api.delete(`/orders/cart/items/${cartItemId}/`);
      setCart(cartId, data.bus, data.restaurant, data.items);
    } catch {}
  }

  async function handleUpdate(cartItemId: number, quantity: number) {
    if (!cartId) return;
    try {
      if (quantity <= 0) {
        const { data } = await api.delete(`/orders/cart/items/${cartItemId}/`);
        setCart(cartId, data.bus, data.restaurant, data.items);
      } else {
        const { data } = await api.patch(`/orders/cart/items/${cartItemId}/`, { quantity });
        setCart(cartId, data.bus, data.restaurant, data.items);
      }
    } catch {}
  }

  function handleCheckout() {
    if (!isAuthenticated) return router.push('/(auth)/login');
    router.push('/checkout');
  }

  const subtotal = totalPrice();

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: t.colors.bg, paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/menu')} style={styles.backRow} hitSlop={12}>
          <ArrowLeft size={20} color={t.colors.textPrimary} />
        </Pressable>
        <EmptyState
          icon={<ShoppingBag size={24} strokeWidth={1.7} color={t.colors.textMuted} />}
          tone="cream"
          title="Your cart is empty"
          description="Add something you love from the menu to get started."
          action={{ label: 'Back to menu', onPress: () => router.push('/(tabs)/menu'), variant: 'secondary' }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: t.colors.border }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/menu')} hitSlop={12}>
          <ArrowLeft size={20} color={t.colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>Your cart</Text>
          <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>
            {items.length} item{items.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 }]}>
        <Card tone="default" padding="none" radius="card" style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          {items.map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.cartItem,
                idx < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.colors.borderSubtle },
              ]}
            >
              <View style={[styles.itemEmoji, { backgroundColor: t.colors.accentSoftCream, borderColor: t.colors.borderSubtle }]}>
                <Text style={{ fontSize: 22 }}>🍛</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600' }} numberOfLines={1}>
                  {item.menu_item_name}
                </Text>
                <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, marginTop: 2 }}>
                  ₹{item.unit_price} each
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.stepper, { borderColor: t.colors.border }]}>
                  <Pressable onPress={() => handleUpdate(item.id, item.quantity - 1)} style={styles.stepBtn} hitSlop={8}>
                    <Minus size={14} color={t.colors.textPrimary} />
                  </Pressable>
                  <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600', minWidth: 20, textAlign: 'center' }}>
                    {item.quantity}
                  </Text>
                  <Pressable onPress={() => handleUpdate(item.id, item.quantity + 1)} style={styles.stepBtn} hitSlop={8}>
                    <Plus size={14} color={t.colors.textPrimary} />
                  </Pressable>
                </View>
                <Pressable onPress={() => handleRemove(item.id)} hitSlop={8} style={{ padding: 6 }}>
                  <Trash2 size={16} strokeWidth={1.7} color={t.colors.textMuted} />
                </Pressable>
              </View>
            </View>
          ))}
        </Card>

        {/* Summary */}
        <Card tone="sunk" padding="md" radius="card" style={{ marginTop: 16 }}>
          <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>SUMMARY</Text>
          <View style={[styles.summaryRow, { marginTop: 12 }]}>
            <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>Subtotal</Text>
            <Text style={{ ...t.typography.bodySm, color: t.colors.textPrimary, fontWeight: '500' }}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>Delivery</Text>
            <Text style={{ ...t.typography.bodySm, color: t.colors.textPrimary, fontWeight: '500' }}>Pickup · Free</Text>
          </View>
          <View style={[styles.totalRow, { borderTopColor: t.colors.borderSubtle }]}>
            <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>Total</Text>
            <Text style={{ ...t.typography.h2, color: t.colors.textPrimary }}>₹{subtotal.toFixed(2)}</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Floating CTA */}
      <View style={[styles.floatingCta, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={`Place order · ₹${subtotal.toFixed(0)}`}
          onPress={handleCheckout}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backRow: { paddingHorizontal: 16, marginBottom: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  cartItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  itemEmoji: {
    width: 56, height: 56, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 2,
  },
  stepBtn: { padding: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  floatingCta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 8, backgroundColor: 'transparent',
  },
});
