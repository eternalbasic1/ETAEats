import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, Spinner, EmptyState } from '@eta/ui-components';
import { orderEndpoints } from '@eta/api-client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, IndianRupee, ShoppingBag, XCircle, TrendingUp, Award } from 'lucide-react-native';

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function AnalyticsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'today'],
    queryFn: async () => {
      const res = await orderEndpoints.restaurantOrders({
        page_size: 200,
      });
      return res.data?.results ?? [];
    },
    refetchInterval: 30_000,
  });

  const orders = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);
    const nonCancelled = todayOrders.filter((o: any) => o.status !== 'CANCELLED');
    const cancelled = todayOrders.filter((o: any) => o.status === 'CANCELLED');

    const revenue = nonCancelled.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);

    const hourlyMap: Record<number, number> = {};
    for (let h = 6; h <= 23; h++) hourlyMap[h] = 0;
    nonCancelled.forEach((o: any) => {
      const h = new Date(o.created_at).getHours();
      hourlyMap[h] = (hourlyMap[h] || 0) + parseFloat(o.total_amount || '0');
    });
    const hourly = Object.entries(hourlyMap)
      .map(([h, v]) => ({ hour: parseInt(h), value: v }))
      .filter(h => h.hour >= 6 && h.hour <= 23);

    const itemCounts: Record<string, number> = {};
    nonCancelled.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        const name = item.menu_item_name || 'Unknown';
        itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
      });
    });
    const topItems = Object.entries(itemCounts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      revenue,
      orderCount: todayOrders.length,
      cancelledCount: cancelled.length,
      hourly,
      topItems,
      maxHourly: Math.max(...hourly.map(h => h.value), 1),
    };
  }, [orders]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: t.colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Spinner />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>INSIGHTS</Text>
          <Text style={[styles.pageTitle, { ...t.typography.h1, color: t.colors.textPrimary }]}>Today's analytics</Text>
        </View>

        {/* Stats tiles */}
        <View style={styles.statsRow}>
          <StatTile
            icon={<IndianRupee size={18} color={t.colors.accentPowderBlueInk} />}
            label="Revenue"
            value={`₹${stats.revenue.toFixed(0)}`}
            bgColor={t.colors.accentPowderBlue}
            textColor={t.colors.accentPowderBlueInk}
            t={t}
          />
          <StatTile
            icon={<ShoppingBag size={18} color={t.colors.accentSoftCreamInk} />}
            label="Orders"
            value={String(stats.orderCount)}
            bgColor={t.colors.accentSoftCream}
            textColor={t.colors.accentSoftCreamInk}
            t={t}
          />
          <StatTile
            icon={<XCircle size={18} color={t.colors.errorFg} />}
            label="Cancelled"
            value={String(stats.cancelledCount)}
            bgColor={t.colors.errorBg}
            textColor={t.colors.errorFg}
            t={t}
          />
        </View>

        {/* Hourly revenue chart */}
        <Card tone="default" padding="md" radius="card" border style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={16} color={t.colors.textMuted} />
            <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>REVENUE BY HOUR</Text>
          </View>

          {stats.hourly.every(h => h.value === 0) ? (
            <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, textAlign: 'center', paddingVertical: 24 }}>
              No revenue data yet today.
            </Text>
          ) : (
            <View style={styles.chartContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.barChart}>
                  {stats.hourly.map((h) => {
                    const barHeight = stats.maxHourly > 0 ? (h.value / stats.maxHourly) * 120 : 0;
                    const hasValue = h.value > 0;
                    return (
                      <View key={h.hour} style={styles.barCol}>
                        <View style={[
                          styles.bar,
                          {
                            height: Math.max(barHeight, hasValue ? 4 : 2),
                            backgroundColor: hasValue ? t.colors.primary : t.colors.borderSubtle,
                            borderRadius: 4,
                          },
                        ]} />
                        <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 4 }}>
                          {h.hour > 12 ? `${h.hour - 12}p` : h.hour === 12 ? '12p' : `${h.hour}a`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}
        </Card>

        {/* Top items */}
        <Card tone="default" padding="md" radius="card" border style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Award size={16} color={t.colors.textMuted} />
            <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>TOP 5 ITEMS TODAY</Text>
          </View>

          {stats.topItems.length === 0 ? (
            <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, textAlign: 'center', paddingVertical: 16 }}>
              No items sold yet today.
            </Text>
          ) : (
            stats.topItems.map((item, i) => (
              <View key={item.name} style={[styles.topItemRow, i < stats.topItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.colors.borderSubtle }]}>
                <View style={[styles.rankBadge, { backgroundColor: i === 0 ? t.colors.primary : t.colors.surface2 }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: i === 0 ? t.colors.textOnDark : t.colors.textMuted }}>
                    #{i + 1}
                  </Text>
                </View>
                <Text style={{ ...t.typography.body, color: t.colors.textPrimary, flex: 1 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>
                  {item.qty}
                </Text>
                <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginLeft: 2 }}>sold</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

function StatTile({ icon, label, value, bgColor, textColor, t }: {
  icon: React.ReactNode; label: string; value: string;
  bgColor: string; textColor: string; t: any;
}) {
  return (
    <View style={[statStyles.tile, { backgroundColor: bgColor }]}>
      {icon}
      <Text style={{ ...t.typography.h2, color: textColor, marginTop: 8 }}>{value}</Text>
      <Text style={{ ...t.typography.caption, color: textColor, opacity: 0.7 }}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  tile: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'flex-start' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  hero: { marginBottom: 24 },
  pageTitle: { marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { marginBottom: 16 },
  chartContainer: { height: 160 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140, paddingTop: 8 },
  barCol: { alignItems: 'center', width: 28 },
  bar: { width: 18 },
  topItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
