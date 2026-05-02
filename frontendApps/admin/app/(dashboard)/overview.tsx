import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, SectionHeader } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import {
  Route,
  Bus,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Link2,
} from 'lucide-react-native';
import { router } from 'expo-router';

interface StatCardProps {
  label: string;
  value: string;
  tone: 'powder' | 'peach' | 'mint' | 'cream';
  icon: React.ReactNode;
}

function StatCard({ label, value, tone, icon }: StatCardProps) {
  const t = useTheme();
  return (
    <Card tone={tone} padding="md" radius="card" style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={[styles.statValue, { ...t.typography.h2, color: t.colors.textPrimary }]}>
        {value}
      </Text>
      <Text style={[{ ...t.typography.bodySm, color: t.colors.textTertiary }]}>
        {label}
      </Text>
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
          <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600' }}>
            {label}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export default function OverviewScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const firstName = user?.first_name || 'Admin';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
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

      <View style={styles.statsGrid}>
        <StatCard
          label="Active Routes"
          value="—"
          tone="powder"
          icon={<Route size={22} color={t.colors.accentPowderBlueInk} strokeWidth={1.8} />}
        />
        <StatCard
          label="Active Buses"
          value="—"
          tone="mint"
          icon={<Bus size={22} color={t.colors.accentMutedMintInk} strokeWidth={1.8} />}
        />
        <StatCard
          label="Restaurants"
          value="—"
          tone="cream"
          icon={<UtensilsCrossed size={22} color={t.colors.accentSoftCreamInk} strokeWidth={1.8} />}
        />
        <StatCard
          label="Today's Orders"
          value="—"
          tone="peach"
          icon={<ShoppingBag size={22} color={t.colors.accentPeachInk} strokeWidth={1.8} />}
        />
      </View>

      <SectionHeader label="QUICK ACTIONS" />

      <View style={styles.quickLinks}>
        <QuickLink
          label="Manage Operators"
          icon={<Users size={20} color={t.colors.textSecondary} strokeWidth={1.8} />}
          onPress={() => {
            // TODO: navigate to operators sub-page
          }}
        />
        <QuickLink
          label="Bus Assignments"
          icon={<Link2 size={20} color={t.colors.textSecondary} strokeWidth={1.8} />}
          onPress={() => {
            // TODO: navigate to assignments sub-page
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 32 },
  eyebrow: { marginBottom: 8 },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: 24 },
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
  quickLinks: { gap: 10 },
  quickLink: {},
  quickLinkPressed: { opacity: 0.7 },
  quickLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
