import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface SectionHeaderProps {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ label, actionLabel, onAction }: SectionHeaderProps) {
  const t = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={{
          ...t.typography.label,
          color: t.colors.textMuted,
        }}
        accessibilityRole="header"
      >
        {label}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text
            style={{
              ...t.typography.bodySm,
              color: t.colors.accentPowderBlueInk,
              fontWeight: '600',
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
