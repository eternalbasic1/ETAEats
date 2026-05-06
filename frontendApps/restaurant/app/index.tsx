import { Redirect } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@eta/auth';
import { Spinner, useTheme } from '@eta/ui-components';

export default function Index() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const t = useTheme();

  if (!hasHydrated) {
    return (
      <View
        style={[styles.container, { backgroundColor: t.colors.bg }]}
        collapsable={Platform.OS === 'android' ? false : undefined}
      >
        <Spinner size="large" color="primary" />
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
