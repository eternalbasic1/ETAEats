import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button, Card, Badge, EmptyState, SectionHeader, Spinner } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { api } from '@eta/api-client';
import { formatINR } from '@eta/utils';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package, QrCode, ArrowRight } from 'lucide-react-native';

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

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [hasHydrated, isAuthenticated]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'home'],
    queryFn: () => api.get('/orders/my/?page_size=8').then((r: any) => r.data),
    enabled: isAuthenticated,
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
      {/* Greeting */}
      <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>
        Good to see you, {firstName}
      </Text>

      {/* Hero */}
      <Text style={[styles.heroTitle, { ...t.typography.h1, color: t.colors.textPrimary }]}>
        Order food before your bus{' '}
        <Text style={{ color: t.colors.accentPowderBlueInk }}>arrives.</Text>
      </Text>

      <Text style={[styles.heroSub, { ...t.typography.body, color: t.colors.textTertiary }]}>
        Scan the QR inside your bus and pre-order from the assigned highway kitchen. We'll have it ready when you step off.
      </Text>

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
          onPress={() => {}}
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
          <Pressable key={order.id} style={styles.orderCard} onPress={() => {}}>
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
