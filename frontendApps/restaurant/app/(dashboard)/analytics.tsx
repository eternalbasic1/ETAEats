import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, EmptyState } from '@eta/ui-components';
import { BarChart3 } from 'lucide-react-native';

export default function AnalyticsScreen() {
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
        <View style={styles.hero}>
          <Text
            style={{
              ...t.typography.label,
              fontFamily: t.fontFamily.sans,
              color: t.colors.textMuted,
            }}
          >
            INSIGHTS
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
            Analytics
          </Text>
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
            Track your kitchen's performance, order trends, and revenue.
          </Text>
        </View>

        <Card tone="default" padding="lg" border>
          <EmptyState
            icon={<BarChart3 size={28} color={t.colors.accentPowderBlueInk} />}
            title="Analytics coming soon"
            description="Daily order counts, average prep time, and revenue breakdowns will appear here once you start receiving orders."
            tone="powder"
          />
        </Card>
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
  hero: {
    marginBottom: 32,
  },
  pageTitle: {
    marginTop: 4,
    marginBottom: 8,
  },
  description: {
    maxWidth: 300,
  },
});
