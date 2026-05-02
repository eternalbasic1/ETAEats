import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../ThemeProvider';

type IconButtonTone = 'ghost' | 'surface';
type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends Omit<PressableProps, 'style'> {
  tone?: IconButtonTone;
  size?: IconButtonSize;
  children: React.ReactNode;
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const DIMENSION: Record<IconButtonSize, number> = { sm: 36, md: 44 };

const HIT_SLOP: Record<IconButtonSize, number> = { sm: 8, md: 4 };

export function IconButton({
  tone = 'ghost',
  size = 'md',
  children,
  accessibilityLabel,
  disabled = false,
  style,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: DIMENSION[size],
          height: DIMENSION[size],
          minWidth: 44,
          minHeight: 44,
          borderRadius: DIMENSION[size] / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            tone === 'surface'
              ? theme.colors.surface
              : theme.colors.transparent,
          ...(tone === 'surface' ? theme.shadow.e2 : {}),
        },
        pressed: { opacity: 0.7 },
        disabled: { opacity: 0.4 },
      }),
    [theme, tone, size],
  );

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={HIT_SLOP[size]}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
