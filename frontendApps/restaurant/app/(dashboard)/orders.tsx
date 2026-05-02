import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useTheme,
  Card,
  Badge,
  Button,
  Spinner,
  EmptyState,
  SectionHeader,
  ConnectionBadge,
} from '@eta/ui-components';
import { orderEndpoints } from '@eta/api-client';
import { useAuthStore } from '@eta/auth';
import { relativeTime, formatINRFromRupees } from '@eta/utils';
import type { Order, OrderStatus } from '@eta/types';
import {
  Inbox,
  Flame,
  PackageCheck,
  Clock,
  Bus,
  XCircle,
} from 'lucide-react-native';

const CANCEL_REASONS = [
  'Out of stock',
  'Kitchen too busy',
  'Customer requested',
  'Other',
] as const;

const QUERY_KEY = ['restaurant-orders'] as const;

export default function OrdersScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const restaurantId = useAuthStore((s) => s.user?.restaurantId);

  const {
    data: ordersResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => orderEndpoints.restaurantOrders({ page_size: 100 }),
    refetchInterval: 8_000,
    enabled: !!restaurantId,
  });

  const orders: Order[] = ordersResponse?.data?.results ?? [];

  const { confirmed, preparing, ready } = useMemo(() => {
    const c: Order[] = [];
    const p: Order[] = [];
    const r: Order[] = [];
    for (const o of orders) {
      if (o.status === 'CONFIRMED') c.push(o);
      else if (o.status === 'PREPARING') p.push(o);
      else if (o.status === 'READY') r.push(o);
    }
    return { confirmed: c, preparing: p, ready: r };
  }, [orders]);

  const advanceMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
      reason,
    }: {
      orderId: string;
      status: string;
      reason?: string;
    }) => orderEndpoints.advanceOrder(orderId, { status, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const handleAdvance = useCallback(
    (orderId: string, nextStatus: OrderStatus) => {
      advanceMutation.mutate({ orderId, status: nextStatus });
    },
    [advanceMutation],
  );

  const handleCancel = useCallback(
    (orderId: string) => {
      Alert.alert('Cancel order', 'Select a reason for cancellation:', [
        ...CANCEL_REASONS.map((reason) => ({
          text: reason,
          onPress: () =>
            advanceMutation.mutate({
              orderId,
              status: 'CANCELLED',
              reason,
            }),
        })),
        { text: 'Go back', style: 'cancel' as const },
      ]);
    },
    [advanceMutation],
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: t.colors.bg, paddingTop: insets.top },
        ]}
      >
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text
              style={{
                ...t.typography.label,
                fontFamily: t.fontFamily.sans,
                color: t.colors.textMuted,
              }}
            >
              KITCHEN
            </Text>
            <Text
              style={[
                styles.pageTitle,
                {
                  ...t.typography.h1,
                  fontFamily: t.fontFamily.display,
                  color: t.colors.textPrimary,
                },
              ]}
            >
              Orders
            </Text>
          </View>
          <ConnectionBadge state="disconnected" />
        </View>

        <Text
          style={[
            styles.description,
            {
              ...t.typography.body,
              fontFamily: t.fontFamily.sans,
              color: t.colors.textTertiary,
            },
          ]}
        >
          Manage incoming orders as they flow through your kitchen.
        </Text>

        {/* ── New orders (CONFIRMED) ── */}
        <KanbanSection
          label="NEW ORDERS"
          orders={confirmed}
          tone="cream"
          emptyIcon={<Inbox size={28} color={t.colors.accentSoftCreamInk} />}
          emptyTitle="No new orders"
          emptyDescription="New orders will appear here as soon as passengers place them."
          badgeVariant="warning"
          actionLabel="Start cooking"
          nextStatus="PREPARING"
          onAdvance={handleAdvance}
          onCancel={handleCancel}
          showCancel
          advancingId={
            advanceMutation.isPending
              ? (advanceMutation.variables?.orderId ?? null)
              : null
          }
        />

        {/* ── Cooking (PREPARING) ── */}
        <KanbanSection
          label="COOKING"
          orders={preparing}
          tone="peach"
          emptyIcon={<Flame size={28} color={t.colors.accentPeachInk} />}
          emptyTitle="Nothing cooking"
          emptyDescription="Orders you've confirmed will move here while being prepared."
          badgeVariant="peach"
          actionLabel="Mark ready"
          nextStatus="READY"
          onAdvance={handleAdvance}
          onCancel={handleCancel}
          showCancel
          advancingId={
            advanceMutation.isPending
              ? (advanceMutation.variables?.orderId ?? null)
              : null
          }
        />

        {/* ── Ready for pickup (READY) ── */}
        <KanbanSection
          label="READY FOR PICKUP"
          orders={ready}
          tone="mint"
          emptyIcon={
            <PackageCheck size={28} color={t.colors.accentMutedMintInk} />
          }
          emptyTitle="No orders ready"
          emptyDescription="Completed orders will appear here waiting for bus pickup."
          badgeVariant="mint"
          actionLabel="Picked up"
          nextStatus="PICKED_UP"
          onAdvance={handleAdvance}
          advancingId={
            advanceMutation.isPending
              ? (advanceMutation.variables?.orderId ?? null)
              : null
          }
        />
      </ScrollView>
    </View>
  );
}

/* ─── Kanban Section ─── */

type CardTone = 'cream' | 'peach' | 'mint';

interface KanbanSectionProps {
  label: string;
  orders: Order[];
  tone: CardTone;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  badgeVariant: 'warning' | 'peach' | 'mint';
  actionLabel: string;
  nextStatus: OrderStatus;
  onAdvance: (orderId: string, status: OrderStatus) => void;
  onCancel?: (orderId: string) => void;
  showCancel?: boolean;
  advancingId: string | null;
}

function KanbanSection({
  label,
  orders,
  tone,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  badgeVariant,
  actionLabel,
  nextStatus,
  onAdvance,
  onCancel,
  showCancel,
  advancingId,
}: KanbanSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <SectionHeader label={label} />
        {orders.length > 0 && (
          <Badge label={String(orders.length)} variant={badgeVariant} />
        )}
      </View>

      {orders.length === 0 ? (
        <Card tone={tone} padding="lg" border>
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            tone={tone}
          />
        </Card>
      ) : (
        <View style={styles.cardList}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              actionLabel={actionLabel}
              nextStatus={nextStatus}
              onAdvance={onAdvance}
              onCancel={showCancel ? onCancel : undefined}
              isAdvancing={advancingId === order.id}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── Order Card ─── */

interface OrderCardProps {
  order: Order;
  actionLabel: string;
  nextStatus: OrderStatus;
  onAdvance: (orderId: string, status: OrderStatus) => void;
  onCancel?: (orderId: string) => void;
  isAdvancing: boolean;
}

function OrderCard({
  order,
  actionLabel,
  nextStatus,
  onAdvance,
  onCancel,
  isAdvancing,
}: OrderCardProps) {
  const t = useTheme();

  const itemsSummary = order.items.map((i) => i.menu_item_name).join(', ');
  const totalDisplay = `₹${parseFloat(order.total_amount).toFixed(2)}`;
  const orderId = order.id.slice(0, 8).toUpperCase();
  const timeAgo = relativeTime(order.created_at);

  return (
    <Card tone="default" padding="md" border>
      <View style={styles.cardHeader}>
        <View style={styles.cardIdRow}>
          <Text
            style={{
              ...t.typography.mono,
              fontFamily: t.fontFamily.mono,
              color: t.colors.textPrimary,
              fontWeight: '700',
            }}
          >
            #{orderId}
          </Text>
          <View style={styles.timeRow}>
            <Clock size={12} color={t.colors.textMuted} />
            <Text
              style={{
                ...t.typography.caption,
                fontFamily: t.fontFamily.sans,
                color: t.colors.textMuted,
                marginLeft: 3,
              }}
            >
              {timeAgo}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.busRow}>
        <Bus size={14} color={t.colors.textTertiary} />
        <Text
          style={{
            ...t.typography.bodySm,
            fontFamily: t.fontFamily.sans,
            color: t.colors.textSecondary,
            marginLeft: 6,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {order.bus_name}
        </Text>
      </View>

      <Text
        style={{
          ...t.typography.body,
          fontFamily: t.fontFamily.sans,
          color: t.colors.textPrimary,
          marginTop: 8,
        }}
        numberOfLines={2}
      >
        {itemsSummary}
      </Text>

      <Text
        style={{
          ...t.typography.h4,
          fontFamily: t.fontFamily.sans,
          color: t.colors.textPrimary,
          marginTop: 8,
        }}
      >
        {totalDisplay}
      </Text>

      <View style={styles.cardActions}>
        <View style={styles.primaryAction}>
          <Button
            label={actionLabel}
            variant="primary"
            size="sm"
            fullWidth
            loading={isAdvancing}
            onPress={() => onAdvance(order.id, nextStatus)}
          />
        </View>
        {onCancel && (
          <Pressable
            style={styles.cancelButton}
            onPress={() => onCancel(order.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Cancel order"
            accessibilityRole="button"
          >
            <XCircle size={16} color={t.colors.errorFg} />
            <Text
              style={{
                ...t.typography.bodySm,
                fontFamily: t.fontFamily.sans,
                color: t.colors.errorFg,
                fontWeight: '600',
                marginLeft: 4,
              }}
            >
              Cancel
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pageTitle: {
    marginTop: 4,
  },
  description: {
    marginBottom: 32,
    maxWidth: 320,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardList: {
    gap: 12,
  },
  cardHeader: {
    marginBottom: 6,
  },
  cardIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  primaryAction: {
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
