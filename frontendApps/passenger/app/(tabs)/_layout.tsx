import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@eta/ui-components';
import { Home, UtensilsCrossed, QrCode, ClipboardList, UserRound } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS = {
  home: Home,
  menu: UtensilsCrossed,
  scan: QrCode,
  orders: ClipboardList,
  profile: UserRound,
} as const;

const TAB_LABELS: Record<string, string> = {
  home: 'Home',
  menu: 'Menu',
  scan: 'Scan',
  orders: 'Orders',
  profile: 'You',
};

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: insets.bottom + 4 }]}>
      <View style={[styles.tabBarPill, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const key = route.name as keyof typeof TAB_ICONS;
          const Icon = TAB_ICONS[key];
          const label = TAB_LABELS[key] ?? route.name;

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[
                styles.tabItem,
                focused && { backgroundColor: t.colors.primary, borderRadius: 999 },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              {Icon && (
                <Icon
                  size={18}
                  strokeWidth={focused ? 2.2 : 1.8}
                  color={focused ? t.colors.textOnDark : t.colors.textTertiary}
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? t.colors.textOnDark : t.colors.textTertiary },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  tabBarPill: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 6,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
