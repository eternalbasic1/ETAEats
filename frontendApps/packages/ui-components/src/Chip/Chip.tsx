import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Chip({ label, active = false, onPress, accessibilityLabel }: ChipProps) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: t.radius.pill,
          backgroundColor: active ? t.colors.primary : t.colors.surface,
          borderColor: active ? t.colors.primary : t.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          {
            ...t.typography.bodySm,
            fontFamily: t.fontFamily.sans,
            fontWeight: active ? '600' : '500',
            color: active ? t.colors.textOnDark : t.colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
