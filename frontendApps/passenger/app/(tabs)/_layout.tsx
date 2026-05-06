import { Tabs } from 'expo-router';
import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@eta/ui-components';
import { Home, UtensilsCrossed, QrCode, ClipboardList, UserRound } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

let impactLight: (() => void) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Haptics = require('expo-haptics');
  impactLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
} catch {
  // expo-haptics not available
}

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

const TAB_COUNT = 5;

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';

  // Animated position for the sliding active indicator
  const slideAnim = useRef(new Animated.Value(state.index)).current;
  // Track pill width so we can compute item width
  const pillWidth = useRef(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 68,
      friction: 11,
    }).start();
  }, [state.index]);

  const itemWidth = pillWidth.current > 0
    ? (pillWidth.current - 12 - (TAB_COUNT - 1) * 4) / TAB_COUNT  // 12 = padding*2, 4 = gap
    : 0;

  const translateX = slideAnim.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * (itemWidth + 4)),
  });

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: insets.bottom + 4 }]}>
      <View
        style={[
          styles.tabBarPill,
          { backgroundColor: t.colors.surface, borderColor: t.colors.border },
          isIOS && styles.tabBarPillGlass,
        ]}
        onLayout={(e) => {
          pillWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {/* Sliding active indicator */}
        {itemWidth > 0 && (
          <Animated.View
            style={[
              styles.activeIndicator,
              { backgroundColor: t.colors.primary, width: itemWidth },
              { transform: [{ translateX }] },
            ]}
            pointerEvents="none"
          />
        )}

        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const key = route.name as keyof typeof TAB_ICONS;
          const Icon = TAB_ICONS[key];
          const label = TAB_LABELS[key] ?? route.name;

          // On iOS glass: inactive tabs use a dark semi-transparent color for legibility
          const inactiveColor = isIOS ? 'rgba(30,30,30,0.55)' : t.colors.textTertiary;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                if (isIOS && impactLight) impactLight();
                navigation.navigate(route.name);
              }}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              {Icon && (
                <Icon
                  size={18}
                  strokeWidth={focused ? 2.2 : 1.8}
                  color={focused ? t.colors.textOnDark : inactiveColor}
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? t.colors.textOnDark : inactiveColor },
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
    overflow: 'hidden',
  },
  // iOS-only glassmorphic override
  tabBarPillGlass: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  // Absolutely positioned sliding indicator — sits behind tab items
  activeIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    bottom: 6,
    borderRadius: 999,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
