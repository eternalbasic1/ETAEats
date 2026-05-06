import { Platform } from 'react-native';

type ShadowStyle = {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
};

const ios = (offset: { width: number; height: number }, shadowRadius: number, opacity: number): ShadowStyle => ({
  shadowColor: '#111111',
  shadowOffset: offset,
  shadowOpacity: opacity,
  shadowRadius: shadowRadius,
});

const android = (elevation: number): ShadowStyle => ({ elevation });

const make = (
  iosCfg: { offset: { width: number; height: number }; radius: number; opacity: number },
  androidElevation: number,
): ShadowStyle =>
  Platform.select({
    ios: ios(iosCfg.offset, iosCfg.radius, iosCfg.opacity),
    android: android(androidElevation),
    default: {},
  }) ?? {};

export const shadow = {
  e0: {} as ShadowStyle,
  e1: make({ offset: { width: 0, height: 1 }, radius: 2, opacity: 0.04 }, 1),
  e2: make({ offset: { width: 0, height: 6 }, radius: 18, opacity: 0.05 }, 3),
  e3: make({ offset: { width: 0, height: 12 }, radius: 28, opacity: 0.07 }, 6),
  floatingCta: make({ offset: { width: 0, height: 10 }, radius: 28, opacity: 0.18 }, 10),
  modal: make({ offset: { width: 0, height: 24 }, radius: 60, opacity: 0.14 }, 16),
  navPill: make({ offset: { width: 0, height: 10 }, radius: 28, opacity: 0.10 }, 8),
} as const;

export type ShadowToken = keyof typeof shadow;
