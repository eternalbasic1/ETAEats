import { Platform } from 'react-native';

export const fontFamily = {
  sans:    'Lora',
  display: 'Lora',
  mono:    Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

export const typography = {
  displayXL: { fontSize: 56, lineHeight: 60, fontWeight: '600' as const, letterSpacing: -56 * 0.035 },
  displayL:  { fontSize: 44, lineHeight: 50, fontWeight: '600' as const, letterSpacing: -44 * 0.030 },
  h1:        { fontSize: 32, lineHeight: 38, fontWeight: '600' as const, letterSpacing: -32 * 0.022 },
  h2:        { fontSize: 24, lineHeight: 30, fontWeight: '600' as const, letterSpacing: -24 * 0.018 },
  h3:        { fontSize: 20, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -20 * 0.012 },
  h4:        { fontSize: 17, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -17 * 0.008 },
  bodyLg:    { fontSize: 17, lineHeight: 26, fontWeight: '500' as const, letterSpacing: -17 * 0.003 },
  body:      { fontSize: 15, lineHeight: 22, fontWeight: '500' as const, letterSpacing: 0 },
  bodySm:    { fontSize: 13, lineHeight: 20, fontWeight: '500' as const, letterSpacing: 13 * 0.002 },
  caption:   { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 12 * 0.005 },
  label:     { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 11 * 0.10, textTransform: 'uppercase' as const },
  button:    { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, letterSpacing: -15 * 0.005 },
  mono:      { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0 },
} as const;

export type TypographyToken = keyof typeof typography;
