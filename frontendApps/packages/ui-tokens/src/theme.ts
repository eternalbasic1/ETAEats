import { palette } from './colors';
import { typography, fontFamily } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadow } from './shadow';
import { duration, easingValues, springConfig } from './motion';

export const lightTheme = {
  colors: palette,
  typography,
  fontFamily,
  spacing,
  radius,
  shadow,
  motion: { duration, easing: easingValues, spring: springConfig },
} as const;

export type Theme = typeof lightTheme;
