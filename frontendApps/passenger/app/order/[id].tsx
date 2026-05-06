import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Spinner } from '@eta/ui-components';
import { api } from '@eta/api-client';
import { getEnv } from '@eta/utils';
import { useUserSocket } from '@eta/realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tokenStore } from '@eta/auth';
import {
  ArrowLeft, Share2, Clock, ChefHat, ShoppingBag,
  Bike, XCircle, MapPin, Bus, CreditCard, Receipt, CheckCircle2,
} from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'CANCELLED';
type PaymentStatus = 'UNPAID' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED';

interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

interface Order {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: string;
  restaurant_name: string;
  bus_name: string;
  cancelled_reason: string;
  razorpay_payment_id: string;
  confirmed_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  created_at: string;
  items: OrderItem[];
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS: { status: OrderStatus; label: string; sublabel: string; Icon: React.ComponentType<any> }[] = [
  { status: 'PENDING',   label: 'Order placed',       sublabel: 'Waiting for restaurant to confirm', Icon: Clock },
  { status: 'CONFIRMED', label: 'Confirmed',           sublabel: 'Restaurant accepted your order',    Icon: CheckCircle2 },
  { status: 'PREPARING', label: 'Kitchen is cooking',  sublabel: 'Your food is being prepared',       Icon: ChefHat },
  { status: 'READY',     label: 'Ready for pickup',    sublabel: 'Walk to the counter and collect',   Icon: ShoppingBag },
  { status: 'PICKED_UP', label: 'Picked up \u{1F389}', sublabel: 'Enjoy your meal!',                  Icon: Bike },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  PENDING: 0, CONFIRMED: 1, PREPARING: 2, READY: 3, PICKED_UP: 4, CANCELLED: -1,
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  UNPAID: 'Unpaid', AUTHORIZED: 'Authorized', CAPTURED: 'Paid',
  REFUNDED: 'Refunded', FAILED: 'Failed',
};

// ─── StepRow ──────────────────────────────────────────────────────────────────

function StepRow({
  step, stepState, isLast,
}: {
  step: (typeof STEPS)[number];
  stepState: 'done' | 'active' | 'upcoming';
  isLast: boolean;
}) {
  const t = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (stepState !== 'active') { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [stepState, pulseAnim]);

  const { Icon } = step;

  const iconBg =
    stepState === 'done'   ? t.colors.successBg :
    stepState === 'active' ? t.colors.primary   : t.colors.surfaceSunk;

  const iconColor =
    stepState === 'done'   ? t.colors.successFg    :
    stepState === 'active' ? t.colors.textOnDark   : t.colors.textDisabled;

  const connectorColor = stepState === 'done' ? t.colors.successBorder : t.colors.borderSubtle;

  return (
    <View style={stepStyles.row}>
      {/* Left column: icon + connector */}
      <View style={stepStyles.left}>
        <Animated.View
          style={[
            stepStyles.iconWrap,
            { backgroundColor: iconBg },
            stepState === 'active' && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Icon
            size={17}
            strokeWidth={stepState === 'active' ? 2.2 : 1.8}
            color={iconColor}
          />
        </Animated.View>
        {!isLast && (
          <View style={[stepStyles.connector, { backgroundColor: connectorColor }]} />
        )}
      </View>

      {/* Right column: text */}
      <View style={[stepStyles.textWrap, { paddingBottom: isLast ? 4 : 28 }]}>
        <Text
          style={{
            fontFamily: stepState === 'active' ? 'Lora_700Bold' : 'Lora_500Medium',
            fontSize: 15,
            fontWeight: stepState === 'active' ? '700' : '500',
            color: stepState === 'upcoming' ? t.colors.textDisabled : t.colors.textPrimary,
            marginTop: 10,
          }}
        >
          {step.label}
        </Text>
        {stepState !== 'upcoming' && (
          <Text style={{ ...t.typography.caption, color: t.colors.textTertiary, marginTop: 3 }}>
            {step.sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 14 },
  left:      { alignItems: 'center', width: 44 },
  iconWrap:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  connector: { width: 2, flex: 1, minHeight: 12, borderRadius: 1, marginTop: 3 },
  textWrap:  { flex: 1 },
});

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function ProgressBar({ status }: { status: OrderStatus }) {
  const t = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const idx = Math.max(0, STATUS_INDEX[status] ?? 0);
  const pct = idx / (STEPS.length - 1);

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 700, useNativeDriver: false }).start();
  }, [pct, anim]);

  if (status === 'CANCELLED') return null;

  const fillColor = status === 'PICKED_UP' ? t.colors.successFg : t.colors.primary;

  return (
    <View style={[pbStyles.track, { backgroundColor: t.colors.borderSubtle }]}>
      <Animated.View
        style={[
          pbStyles.fill,
          {
            backgroundColor: fillColor,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const pbStyles = StyleSheet.create({
  track: { height: 5, borderRadius: 999, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 999 },
});

// ─── SectionCard ─────────────────────────────────────────────────────────────

function SectionCard({
  icon, label, children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={[cardStyles.wrap, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
      <View style={cardStyles.header}>
        {icon}
        <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrap:   { borderRadius: 18, borderWidth: 1, padding: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OrderTrackingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Load access token from secure storage (tokenStore.get() is async)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  useEffect(() => {
    tokenStore.get().then((t) => setAccessToken(t?.access ?? null));
  }, []);

  // ── Data ───────────────────────────────────────────────────────────────────

  // undefined = still loading → treat as active so polling + WS start immediately
  const isTerminal = (s: OrderStatus | undefined): boolean =>
    s === 'PICKED_UP' || s === 'CANCELLED';

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/my/${id}/`).then((r: any) => r.data),
    enabled: !!id,
    // Poll every 8 s as a WebSocket fallback while order is active.
    // When status is undefined (loading) we still poll so we get data fast.
    refetchInterval: (q) => (isTerminal(q.state.data?.status) ? false : 8_000),
  });

  // ── WebSocket connection state (for live indicator) ───────────────────────

  const env = getEnv();

  const onWsMessage = useCallback(
    (payload: unknown) => {
      // Backend sends: { title, body, data: { order_id, event, status } }
      const msg = payload as {
        data?: { order_id?: string; event?: string; status?: string };
      };
      const orderId = msg?.data?.order_id;
      if (!orderId || orderId !== id) return;

      // Immediately update the cached order status optimistically so the UI
      // reacts before the refetch completes — gives instant visual feedback.
      queryClient.setQueryData<Order>(['order', id], (prev) => {
        if (!prev || !msg.data?.status) return prev;
        return {
          ...prev,
          status: msg.data.status as OrderStatus,
        };
      });

      // Then fetch the full updated order (timestamps, etc.)
      queryClient.invalidateQueries({ queryKey: ['order', id] });

      // Keep home + orders list in sync
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'home'] });
    },
    [id, queryClient],
  );

  // Connect as soon as we have a token — don't wait for order to load.
  // The socket stays open until the order reaches a terminal state.
  const { connectionState } = useUserSocket({
    accessToken: accessToken ?? null,
    wsBaseUrl: env.wsBaseUrl,
    onMessage: onWsMessage,
    enabled: !!accessToken && !isTerminal(order?.status),
  });

  // ── Share ──────────────────────────────────────────────────────────────────

  async function handleShare() {
    if (!order) return;
    try {
      await Share.share({
        message: `ETA Eats order #${String(order.id).slice(0, 8).toUpperCase()} · ${order.restaurant_name} · ${order.status}`,
      });
    } catch {}
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const currentIdx   = STATUS_INDEX[order?.status ?? 'PENDING'] ?? 0;
  const isCancelled  = order?.status === 'CANCELLED';
  const isPickedUp   = order?.status === 'PICKED_UP';

  const etaMinutes = (() => {
    if (order?.status !== 'PREPARING' || !order.confirmed_at) return null;
    const elapsed = (Date.now() - new Date(order.confirmed_at).getTime()) / 60_000;
    return Math.max(0, Math.round(15 - elapsed));
  })();

  const shortId = order ? `#${String(order.id).slice(0, 8).toUpperCase()}` : '';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[s.root, { backgroundColor: t.colors.bg }]}>

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
          hitSlop={12}
          style={s.headerBtn}
        >
          <ArrowLeft size={20} strokeWidth={2} color={t.colors.textPrimary} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>Track order</Text>
          {order && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>
                {shortId} · {order.restaurant_name}
              </Text>
              {/* Live sync indicator — only shown while order is active */}
              {!isTerminal(order.status) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        connectionState === 'connected' ? t.colors.successFg : t.colors.textDisabled,
                    }}
                  />
                  <Text style={{ ...t.typography.caption, color: t.colors.textMuted, fontSize: 10 }}>
                    {connectionState === 'connected' ? 'Live' : 'Syncing…'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <Pressable onPress={handleShare} hitSlop={12} style={s.headerBtn}>
          <Share2 size={18} strokeWidth={1.8} color={t.colors.textTertiary} />
        </Pressable>
      </View>

      {/* ── Loading ── */}
      {isLoading && (
        <View style={s.loadingWrap}>
          <Spinner />
          <Text style={{ ...t.typography.bodySm, color: t.colors.textMuted, marginTop: 12 }}>
            Loading order…
          </Text>
        </View>
      )}

      {/* ── Content ── */}
      {!isLoading && order && (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* Progress bar */}
          <ProgressBar status={order.status} />

          {/* ── Hero status banner ── */}
          {!isCancelled && (
            <View
              style={[
                s.heroBanner,
                {
                  backgroundColor: isPickedUp ? t.colors.successBg : t.colors.accentPowderBlue,
                  borderColor:     isPickedUp ? t.colors.successBorder : t.colors.accentPowderBlue,
                },
              ]}
            >
              <View style={s.heroBannerLeft}>
                <Text
                  style={{
                    fontFamily: 'Lora_700Bold',
                    fontSize: 18,
                    fontWeight: '700',
                    color: isPickedUp ? t.colors.successFg : t.colors.accentPowderBlueInk,
                  }}
                >
                  {STEPS[currentIdx]?.label ?? order.status}
                </Text>
                <Text
                  style={{
                    ...t.typography.bodySm,
                    color: isPickedUp ? t.colors.successFg : t.colors.accentPowderBlueInk,
                    marginTop: 3,
                    opacity: 0.85,
                  }}
                >
                  {STEPS[currentIdx]?.sublabel}
                </Text>
              </View>
              {/* ETA pill inside banner */}
              {etaMinutes !== null && (
                <View style={[s.etaPill, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
                  <Clock size={12} color={t.colors.accentPowderBlueInk} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: t.colors.accentPowderBlueInk,
                    }}
                  >
                    {etaMinutes > 0 ? `~${etaMinutes} min` : 'Almost ready'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Cancelled banner ── */}
          {isCancelled && (
            <View style={[s.cancelBanner, { backgroundColor: t.colors.errorBg, borderColor: t.colors.errorBorder }]}>
              <XCircle size={20} strokeWidth={1.8} color={t.colors.errorFg} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.typography.body, color: t.colors.errorFg, fontWeight: '600' }}>
                  Order cancelled
                </Text>
                {!!order.cancelled_reason && (
                  <Text style={{ ...t.typography.bodySm, color: t.colors.errorFg, marginTop: 3, opacity: 0.8 }}>
                    {order.cancelled_reason}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* ── Status stepper ── */}
          {!isCancelled && (
            <SectionCard
              icon={<Receipt size={14} strokeWidth={1.8} color={t.colors.textMuted} />}
              label="ORDER STATUS"
            >
              <View style={{ gap: 0 }}>
                {STEPS.map((step, idx) => {
                  const si = STATUS_INDEX[step.status];
                  const stepState =
                    si < currentIdx ? 'done' :
                    si === currentIdx ? 'active' : 'upcoming';
                  return (
                    <StepRow
                      key={step.status}
                      step={step}
                      stepState={stepState}
                      isLast={idx === STEPS.length - 1}
                    />
                  );
                })}
              </View>
            </SectionCard>
          )}

          {/* ── Pickup info ── */}
          <SectionCard
            icon={<MapPin size={14} strokeWidth={1.8} color={t.colors.textMuted} />}
            label="PICKUP FROM"
          >
            <View style={s.infoRow}>
              <View style={[s.infoIcon, { backgroundColor: t.colors.accentPowderBlue }]}>
                <MapPin size={15} strokeWidth={1.8} color={t.colors.accentPowderBlueInk} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600' }} numberOfLines={1}>
                  {order.restaurant_name}
                </Text>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 2 }}>
                  Highway kitchen
                </Text>
              </View>
            </View>
            <View style={[s.infoRow, { marginTop: 12 }]}>
              <View style={[s.infoIcon, { backgroundColor: t.colors.accentSoftCream }]}>
                <Bus size={15} strokeWidth={1.8} color={t.colors.accentSoftCreamInk} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600' }} numberOfLines={1}>
                  {order.bus_name}
                </Text>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 2 }}>
                  Your bus
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* ── Order items ── */}
          <SectionCard
            icon={<ShoppingBag size={14} strokeWidth={1.8} color={t.colors.textMuted} />}
            label="YOUR ORDER"
          >
            {order.items.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  s.lineItem,
                  idx < order.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: t.colors.borderSubtle,
                    paddingBottom: 12,
                    marginBottom: 12,
                  },
                ]}
              >
                <View style={[s.itemDot, { backgroundColor: t.colors.accentSoftCream }]}>
                  <Text style={{ fontSize: 16 }}>🍛</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600' }}
                    numberOfLines={1}
                  >
                    {item.menu_item_name}
                  </Text>
                  <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 2 }}>
                    ₹{item.unit_price} × {item.quantity}
                  </Text>
                </View>
                <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '700' }}>
                  ₹{item.line_total}
                </Text>
              </View>
            ))}

            {/* Total row */}
            <View style={[s.totalRow, { borderTopColor: t.colors.border }]}>
              <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>Total</Text>
                <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 22, fontWeight: '700', color: t.colors.textPrimary }}>
                  ₹{order.total_amount}
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* ── Payment ── */}
          <SectionCard
            icon={<CreditCard size={14} strokeWidth={1.8} color={t.colors.textMuted} />}
            label="PAYMENT"
          >
            {/* Amount + status side by side */}
            <View style={s.payRow}>
              <View>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>Amount paid</Text>
                <Text style={{ fontFamily: 'Lora_600SemiBold', fontSize: 17, fontWeight: '600', color: t.colors.textPrimary, marginTop: 2 }}>
                  ₹{order.total_amount}
                </Text>
              </View>
              <View
                style={[
                  s.payBadge,
                  {
                    backgroundColor: order.payment_status === 'CAPTURED' ? t.colors.successBg : t.colors.surface2,
                    borderColor:     order.payment_status === 'CAPTURED' ? t.colors.successBorder : t.colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: order.payment_status === 'CAPTURED' ? t.colors.successFg : t.colors.textTertiary,
                  }}
                >
                  {PAYMENT_LABEL[order.payment_status] ?? order.payment_status}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={[s.payDivider, { backgroundColor: t.colors.borderSubtle }]} />

            {/* Meta rows */}
            {!!order.razorpay_payment_id && (
              <View style={s.metaRow}>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>Payment ID</Text>
                <Text style={{ ...t.typography.caption, color: t.colors.textTertiary, maxWidth: 180 }} numberOfLines={1}>
                  {order.razorpay_payment_id}
                </Text>
              </View>
            )}
            <View style={s.metaRow}>
              <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>Ordered</Text>
              <Text style={{ ...t.typography.caption, color: t.colors.textTertiary }}>
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            {order.confirmed_at && (
              <View style={s.metaRow}>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>Confirmed</Text>
                <Text style={{ ...t.typography.caption, color: t.colors.textTertiary }}>
                  {new Date(order.confirmed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
            {order.ready_at && (
              <View style={s.metaRow}>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>Ready at</Text>
                <Text style={{ ...t.typography.caption, color: t.colors.textTertiary }}>
                  {new Date(order.ready_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
            {order.picked_up_at && (
              <View style={s.metaRow}>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>Picked up</Text>
                <Text style={{ ...t.typography.caption, color: t.colors.successFg, fontWeight: '600' }}>
                  {new Date(order.picked_up_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </SectionCard>

          {/* ── Reorder CTA (cancelled only) ── */}
          {isCancelled && (
            <Pressable
              onPress={() => router.replace('/(tabs)/menu')}
              style={[s.reorderBtn, { backgroundColor: t.colors.primary }]}
            >
              <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 15, fontWeight: '700', color: t.colors.textOnDark }}>
                Reorder from menu
              </Text>
            </Pressable>
          )}

        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  // Hero banner
  heroBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroBannerLeft: { flex: 1 },
  etaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },

  // Cancelled
  cancelBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 16,
  },

  // Pickup info
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  // Order items
  lineItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemDot:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderTopWidth: 1, marginTop: 16, paddingTop: 14,
  },

  // Payment
  payRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payBadge:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  payDivider:{ height: 1, marginVertical: 14 },
  metaRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },

  // Reorder
  reorderBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
});
