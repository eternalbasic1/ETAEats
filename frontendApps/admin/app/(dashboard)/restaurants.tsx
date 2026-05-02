import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, EmptyState } from '@eta/ui-components';
import { UtensilsCrossed } from 'lucide-react-native';

export default function RestaurantsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { ...t.typography.label, color: t.colors.textMuted }]}>
        PLATFORM
      </Text>
      <Text style={[styles.title, { ...t.typography.h1, color: t.colors.textPrimary }]}>
        Restaurants
      </Text>
      <Text style={[styles.subtitle, { ...t.typography.body, color: t.colors.textTertiary }]}>
        View and manage onboarded highway restaurants.
      </Text>

      <View style={styles.emptyContainer}>
        <EmptyState
          icon={<UtensilsCrossed size={32} color={t.colors.accentSoftCreamInk} strokeWidth={1.5} />}
          title="No restaurants yet"
          description="Onboard your first restaurant to start connecting it with bus routes."
          tone="cream"
          action={{
            label: 'Add Restaurant',
            onPress: () => {
              // TODO: open add-restaurant sheet
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
