import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { Theme } from '@eta/ui-tokens';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'soft'
  | 'danger'
  | 'success';

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const HEIGHT: Record<ButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
  xl: 56,
};

const PADDING_H: Record<ButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
};

function variantStyles(variant: ButtonVariant, t: Theme) {
  const map: Record<
    ButtonVariant,
    { bg: string; text: string; border?: string; spinnerColor: string }
  > = {
    primary: {
      bg: t.colors.primary,
      text: t.colors.textOnDark,
      spinnerColor: t.colors.textOnDark,
    },
    secondary: {
      bg: t.colors.surface,
      text: t.colors.textPrimary,
      border: t.colors.border,
      spinnerColor: t.colors.textPrimary,
    },
    outline: {
      bg: t.colors.transparent,
      text: t.colors.textPrimary,
      border: t.colors.borderStrong,
      spinnerColor: t.colors.textPrimary,
    },
    ghost: {
      bg: t.colors.transparent,
      text: t.colors.textPrimary,
      spinnerColor: t.colors.textPrimary,
    },
    soft: {
      bg: t.colors.accentPowderBlue,
      text: t.colors.accentPowderBlueInk,
      spinnerColor: t.colors.accentPowderBlueInk,
    },
    danger: {
      bg: t.colors.errorBg,
      text: t.colors.errorFg,
      spinnerColor: t.colors.errorFg,
    },
    success: {
      bg: t.colors.successBg,
      text: t.colors.successFg,
      spinnerColor: t.colors.successFg,
    },
  };
  return map[variant];
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const vs = variantStyles(variant, theme);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          height: Math.max(HEIGHT[size], 44),
          minHeight: 44,
          borderRadius: theme.radius.sm,
          backgroundColor: vs.bg,
          paddingHorizontal: PADDING_H[size],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'auto',
          ...(vs.border ? { borderWidth: 1, borderColor: vs.border } : {}),
        },
        pressed: {
          opacity: 0.82,
        },
        disabled: {
          opacity: 0.45,
        },
        label: {
          ...theme.typography.button,
          fontFamily: theme.fontFamily.sans,
          color: vs.text,
        },
        labelLoading: {
          opacity: 0.4,
        },
        spinner: {
          marginRight: theme.spacing[2],
        },
      }),
    [theme, variant, size, fullWidth, vs],
  );

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={vs.spinnerColor}
          style={styles.spinner}
        />
      )}
      <Text style={[styles.label, loading && styles.labelLoading]}>
        {label}
      </Text>
    </Pressable>
  );
}
