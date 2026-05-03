import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export type JsSpinnerRingSize = 'small' | 'large';

const BOX: Record<JsSpinnerRingSize, number> = { small: 18, large: 34 };
const BORDER: Record<JsSpinnerRingSize, number> = { small: 2, large: 3 };

export function JsSpinnerRing({
  size,
  color,
}: {
  size: JsSpinnerRingSize;
  color: string;
}) {
  const box = BOX[size];
  const bw = BORDER[size];
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 880,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[styles.wrap, { width: box, height: box, transform: [{ rotate }] }]}
    >
      <View
        style={{
          width: box,
          height: box,
          borderRadius: box / 2,
          borderWidth: bw,
          borderTopColor: color,
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
