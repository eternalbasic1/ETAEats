import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';

type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export interface ConnectionBadgeProps {
  state: ConnectionState;
}

export function ConnectionBadge({ state }: ConnectionBadgeProps) {
  const t = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'connected') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }
    pulseAnim.setValue(1);
  }, [state, pulseAnim]);

  const config: Record<ConnectionState, { bg: string; text: string; dotColor: string; label: string }> = {
    connected:    { bg: t.colors.accentMutedMint, text: t.colors.accentMutedMintInk, dotColor: t.colors.successFg, label: 'Live' },
    reconnecting: { bg: t.colors.accentSoftCream, text: t.colors.accentSoftCreamInk, dotColor: t.colors.warningFg, label: 'Reconnecting…' },
    disconnected: { bg: t.colors.surfaceSunk,      text: t.colors.textTertiary,       dotColor: t.colors.textDisabled, label: 'Offline' },
  };

  const c = config[state];

  return (
    <View
      style={[styles.container, { backgroundColor: c.bg, borderRadius: t.radius.pill }]}
      accessibilityLabel={`Connection: ${c.label}`}
    >
      <Animated.View
        style={[styles.dot, { backgroundColor: c.dotColor, opacity: pulseAnim }]}
      />
      <Text
        style={{
          ...t.typography.caption,
          fontWeight: '600',
          color: c.text,
        }}
      >
        {c.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
