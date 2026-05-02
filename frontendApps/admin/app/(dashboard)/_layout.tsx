import { Tabs, router } from 'expo-router';
import { useTheme } from '@eta/ui-components';
import { useRequireRole } from '@eta/auth';
import { Spinner } from '@eta/ui-components';
import { View, StyleSheet } from 'react-native';
import {
  LayoutDashboard,
  Route,
  Bus,
  UtensilsCrossed,
  UserCircle,
} from 'lucide-react-native';

export default function DashboardLayout() {
  const t = useTheme();
  const { isAuthorized, isLoading } = useRequireRole('ADMIN', () => {
    router.replace('/(auth)/login');
  });

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: t.colors.bg }]}>
        <Spinner size="lg" />
      </View>
    );
  }

  if (!isAuthorized) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.borderSubtle,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarLabelStyle: {
          ...t.typography.caption,
          fontFamily: t.fontFamily.sans,
        },
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ color, size }) => (
            <Route size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="buses"
        options={{
          title: 'Buses',
          tabBarIcon: ({ color, size }) => (
            <Bus size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ color, size }) => (
            <UtensilsCrossed size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
