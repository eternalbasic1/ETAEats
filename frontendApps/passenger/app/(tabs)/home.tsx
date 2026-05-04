import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button, Card, Badge, EmptyState, SectionHeader, Spinner } from '@eta/ui-components';
import { useAuthStore, tokenStore } from '@eta/auth';
import { api } from '@eta/api-client';
import { getEnv } from '@eta/utils';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserSocket } from '@eta/realtime';
import { Package, ArrowRight } from 'lucide-react-native';
import { JourneyCard, getSkyTopColor } from '../../components/JourneyCard';
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  PICKED_UP: 'Picked up',
  CANCELLED: 'Cancelled',
};

const STATUS_TONE: Record<string, 'cream' | 'powder' | 'peach' | 'mint' | 'neutral' | 'error'> = {
  PENDING: 'cream',
  CONFIRMED: 'powder',
  PREPARING: 'powder',
  READY: 'peach',
  PICKED_UP: 'mint',
  CANCELLED: 'error',
};

export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [hasHydrated, isAuthenticated]);

  // ── Load access token for WebSocket ───────────────────────────────────────
  const [accessToken, setAccessToken] = useState<string | null>(null);
  useEffect(() => {
    tokenStore.get().then((tok) => setAccessToken(tok?.access ?? null));
  }, [isAuthenticated]);

  // ── Sky color — kept in sync with JourneyCard's time-of-day ──────────────
  const [skyColor, setSkyColor] = useState(getSkyTopColor());
  useEffect(() => {
    setSkyColor(getSkyTopColor());
    const interval = setInterval(() => setSkyColor(getSkyTopColor()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Orders query ──────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'home'],
    queryFn: () => api.get('/orders/my/?page_size=8').then((r: any) => r.data),
    enabled: isAuthenticated,
    // Refetch every 20 s as a fallback while there's an active order
    refetchInterval: () => {
      const orders = queryClient.getQueryData<{ results: any[] }>(['orders', 'home'])?.results ?? [];
      const hasActive = orders.some((o) => !['PICKED_UP', 'CANCELLED'].includes(o.status));
      return hasActive ? 20_000 : false;
    },
  });

  // ── WebSocket: optimistically patch order status in cache ─────────────────
  const env = getEnv();

  const onWsMessage = useCallback(
    (payload: unknown) => {
      const msg = payload as { data?: { order_id?: string; status?: string } };
      const { order_id, status } = msg?.data ?? {};
      if (!order_id || !status) return;

      // Patch the status badge instantly — no network round-trip needed
      queryClient.setQueryData<{ results: any[] }>(['orders', 'home'], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          results: prev.results.map((o) =>
            o.id === order_id ? { ...o, status } : o,
          ),
        };
      });

      // Also patch the individual order cache if it's loaded
      queryClient.setQueryData<Record<string, unknown>>(['order', order_id], (prev) => {
        if (!prev) return prev;
        return { ...prev, status };
      });

      // Full refetch in background to get timestamps etc.
      queryClient.invalidateQueries({ queryKey: ['orders', 'home'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    [queryClient],
  );

  const hasActiveOrder = (data?.results ?? []).some(
    (o: any) => !['PICKED_UP', 'CANCELLED'].includes(o.status),
  );

  useUserSocket({
    accessToken,
    wsBaseUrl: env.wsBaseUrl,
    onMessage: onWsMessage,
    enabled: !!accessToken && isAuthenticated && hasActiveOrder,
  });

  if (!hasHydrated || !isAuthenticated) return null;

  const firstName = (user?.full_name ?? '').trim().split(' ')[0] || 'traveller';
  const orders = data?.results ?? [];
  const activeOrder = orders.find(
    (o: any) => !['PICKED_UP', 'CANCELLED'].includes(o.status),
  );
  const recentOrders = orders.slice(0, 4);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
    >
      {/* Sky block — explicit sky bg, bleeds full width */}
      <View style={[styles.skyBlock, { backgroundColor: skyColor, marginTop: -(insets.top + 16), paddingTop: insets.top + 16 }]}>
        <Text style={{ ...t.typography.label, color: skyColor === '#0F172A' ? 'rgba(255,255,255,0.5)' : t.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 4 }}>
          Good to see you, {firstName}
        </Text>
        <JourneyCard />
      </View>

      {/* CTAs */}
      <View style={styles.ctaRow}>
        <Button
          label="Scan Bus QR"
          onPress={() => router.push('/(tabs)/scan')}
          size="lg"
          fullWidth
        />
        <Button
          label="Enter 6-digit code"
          variant="secondary"
          onPress={() => router.push('/(tabs)/scan')}
          size="lg"
          fullWidth
        />
      </View>

      {/* Active order */}
      {activeOrder && (
        <Pressable
          style={styles.activeOrderWrap}
          onPress={() => router.push(`/order/${activeOrder.id}`)}
        >
          <Card tone="powder" padding="md" radius="card">
            <View style={styles.activeOrderRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.typography.label, color: t.colors.accentPowderBlueInk }}>
                  Active order
                </Text>
                <Text style={[styles.mt2, { ...t.typography.h3, color: t.colors.textPrimary }]} numberOfLines={1}>
                  {activeOrder.restaurant_name}
                </Text>
                <Text style={[styles.mt1, { ...t.typography.bodySm, color: t.colors.textTertiary }]}>
                  #{String(activeOrder.id).slice(0, 8)} · ₹{activeOrder.total_amount}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Badge variant={STATUS_TONE[activeOrder.status] ?? 'neutral'} label={STATUS_LABEL[activeOrder.status] ?? activeOrder.status} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ ...t.typography.bodySm, color: t.colors.accentPowderBlueInk, fontWeight: '600' }}>
                    Track
                  </Text>
                  <ArrowRight size={14} color={t.colors.accentPowderBlueInk} />
                </View>
              </View>
            </View>
          </Card>
        </Pressable>
      )}

      {/* Recent orders */}
      <View style={styles.section}>
        <SectionHeader
          label="RECENT ORDERS"
          actionLabel={recentOrders.length > 0 ? 'View all' : undefined}
          onAction={recentOrders.length > 0 ? () => router.push('/(tabs)/orders') : undefined}
        />

        {isLoading && (
          <View style={styles.center}>
            <Spinner />
          </View>
        )}

        {!isLoading && recentOrders.length === 0 && (
          <Card tone="sunk" padding="lg" radius="card">
            <EmptyState
              icon={<Package size={24} color={t.colors.textMuted} />}
              title="No orders yet"
              description="Your first pre-order will appear here. Scan a bus QR to get started."
              tone="neutral"
            />
          </Card>
        )}

        {recentOrders.map((order: any) => (
          <Pressable key={order.id} style={styles.orderCard} onPress={() => router.push(`/order/${order.id}`)}>
            <Card tone="default" padding="md" radius="card">
              <View style={styles.orderCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }} numberOfLines={1}>
                    {order.restaurant_name}
                  </Text>
                  <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 2 }}>
                    #{String(order.id).slice(0, 8)} ·{' '}
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <Badge variant={STATUS_TONE[order.status] ?? 'neutral'} label={STATUS_LABEL[order.status] ?? order.status} />
              </View>
              <Text
                style={{ ...t.typography.bodySm, color: t.colors.textTertiary, marginTop: 12 }}
                numberOfLines={1}
              >
                {order.items?.slice(0, 3).map((i: any) => i.menu_item_name).join(' · ')}
              </Text>
              <Text style={{ ...t.typography.h4, color: t.colors.textPrimary, marginTop: 12 }}>
                ₹{order.total_amount}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  skyBlock: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  heroTitle: { marginTop: 12, maxWidth: 340 },
  heroSub: { marginTop: 12, maxWidth: 360 },
  ctaRow: { marginTop: 24, gap: 12 },
  activeOrderWrap: { marginTop: 32 },
  activeOrderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  mt2: { marginTop: 8 },
  mt1: { marginTop: 4 },
  section: { marginTop: 40 },
  center: { alignItems: 'center', paddingVertical: 40 },
  orderCard: { marginTop: 12 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
});
