import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, Button } from '@eta/ui-components';
import { api } from '@eta/api-client';
import { useAuthStore } from '@eta/auth';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Bus, Receipt, ShieldCheck } from 'lucide-react-native';
import { useJourneyStore } from '../stores/journey.store';
import { useCartStore } from '../stores/cart.store';
import RazorpayCheckout, { type RazorpayOptions, type RazorpaySuccess } from '../components/RazorpayCheckout';

export default function CheckoutScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { cartId, busId, items, clearCart } = useCartStore();
  const subtotal = useCartStore.getState().totalPrice();
  const { activeJourney } = useJourneyStore();
  const bus = activeJourney?.bus ?? null;
  const restaurant = activeJourney?.restaurant ?? null;
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [rpOptions, setRpOptions] = useState<RazorpayOptions | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  async function handlePay() {
    const effectiveCartId = cartId;
    const effectiveBusId = busId ?? bus?.id ?? null;

    if (!effectiveCartId || !effectiveBusId) {
      Alert.alert('Error', 'Cart session expired. Please go back and try again.');
      return;
    }

    setLoading(true);
    try {
      const { data: order } = await api.post('/orders/checkout/', {
        cart_id: effectiveCartId,
        bus_id: effectiveBusId,
      });

      setPendingOrderId(order.id);

      const { data: rpOrder } = await api.post('/payments/razorpay/order/', {
        order_id: order.id,
      });

      setRpOptions({
        key_id: rpOrder.key_id,
        razorpay_order_id: rpOrder.razorpay_order_id,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: 'ETA Eats',
        description: `Order from ${restaurant?.name || 'restaurant'}`,
        prefill: {
          contact: user?.phone_number || '',
          email: user?.email || '',
        },
      });
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message ?? 'Could not create order. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSuccess(data: RazorpaySuccess) {
    setRpOptions(null);
    setLoading(true);
    try {
      await api.post('/payments/razorpay/confirm/', {
        order_id: pendingOrderId,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      });

      clearCart();
      Alert.alert(
        'Payment successful!',
        `Your order has been confirmed. Track it from your home screen.`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message ?? 'Payment verification failed. Contact support if charged.';
      Alert.alert('Verification Error', msg);
    } finally {
      setLoading(false);
      setPendingOrderId(null);
    }
  }

  function handlePaymentDismiss(reason: string) {
    setRpOptions(null);
    if (reason !== 'User cancelled') {
      Alert.alert('Payment not completed', reason);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: t.colors.border }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/cart')} hitSlop={12}>
          <ArrowLeft size={20} color={t.colors.textPrimary} />
        </Pressable>
        <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>Review & pay</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 }]}>
        {/* Pickup info */}
        <Card tone="powder" padding="md" radius="card">
          <Text style={{ ...t.typography.label, color: t.colors.accentPowderBlueInk }}>PICKUP FROM</Text>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <View style={[styles.infoIcon, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
              <MapPin size={16} strokeWidth={1.8} color={t.colors.accentPowderBlueInk} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }} numberOfLines={1}>
                {restaurant?.name}
              </Text>
              <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, marginTop: 2 }} numberOfLines={2}>
                {restaurant?.address}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { borderTopColor: 'rgba(255,255,255,0.4)' }]} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
              <Bus size={16} strokeWidth={1.8} color={t.colors.accentPowderBlueInk} />
            </View>
            <View>
              <Text style={{ ...t.typography.label, color: t.colors.accentPowderBlueInk }}>YOUR BUS</Text>
              <Text style={{ ...t.typography.body, color: t.colors.textPrimary, marginTop: 2 }}>
                <Text style={{ fontWeight: '600' }}>{bus?.name}</Text> · {bus?.numberPlate}
              </Text>
            </View>
          </View>
        </Card>

        {/* Order items */}
        <Card tone="default" padding="md" radius="card" style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Receipt size={16} strokeWidth={1.8} color={t.colors.textMuted} />
            <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>YOUR ORDER</Text>
          </View>
          <View style={{ marginTop: 16 }}>
            {items.map((item) => (
              <View key={item.id} style={[styles.lineItem, { marginBottom: 10 }]}>
                <Text style={{ ...t.typography.bodySm, color: t.colors.textSecondary, flex: 1 }} numberOfLines={1}>
                  {item.menu_item_name} <Text style={{ color: t.colors.textMuted }}>x {item.quantity}</Text>
                </Text>
                <Text style={{ ...t.typography.bodySm, color: t.colors.textPrimary, fontWeight: '500' }}>
                  ₹{item.line_total}
                </Text>
              </View>
            ))}
          </View>
          <View style={[styles.totalDivider, { borderTopColor: t.colors.borderSubtle }]}>
            <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>Total</Text>
            <Text style={{ ...t.typography.h2, color: t.colors.textPrimary }}>₹{subtotal.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Trust row */}
        <View style={styles.trustRow}>
          <ShieldCheck size={14} strokeWidth={1.9} color={t.colors.textMuted} style={{ marginTop: 2 }} />
          <Text style={{ ...t.typography.caption, color: t.colors.textMuted, flex: 1 }}>
            Payments are encrypted and processed by Razorpay. Your card details never touch our servers.
          </Text>
        </View>
      </ScrollView>

      {/* Pay CTA */}
      <View style={[styles.floatingCta, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={`Pay ₹${subtotal.toFixed(0)} securely`}
          onPress={handlePay}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>

      {/* Razorpay WebView modal */}
      {rpOptions && (
        <RazorpayCheckout
          visible={!!rpOptions}
          options={rpOptions}
          onSuccess={handlePaymentSuccess}
          onDismiss={handlePaymentDismiss}
        />
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
  content: { paddingHorizontal: 16, paddingTop: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  divider: { borderTopWidth: 1, marginVertical: 16 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalDivider: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderTopWidth: 1, marginTop: 16, paddingTop: 16,
  },
  trustRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, marginTop: 16 },
  floatingCta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 8,
  },
});
