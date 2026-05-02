import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, EmptyState } from '@eta/ui-components';
import { Bus } from 'lucide-react-native';

export default function BusesScreen() {
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
        Buses
      </Text>
      <Text style={[styles.subtitle, { ...t.typography.body, color: t.colors.textTertiary }]}>
        Register and manage buses operating on your routes.
      </Text>

      <View style={styles.emptyContainer}>
        <EmptyState
          icon={<Bus size={32} color={t.colors.accentMutedMintInk} strokeWidth={1.5} />}
          title="No buses registered"
          description="Add your first bus to start assigning it to routes and restaurants."
          tone="mint"
          action={{
            label: 'Add Bus',
            onPress: () => {
              // TODO: open add-bus sheet
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
