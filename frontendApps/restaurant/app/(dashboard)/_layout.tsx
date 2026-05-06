import { Tabs, router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Spinner, useTheme } from '@eta/ui-components';
import { useRequireRole } from '@eta/auth';
import {
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  User,
} from 'lucide-react-native';

export default function DashboardLayout() {
  const t = useTheme();
  const { isAuthorized, isLoading, rejectionReason } = useRequireRole(
    'RESTAURANT_STAFF',
    (reason) => {
      if (reason === 'not_authenticated') {
        router.replace('/(auth)/login');
      }
    },
  );

  if (isLoading) {
    return (
      <View
        style={[styles.loading, { backgroundColor: t.colors.bg }]}
        collapsable={Platform.OS === 'android' ? false : undefined}
      >
        <Spinner size="large" color="primary" />
      </View>
    );
  }

  if (!isAuthorized && rejectionReason === 'not_authenticated') {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.borderSubtle,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 84,
        },
        tabBarLabelStyle: {
          ...t.typography.caption,
          fontFamily: t.fontFamily.sans,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <ClipboardList size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size }) => (
            <UtensilsCrossed size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
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
