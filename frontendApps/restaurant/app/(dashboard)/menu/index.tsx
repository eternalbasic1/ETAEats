import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, EmptyState } from '@eta/ui-components';
import { BookOpen } from 'lucide-react-native';

export default function MenuScreen() {
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
            MANAGE
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
            Menu
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
            Add categories and items to build your restaurant menu.
          </Text>
        </View>

        <Card tone="default" padding="lg" border>
          <EmptyState
            icon={<BookOpen size={28} color={t.colors.accentPowderBlueInk} />}
            title="Your menu is empty"
            description="Your menu items will appear here. Add categories and dishes to get started."
            tone="powder"
            action={{
              label: 'Add First Item',
              onPress: () => {},
              variant: 'primary',
            }}
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
