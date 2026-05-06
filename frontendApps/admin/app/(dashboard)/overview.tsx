import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, SectionHeader, Spinner } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { fleetEndpoints, restaurantEndpoints } from '@eta/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Route,
  Bus,
  UtensilsCrossed,
  Users,
  ChevronRight,
  Tag,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useCallback } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  sub?: string;
  tone: 'powder' | 'peach' | 'mint' | 'cream';
  icon: React.ReactNode;
}

function StatCard({ label, value, sub, tone, icon }: StatCardProps) {
  const t = useTheme();
  return (
    <Card tone={tone} padding="md" radius="card" style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={[styles.statValue, { ...t.typography.h2, color: t.colors.textPrimary }]}>
        {value}
      </Text>
      <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>
        {label}
      </Text>
      {sub ? (
        <Text style={[styles.statSub, { ...t.typography.caption, color: t.colors.textMuted }]}>
          {sub}
        </Text>
      ) : null}
    </Card>
  );
}

interface QuickLinkProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function QuickLink({ label, icon, onPress }: QuickLinkProps) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}>
      <Card tone="default" padding="md" radius="lg" border>
        <View style={styles.quickLinkInner}>
          {icon}
          <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600', flex: 1 }}>
            {label}
          </Text>
          <ChevronRight size={18} color={t.colors.textMuted} strokeWidth={1.8} />
        </View>
      </Card>
    </Pressable>
  );
}

export default function OverviewScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const user = useAuthStore((s) => s.user);
  const firstName = (user?.full_name ?? '').trim().split(' ')[0] || 'Admin';

  const routesQuery = useQuery({
    queryKey: ['admin', 'routes', 'count'],
    queryFn: () => fleetEndpoints.routes({ page_size: 1 }),
  });

  const busesQuery = useQuery({
    queryKey: ['admin', 'buses', 'count'],
    queryFn: () => fleetEndpoints.buses({ page_size: 1 }),
  });

  const restaurantsQuery = useQuery({
    queryKey: ['admin', 'restaurants', 'count'],
    queryFn: () => restaurantEndpoints.list({ page_size: 1 }),
  });

  const operatorsQuery = useQuery({
    queryKey: ['admin', 'operators', 'count'],
    queryFn: () => fleetEndpoints.operators({ page_size: 1 }),
  });

  const isLoading =
    routesQuery.isLoading ||
    busesQuery.isLoading ||
    restaurantsQuery.isLoading ||
    operatorsQuery.isLoading;

  const isRefreshing =
    routesQuery.isRefetching ||
    busesQuery.isRefetching ||
    restaurantsQuery.isRefetching ||
    operatorsQuery.isRefetching;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }, [queryClient]);

  const routeCount = routesQuery.data?.data?.count ?? 0;
  const busCount = busesQuery.data?.data?.count ?? 0;
  const restaurantCount = restaurantsQuery.data?.data?.count ?? 0;
  const operatorCount = operatorsQuery.data?.data?.count ?? 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={t.colors.primary} />
      }
    >
      <Text style={[styles.eyebrow, { ...t.typography.label, color: t.colors.textMuted }]}>
        ADMIN DASHBOARD
      </Text>
      <Text style={[styles.title, { ...t.typography.h1, color: t.colors.textPrimary }]}>
        Hello, {firstName}
      </Text>
      <Text style={[styles.subtitle, { ...t.typography.body, color: t.colors.textTertiary }]}>
        Platform overview and management tools.
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Spinner size="large" />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              label="Routes"
              value={routeCount}
              tone="powder"
              icon={<Route size={22} color={t.colors.accentPowderBlueInk} strokeWidth={1.8} />}
            />
            <StatCard
              label="Buses"
              value={busCount}
              tone="mint"
              icon={<Bus size={22} color={t.colors.accentMutedMintInk} strokeWidth={1.8} />}
            />
            <StatCard
              label="Restaurants"
              value={restaurantCount}
              tone="cream"
              icon={<UtensilsCrossed size={22} color={t.colors.accentSoftCreamInk} strokeWidth={1.8} />}
            />
            <StatCard
              label="Operators"
              value={operatorCount}
              tone="peach"
              icon={<Users size={22} color={t.colors.accentPeachInk} strokeWidth={1.8} />}
            />
          </View>

          <SectionHeader label="QUICK ACTIONS" />

          <View style={styles.quickLinks}>
            <QuickLink
              label="Manage Routes"
              icon={<Route size={20} color={t.colors.textSecondary} strokeWidth={1.8} />}
              onPress={() => router.push('/(dashboard)/routes')}
            />
            <QuickLink
              label="Manage Buses"
              icon={<Bus size={20} color={t.colors.textSecondary} strokeWidth={1.8} />}
              onPress={() => router.push('/(dashboard)/buses')}
            />
            <QuickLink
              label="Manage Restaurants"
              icon={<UtensilsCrossed size={20} color={t.colors.textSecondary} strokeWidth={1.8} />}
              onPress={() => router.push('/(dashboard)/restaurants')}
            />
          </View>

          <View style={styles.promoSection}>
            <SectionHeader label="PASSENGER PROMOS" />
          </View>
          <Card tone="mint" padding="md" radius="card" border style={styles.promoInfoCard}>
            <View style={styles.promoInfoRow}>
              <View style={[styles.promoIcon, { backgroundColor: t.colors.surface }]}>
                <Tag size={20} color={t.colors.accentMutedMintInk} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600' }}>
                  Promo codes at checkout
                </Text>
                <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, marginTop: 6 }}>
                  Passengers apply codes in the ETA Eats app on the checkout screen. Percentage and flat
                  discounts are validated in real time. Create, schedule, and cap redemptions in Django
                  Admin under Promos → Promo codes.
                </Text>
              </View>
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 32 },
  eyebrow: { marginBottom: 8 },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: 24 },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
  },
  statIcon: { marginBottom: 12 },
  statValue: { marginBottom: 2 },
  statSub: { marginTop: 4 },
  quickLinks: { gap: 10 },
  quickLink: {},
  quickLinkPressed: { opacity: 0.7 },
  quickLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoSection: { marginTop: 16 },
  promoInfoCard: { marginTop: 4 },
  promoInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
