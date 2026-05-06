import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';

type BadgeVariant =
  | 'powder'
  | 'cream'
  | 'peach'
  | 'mint'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const t = useTheme();

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    powder:  { bg: t.colors.accentPowderBlue, text: t.colors.accentPowderBlueInk },
    cream:   { bg: t.colors.accentSoftCream, text: t.colors.accentSoftCreamInk },
    peach:   { bg: t.colors.accentPeach, text: t.colors.accentPeachInk },
    mint:    { bg: t.colors.accentMutedMint, text: t.colors.accentMutedMintInk },
    success: { bg: t.colors.successBg, text: t.colors.successFg },
    warning: { bg: t.colors.warningBg, text: t.colors.warningFg },
    error:   { bg: t.colors.errorBg, text: t.colors.errorFg },
    info:    { bg: t.colors.infoBg, text: t.colors.infoFg },
    neutral: { bg: t.colors.surfaceSunk, text: t.colors.textTertiary },
  };

  const v = variantMap[variant];

  return (
    <View style={[styles.container, { backgroundColor: v.bg, borderRadius: t.radius.pill }]}>
      <Text
        style={[
          {
            ...t.typography.label,
            color: v.text,
            letterSpacing: 0.44,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
