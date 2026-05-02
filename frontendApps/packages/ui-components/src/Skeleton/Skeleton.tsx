import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width, height, borderRadius, style }: SkeletonProps) {
  const t = useTheme();
  const animValue = useRef(new Animated.Value(0)).current;
  const br = borderRadius ?? t.radius.sm;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animValue]);

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [t.colors.gray200, t.colors.gray150],
  });

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: br, backgroundColor },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({});
