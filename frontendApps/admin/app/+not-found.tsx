import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTheme } from '@eta/ui-components';

export default function NotFoundScreen() {
  const t = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
        <Text style={[styles.eyebrow, { ...t.typography.label, color: t.colors.textMuted }]}>
          404
        </Text>
        <Text style={[styles.title, { ...t.typography.h1, color: t.colors.textPrimary }]}>
          Page not found
        </Text>
        <Text style={[styles.subtitle, { ...t.typography.body, color: t.colors.textTertiary }]}>
          The page you're looking for doesn't exist.
        </Text>
        <Link href="/" style={[styles.link, { ...t.typography.body, color: t.colors.accentPowderBlueInk }]}>
          Go to dashboard
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  eyebrow: { marginBottom: 8 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 24 },
  link: { fontWeight: '600' },
});
