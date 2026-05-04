import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, Badge, EmptyState, Spinner } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { api } from '@eta/api-client';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react-native';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PREPARING: 'Preparing',
  READY: 'Ready', PICKED_UP: 'Picked up', CANCELLED: 'Cancelled',
};
const STATUS_TONE: Record<string, 'cream' | 'powder' | 'peach' | 'mint' | 'neutral' | 'error'> = {
  PENDING: 'cream', CONFIRMED: 'powder', PREPARING: 'powder',
  READY: 'peach', PICKED_UP: 'mint', CANCELLED: 'error',
};

export default function OrdersScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.replace('/(auth)/login');
  }, [hasHydrated, isAuthenticated]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders/my/').then((r: any) => r.data),
    enabled: hasHydrated && isAuthenticated,
  });

  if (!hasHydrated || !isAuthenticated) return null;

  const orders = data?.results ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
    >
      <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>HISTORY</Text>
      <Text style={[styles.title, { ...t.typography.h1, color: t.colors.textPrimary }]}>
        Order history
      </Text>

      {isLoading && (
        <View style={styles.center}><Spinner /></View>
      )}

      {!isLoading && orders.length === 0 && (
        <EmptyState
          icon={<Package size={24} strokeWidth={1.7} color={t.colors.textMuted} />}
          tone="neutral"
          title="No orders yet"
          description="Scan a bus QR to place your first pre-order."
        />
      )}

      {orders.map((order: any) => (
        <Pressable key={order.id} style={styles.orderCard} onPress={() => router.push(`/order/${order.id}`)}>
          <Card tone="default" padding="md" radius="card">
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }} numberOfLines={1}>
                  {order.restaurant_name}
                </Text>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 2 }}>
                  #{String(order.id).slice(0, 8)} ·{' '}
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              <Badge variant={STATUS_TONE[order.status] ?? 'neutral'} label={STATUS_LABEL[order.status] ?? order.status} />
            </View>
            <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, marginTop: 8 }} numberOfLines={2}>
              {order.items?.map((i: any) => `${i.menu_item_name} ×${i.quantity}`).join(' · ')}
            </Text>
            <Text style={{ ...t.typography.h4, color: t.colors.textPrimary, marginTop: 12 }}>
              ₹{order.total_amount}
            </Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { marginTop: 8, marginBottom: 24 },
  center: { alignItems: 'center', paddingVertical: 56 },
  orderCard: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
});
