import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useTheme,
  Card,
  SectionHeader,
  ConnectionBadge,
  EmptyState,
} from '@eta/ui-components';
import { Inbox, Flame, PackageCheck } from 'lucide-react-native';

export default function OrdersScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
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

        <View style={styles.section}>
          <SectionHeader label="NEW ORDERS" />
          <Card tone="cream" padding="lg" border>
            <EmptyState
              icon={<Inbox size={28} color={t.colors.accentSoftCreamInk} />}
              title="No new orders"
              description="New orders will appear here as soon as passengers place them."
              tone="cream"
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader label="COOKING" />
          <Card tone="peach" padding="lg" border>
            <EmptyState
              icon={<Flame size={28} color={t.colors.accentPeachInk} />}
              title="Nothing cooking"
              description="Orders you've confirmed will move here while being prepared."
              tone="peach"
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader label="READY FOR PICKUP" />
          <Card tone="mint" padding="lg" border>
            <EmptyState
              icon={<PackageCheck size={28} color={t.colors.accentMutedMintInk} />}
              title="No orders ready"
              description="Completed orders will appear here waiting for bus pickup."
              tone="mint"
            />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
