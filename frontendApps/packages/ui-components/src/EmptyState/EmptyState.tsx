import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Button } from '../Button';
import type { ButtonProps } from '../Button';

type EmptyStateTone = 'neutral' | 'powder' | 'cream' | 'peach' | 'mint';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: Pick<ButtonProps, 'label' | 'onPress' | 'variant'>;
  tone?: EmptyStateTone;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}: EmptyStateProps) {
  const t = useTheme();

  const toneBg: Record<EmptyStateTone, string> = {
    neutral: t.colors.surfaceSunk,
    powder:  t.colors.accentPowderBlue,
    cream:   t.colors.accentSoftCream,
    peach:   t.colors.accentPeach,
    mint:    t.colors.accentMutedMint,
  };

  return (
    <View style={styles.container}>
      {icon && (
        <View
          style={[
            styles.iconBubble,
            { backgroundColor: toneBg[tone], borderRadius: t.radius.hero },
          ]}
        >
          {icon}
        </View>
      )}
      <Text
        style={[
          styles.title,
          {
            ...t.typography.h3,
            color: t.colors.textPrimary,
          },
        ]}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.description,
            {
              ...t.typography.bodySm,
              color: t.colors.textTertiary,
            },
          ]}
        >
          {description}
        </Text>
      )}
      {action && (
        <View style={styles.action}>
          <Button
            variant={action.variant ?? 'secondary'}
            label={action.label}
            onPress={action.onPress}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconBubble: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    marginTop: 24,
  },
});
