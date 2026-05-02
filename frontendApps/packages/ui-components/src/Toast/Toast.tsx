import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeProvider';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({
  message,
  variant = 'info',
  visible,
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(() => onDismiss?.());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity, translateY, onDismiss]);

  if (!visible) return null;

  const variantMap: Record<ToastVariant, { bg: string; text: string; border: string }> = {
    success: { bg: t.colors.successBg, text: t.colors.successFg, border: t.colors.successBorder },
    error:   { bg: t.colors.errorBg,   text: t.colors.errorFg,   border: t.colors.errorBorder },
    info:    { bg: t.colors.infoBg,     text: t.colors.infoFg,    border: t.colors.infoBorder },
    warning: { bg: t.colors.warningBg,  text: t.colors.warningFg, border: t.colors.warningBorder },
  };

  const v = variantMap[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          backgroundColor: v.bg,
          borderColor: v.border,
          borderRadius: t.radius.md,
          opacity,
          transform: [{ translateY }],
          ...t.shadow.e2,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text
        style={{
          ...t.typography.bodySm,
          fontFamily: t.fontFamily.sans,
          fontWeight: '600',
          color: v.text,
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    zIndex: 9999,
  },
});
