import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface SpinnerProps {
  color?: 'primary' | 'light' | 'tonal';
  size?: 'small' | 'large';
}

export function Spinner({ color = 'primary', size = 'small' }: SpinnerProps) {
  const t = useTheme();

  const colorMap: Record<string, string> = {
    primary: t.colors.primary,
    light: t.colors.textOnDark,
    tonal: t.colors.textMuted,
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colorMap[color]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
