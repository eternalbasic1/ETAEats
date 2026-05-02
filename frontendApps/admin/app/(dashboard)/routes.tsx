import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, EmptyState } from '@eta/ui-components';
import { Route } from 'lucide-react-native';

export default function RoutesScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { ...t.typography.label, color: t.colors.textMuted }]}>
        FLEET MANAGEMENT
      </Text>
      <Text style={[styles.title, { ...t.typography.h1, color: t.colors.textPrimary }]}>
        Routes
      </Text>
      <Text style={[styles.subtitle, { ...t.typography.body, color: t.colors.textTertiary }]}>
        Manage your bus routes and stop configurations.
      </Text>

      <View style={styles.emptyContainer}>
        <EmptyState
          icon={<Route size={32} color={t.colors.accentPowderBlueInk} strokeWidth={1.5} />}
          title="No routes yet"
          description="Create your first bus route to start assigning buses and restaurants."
          tone="powder"
          action={{
            label: 'Add Route',
            onPress: () => {
              // TODO: open add-route sheet
            },
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
  emptyContainer: { marginTop: 16 },
});
