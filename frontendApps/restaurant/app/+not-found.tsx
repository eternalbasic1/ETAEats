import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button } from '@eta/ui-components';
import { MapPinOff } from 'lucide-react-native';

export default function NotFoundScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: t.colors.bg,
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 40,
        },
      ]}
    >
      <View
        style={[
          styles.iconBubble,
          { backgroundColor: t.colors.surfaceSunk, borderRadius: t.radius.hero },
        ]}
      >
        <MapPinOff size={32} color={t.colors.textTertiary} />
      </View>

      <Text
        style={{
          ...t.typography.label,
          fontFamily: t.fontFamily.sans,
          color: t.colors.textMuted,
          marginBottom: 8,
        }}
      >
        404
      </Text>

      <Text
        style={[
          styles.title,
          {
            ...t.typography.h1,
            fontFamily: t.fontFamily.display,
            color: t.colors.textPrimary,
          },
        ]}
      >
        Page not found
      </Text>

      <Text
        style={[
          styles.body,
          {
            ...t.typography.body,
            fontFamily: t.fontFamily.sans,
            color: t.colors.textTertiary,
          },
        ]}
      >
        The screen you're looking for doesn't exist or has been moved.
      </Text>

      <Link href="/" asChild>
        <Button label="Go to Kitchen" variant="primary" onPress={() => {}} />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconBubble: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 32,
  },
});
