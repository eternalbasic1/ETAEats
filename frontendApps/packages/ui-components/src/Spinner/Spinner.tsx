import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import { JsSpinnerRing } from './JsSpinnerRing';

export type SpinnerSizeToken = 'small' | 'large' | 'sm' | 'lg';

export interface SpinnerProps {
  color?: 'primary' | 'light' | 'tonal';
  size?: SpinnerSizeToken;
}

const SPINNER_BOX = { small: 24, large: 40 } as const;

function normalizeSize(size: SpinnerSizeToken | undefined): 'small' | 'large' {
  if (size === 'large' || size === 'lg') return 'large';
  return 'small';
}

export function Spinner({
  color = 'primary',
  size: sizeProp = 'small',
}: SpinnerProps) {
  const t = useTheme();
  const size = normalizeSize(sizeProp);

  const colorMap: Record<string, string> = {
    primary: t.colors.primary,
    light: t.colors.textOnDark,
    tonal: t.colors.textMuted,
  };

  const box = SPINNER_BOX[size];
  const tint = colorMap[color];

  return (
    <View
      style={[styles.container, { width: box, height: box }]}
      collapsable={Platform.OS === 'android' ? false : undefined}
    >
      {Platform.OS === 'android' ? (
        <JsSpinnerRing size={size} color={tint} />
      ) : (
        <ActivityIndicator size={size} color={tint} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
