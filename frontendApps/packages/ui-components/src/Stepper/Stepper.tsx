import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../ThemeProvider';

type StepperSize = 'sm' | 'md';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  size?: StepperSize;
  onValueChange: (next: number) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const PILL_HEIGHT: Record<StepperSize, number> = { sm: 36, md: 44 };
const BUTTON_WIDTH: Record<StepperSize, number> = { sm: 44, md: 48 };
const ICON_SIZE: Record<StepperSize, number> = { sm: 16, md: 20 };
const COUNTER_MIN_WIDTH: Record<StepperSize, number> = { sm: 28, md: 36 };

export function Stepper({
  value,
  min = 0,
  max = 99,
  size = 'md',
  onValueChange,
  style,
  accessibilityLabel,
}: StepperProps) {
  const t = useTheme();
  const atMin = value <= min;
  const atMax = value >= max;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: t.colors.primary,
          borderRadius: t.radius.pill,
          height: PILL_HEIGHT[size],
          alignSelf: 'flex-start',
        },
        button: {
          width: BUTTON_WIDTH[size],
          height: PILL_HEIGHT[size],
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        buttonPressed: {
          opacity: 0.7,
        },
        buttonDisabled: {
          opacity: 0.4,
        },
        icon: {
          fontSize: ICON_SIZE[size],
          color: t.colors.textOnDark,
          fontWeight: '600',
          lineHeight: ICON_SIZE[size] + 2,
          textAlign: 'center',
        },
        counter: {
          minWidth: COUNTER_MIN_WIDTH[size],
          alignItems: 'center',
          justifyContent: 'center',
        },
        counterText: {
          ...t.typography.button,
          color: t.colors.textOnDark,
          textAlign: 'center',
        },
      }),
    [t, size],
  );

  return (
    <View
      style={[styles.pill, style]}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel ?? `Quantity: ${value}`}
      accessibilityValue={{ min, max, now: value }}
    >
      <Pressable
        onPress={() => !atMin && onValueChange(value - 1)}
        disabled={atMin}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        accessibilityState={{ disabled: atMin }}
        style={({ pressed }) => [
          styles.button,
          pressed && !atMin && styles.buttonPressed,
          atMin && styles.buttonDisabled,
        ]}
        hitSlop={0}
      >
        <Text style={styles.icon} selectable={false}>
          −
        </Text>
      </Pressable>

      <View style={styles.counter}>
        <Text style={styles.counterText}>{value}</Text>
      </View>

      <Pressable
        onPress={() => !atMax && onValueChange(value + 1)}
        disabled={atMax}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        accessibilityState={{ disabled: atMax }}
        style={({ pressed }) => [
          styles.button,
          pressed && !atMax && styles.buttonPressed,
          atMax && styles.buttonDisabled,
        ]}
        hitSlop={0}
      >
        <Text style={styles.icon} selectable={false}>
          +
        </Text>
      </Pressable>
    </View>
  );
}
