import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
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
import { JsSpinnerRing } from '../Spinner/JsSpinnerRing';

// Haptics are optional — gracefully no-op if expo-haptics isn't installed
let impactLight: (() => void) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Haptics = require('expo-haptics');
  impactLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
} catch {
  // expo-haptics not available in this app
}

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
  // On iOS, secondary and outline get a frosted-glass treatment
  const glassOverride = Platform.OS === 'ios' && (variant === 'secondary' || variant === 'outline');

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
      bg: glassOverride ? 'rgba(255,255,255,0.18)' : t.colors.surface,
      text: t.colors.textPrimary,
      border: glassOverride ? 'rgba(255,255,255,0.35)' : t.colors.border,
      spinnerColor: t.colors.textPrimary,
    },
    outline: {
      bg: glassOverride ? 'rgba(255,255,255,0.12)' : t.colors.transparent,
      text: t.colors.textPrimary,
      border: glassOverride ? 'rgba(255,255,255,0.35)' : t.colors.borderStrong,
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
  return { ...map[variant], glassOverride };
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
          // iOS glassmorphic: subtle shadow to reinforce the frosted look
          ...(vs.glassOverride ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          } : {}),
        },
        pressed: {
          opacity: 0.82,
        },
        disabled: {
          opacity: 0.45,
        },
        label: {
          ...theme.typography.button,
          color: vs.text,
        },
        labelLoading: {
          opacity: 0.4,
        },
        spinner: {
          marginRight: theme.spacing[2],
        },
        spinnerHost: {
          width: 22,
          height: 22,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [theme, variant, size, fullWidth, vs],
  );

  const handlePress: PressableProps['onPress'] = (e) => {
    if (Platform.OS === 'ios' && impactLight) impactLight();
    rest.onPress?.(e);
  };

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
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
        <View
          style={[styles.spinnerHost, styles.spinner]}
          collapsable={Platform.OS === 'android' ? false : undefined}
        >
          {Platform.OS === 'android' ? (
            <JsSpinnerRing size="small" color={vs.spinnerColor} />
          ) : (
            <ActivityIndicator size="small" color={vs.spinnerColor} />
          )}
        </View>
      )}
      <Text style={[styles.label, loading && styles.labelLoading]}>
        {label}
      </Text>
    </Pressable>
  );
}
