import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@eta/ui-components';
import { useTheme } from '@eta/ui-components';

export default function NotFoundScreen() {
  const t = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <Text style={{ ...t.typography.h2, color: t.colors.textPrimary, marginBottom: 16 }}>Page not found</Text>
      <Button label="Go home" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});
