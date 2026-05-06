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
  displayXL: { fontSize: 56, lineHeight: 60, fontWeight: '600' as const, letterSpacing: -56 * 0.035, fontFamily: fontFamily.sans },
  displayL:  { fontSize: 44, lineHeight: 50, fontWeight: '600' as const, letterSpacing: -44 * 0.030, fontFamily: fontFamily.sans },
  h1:        { fontSize: 32, lineHeight: 38, fontWeight: '600' as const, letterSpacing: -32 * 0.022, fontFamily: fontFamily.sans },
  h2:        { fontSize: 24, lineHeight: 30, fontWeight: '600' as const, letterSpacing: -24 * 0.018, fontFamily: fontFamily.sans },
  h3:        { fontSize: 20, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -20 * 0.012, fontFamily: fontFamily.sans },
  h4:        { fontSize: 17, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -17 * 0.008, fontFamily: fontFamily.sans },
  bodyLg:    { fontSize: 17, lineHeight: 26, fontWeight: '500' as const, letterSpacing: -17 * 0.003, fontFamily: fontFamily.sans },
  body:      { fontSize: 15, lineHeight: 22, fontWeight: '500' as const, letterSpacing: 0, fontFamily: fontFamily.sans },
  bodySm:    { fontSize: 13, lineHeight: 20, fontWeight: '500' as const, letterSpacing: 13 * 0.002, fontFamily: fontFamily.sans },
  caption:   { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 12 * 0.005, fontFamily: fontFamily.sans },
  label:     { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 11 * 0.10, textTransform: 'uppercase' as const, fontFamily: fontFamily.sans },
  button:    { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, letterSpacing: -15 * 0.005, fontFamily: fontFamily.sans },
  mono:      { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0, fontFamily: fontFamily.mono },
} as const;

export type TypographyToken = keyof typeof typography;
