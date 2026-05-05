import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, Button, Input, IconButton } from '@eta/ui-components';
import { api, promoEndpoints } from '@eta/api-client';
import { useAuthStore } from '@eta/auth';
import { router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Bus,
  Receipt,
  ShieldCheck,
  Tag,
  Check,
  X,
} from 'lucide-react-native';
import { useJourneyStore } from '../stores/journey.store';
import { useCartStore } from '../stores/cart.store';
import RazorpayCheckout, { type RazorpayOptions, type RazorpaySuccess } from '../components/RazorpayCheckout';

const SHAKE_DUR = 50;

export default function CheckoutScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const { cartId, busId, restaurantId, clearCart } = useCartStore();
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.line_total), 0);
  const { activeJourney } = useJourneyStore();
  const bus = activeJourney?.bus ?? null;
  const restaurant = activeJourney?.restaurant ?? null;
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [rpOptions, setRpOptions] = useState<RazorpayOptions | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const [promoDraft, setPromoDraft] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);
  const [payableTotal, setPayableTotal] = useState<number | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);
  const [inputFlashError, setInputFlashError] = useState(false);

  const lockedSubtotalRef = useRef<number | null>(null);
  const displayTotal = payableTotal != null ? payableTotal : subtotal;
  const restaurantIdForApi = restaurantId ?? restaurant?.id ?? null;

  const shakeX = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const discountH = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const totalOpacity = useRef(new Animated.Value(1)).current;
  const totalShownRef = useRef(displayTotal.toFixed(2));
  const [totalShown, setTotalShown] = useState(() => displayTotal.toFixed(2));

  function clearPromo() {
    lockedSubtotalRef.current = null;
    setAppliedCode(null);
    setAppliedMessage(null);
    setPayableTotal(null);
    setPromoDiscount(null);
    setPromoDraft('');
    checkScale.setValue(0);
    Animated.timing(discountH, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }

  useEffect(() => {
    if (appliedCode == null) return;
    const locked = lockedSubtotalRef.current;
    if (locked == null) return;
    if (Math.abs(subtotal - locked) > 0.005) {
      clearPromo();
    }
  }, [subtotal, appliedCode]);

  useEffect(() => {
    const next = displayTotal.toFixed(2);
    if (next === totalShownRef.current) return;
    Animated.timing(totalOpacity, {
      toValue: 0,
      duration: 150,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      totalShownRef.current = next;
      setTotalShown(next);
      Animated.timing(totalOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [displayTotal]);

  useEffect(() => {
    if (appliedCode) {
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 200,
        }),
        Animated.timing(discountH, {
          toValue: 44,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      checkScale.setValue(0);
      Animated.timing(discountH, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [appliedCode]);

  function runShake() {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -8, duration: SHAKE_DUR, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: SHAKE_DUR, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -6, duration: SHAKE_DUR, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6, duration: SHAKE_DUR, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -4, duration: SHAKE_DUR, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 4, duration: SHAKE_DUR, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: SHAKE_DUR, useNativeDriver: true }),
    ]).start();
  }

  function flashSuccessBg() {
    flashOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function applyPromo() {
    const code = promoDraft.trim();
    if (!code) {
      Alert.alert('Promo code', 'Enter a promo code first.');
      return;
    }
    setValidateLoading(true);
    try {
      const { data } = await promoEndpoints.validate({
        code,
        cart_total: subtotal.toFixed(2),
        restaurant_id: restaurantIdForApi,
      });
      if (!data.valid) {
        runShake();
        setInputFlashError(true);
        setTimeout(() => setInputFlashError(false), 600);
        Alert.alert('Promo code', data.message);
        return;
      }
      const discount = parseFloat(data.discount_amount);
      const finalNum = parseFloat(data.final_total);
      lockedSubtotalRef.current = subtotal;
      setAppliedCode(code.toUpperCase());
      setAppliedMessage(data.message);
      setPromoDiscount(discount);
      setPayableTotal(finalNum);
      flashSuccessBg();
    } catch {
      Alert.alert('Error', 'Could not validate promo. Try again.');
    } finally {
      setValidateLoading(false);
    }
  }

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
        promo_code: appliedCode ?? '',
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
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: t.colors.border }]}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.push('/cart'))} hitSlop={12}>
          <ArrowLeft size={20} color={t.colors.textPrimary} />
        </Pressable>
        <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>Review & pay</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 }]}>
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
          <View style={[styles.summaryBlock, { borderTopColor: t.colors.borderSubtle }]}>
            <View style={styles.lineItem}>
              <Text style={{ ...t.typography.bodySm, color: t.colors.textSecondary }}>Subtotal</Text>
              <Text style={{ ...t.typography.bodySm, color: t.colors.textPrimary, fontWeight: '500' }}>
                ₹{subtotal.toFixed(2)}
              </Text>
            </View>

            <Animated.View
              style={{
                height: discountH,
                overflow: 'hidden',
              }}
            >
              <View style={{ paddingTop: 8 }}>
                {appliedCode ? (
                  <Text style={{ ...t.typography.bodySm, color: t.colors.successFg, fontWeight: '600' }}>
                    Promo ({appliedCode}) −₹{(promoDiscount ?? 0).toFixed(2)}
                  </Text>
                ) : null}
              </View>
            </Animated.View>

            <View style={[styles.totalDivider, { borderTopColor: t.colors.borderSubtle }]}>
              <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>Total</Text>
              <Animated.View style={{ opacity: totalOpacity }}>
                <Text style={{ ...t.typography.h2, color: t.colors.textPrimary }}>₹{totalShown}</Text>
              </Animated.View>
            </View>
          </View>
        </Card>

        <View style={[styles.promoOuter, { borderRadius: t.radius.card }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(34, 197, 94, 0.14)',
                borderRadius: t.radius.card,
                opacity: flashOpacity,
              },
            ]}
          />
          <Card tone="default" padding="md" radius="card" border style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Tag size={16} strokeWidth={1.8} color={t.colors.textMuted} />
              <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>PROMO CODE</Text>
            </View>

            {!appliedCode ? (
              <Animated.View style={[styles.promoRow, { transform: [{ translateX: shakeX }] }]}>
                <View
                  style={[
                    { flex: 1, minWidth: 0, borderRadius: t.radius.sm },
                    inputFlashError && { borderWidth: 2, borderColor: t.colors.errorBorder },
                  ]}
                >
                  <Input
                    placeholder="Enter promo code…"
                    value={promoDraft}
                    onChangeText={(x) => setPromoDraft(x.toUpperCase())}
                    returnKeyType="done"
                    onSubmitEditing={applyPromo}
                  />
                </View>
                <Button
                  label="Apply"
                  variant="secondary"
                  size="md"
                  loading={validateLoading}
                  onPress={applyPromo}
                  style={styles.applyBtn}
                />
              </Animated.View>
            ) : (
              <View style={styles.appliedRow}>
                <Animated.View
                  style={[
                    styles.checkCircle,
                    { backgroundColor: t.colors.successBg },
                    { transform: [{ scale: checkScale }] },
                  ]}
                >
                  <Check size={18} color={t.colors.successFg} strokeWidth={2.2} />
                </Animated.View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ ...t.typography.bodySm, color: t.colors.textPrimary }}>
                    <Text style={{ fontWeight: '700' }}>{appliedCode}</Text> applied — save ₹
                    {(promoDiscount ?? 0).toFixed(0)}!
                  </Text>
                  {appliedMessage ? (
                    <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 4 }}>
                      {appliedMessage}
                    </Text>
                  ) : null}
                </View>
                <IconButton
                  accessibilityLabel="Remove promo code"
                  tone="ghost"
                  size="sm"
                  onPress={clearPromo}
                >
                  <X size={18} color={t.colors.textSecondary} />
                </IconButton>
              </View>
            )}
          </Card>
        </View>

        <View style={styles.trustRow}>
          <ShieldCheck size={14} strokeWidth={1.9} color={t.colors.textMuted} style={{ marginTop: 2 }} />
          <Text style={{ ...t.typography.caption, color: t.colors.textMuted, flex: 1 }}>
            Payments are encrypted and processed by Razorpay. Your card details never touch our servers.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.floatingCta, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={`Pay ₹${displayTotal.toFixed(0)} securely`}
          onPress={handlePay}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  divider: { borderTopWidth: 1, marginVertical: 16 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  summaryBlock: { borderTopWidth: 1, marginTop: 16, paddingTop: 12, gap: 4 },
  totalDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 16,
  },
  promoOuter: { overflow: 'hidden', position: 'relative' },
  promoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  applyBtn: { marginTop: 2 },
  appliedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  trustRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, marginTop: 16 },
  floatingCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
