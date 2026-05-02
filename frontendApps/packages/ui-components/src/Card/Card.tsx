import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { Theme } from '@eta/ui-tokens';

type CardTone =
  | 'default'
  | 'elevated'
  | 'powder'
  | 'peach'
  | 'mint'
  | 'cream'
  | 'sunk';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardRadius = 'md' | 'lg' | 'xl' | 'card' | 'hero';

export interface CardProps {
  tone?: CardTone;
  padding?: CardPadding;
  radius?: CardRadius;
  border?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

function toneBackground(tone: CardTone, t: Theme): string {
  const map: Record<CardTone, string> = {
    default: t.colors.surface,
    elevated: t.colors.surface2,
    powder: t.colors.accentPowderBlue,
    peach: t.colors.accentPeach,
    mint: t.colors.accentMutedMint,
    cream: t.colors.accentSoftCream,
    sunk: t.colors.surfaceSunk,
  };
  return map[tone];
}

const PADDING_MAP: Record<CardPadding, keyof Theme['spacing']> = {
  none: 0,
  sm: 3,
  md: 4,
  lg: 6,
};

export function Card({
  tone = 'default',
  padding = 'md',
  radius = 'card',
  border = false,
  children,
  style,
  accessibilityLabel,
}: CardProps) {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: toneBackground(tone, theme),
          borderRadius: theme.radius[radius],
          padding: theme.spacing[PADDING_MAP[padding]],
          ...(border
            ? { borderWidth: 1, borderColor: theme.colors.borderSubtle }
            : {}),
          ...(tone === 'elevated' ? theme.shadow.e2 : {}),
        },
      }),
    [theme, tone, padding, radius, border],
  );

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}
