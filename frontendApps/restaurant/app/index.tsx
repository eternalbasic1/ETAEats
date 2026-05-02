import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@eta/auth';
import { useTheme } from '@eta/ui-components';

export default function Index() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const t = useTheme();

  if (!hasHydrated) {
    return (
      <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(dashboard)/orders" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
