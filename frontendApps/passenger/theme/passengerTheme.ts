import { lightTheme } from '@eta/ui-tokens';
import type { Theme } from '@eta/ui-tokens';

// ─── Night palette ────────────────────────────────────────────────────────────
// Colors sourced from JourneyCard.tsx night mode:
//   sky/bg:    #0F172A  (SKY_NIGHT_TOP)
//   surface:   #1E293B  (road night, hotel wall night)
//   surface2:  #1E293B
//   sunk:      #0F172A
//   borders:   #1E293B / #334155
//   text:      slate-50 → slate-400 scale
//   accents:   kept readable on dark backgrounds
const nightColors = {
  // Backgrounds
  bg:          '#0F172A',
  surface:     '#1E293B',
  surface2:    '#1E293B',
  surfaceSunk: '#0F172A',

  // Borders
  borderSubtle: '#1E293B',
  border:       '#334155',
  borderStrong: '#475569',

  // Text — slate scale (matches JourneyCard night text tones)
  textPrimary:   '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary:  '#94A3B8',
  textMuted:     '#64748B',
  textDisabled:  '#475569',
  // textOnDark = text on top of primary (amber) button — must be dark for contrast
  textOnDark:    '#111111',

  // Primary action — warm amber so buttons are clearly visible on dark bg
  primary:      '#ffffffff',
  primaryHover: '#ede5d6ff',
  primarySoft:  '#2D1F0A',

  // Accent: powder blue — darkened for night
  accentPowderBlue:    '#1E3A4A',
  accentPowderBlueInk: '#7DD3FC',

  // Accent: soft cream — warm dark tint for night, visible but not muddy
  accentSoftCream:    '#1C1408',
  accentSoftCreamInk: '#FDE68A',

  // Accent: peach — darkened for night
  accentPeach:    '#3D1F10',
  accentPeachInk: '#FCA5A5',

  // Accent: mint — darkened for night
  accentMutedMint:    '#0D2B14',
  accentMutedMintInk: '#86EFAC',

  // Semantic: success
  successFg:     '#86EFAC',
  successBg:     '#0D2B14',
  successBorder: '#166534',

  // Semantic: warning
  warningFg:     '#FDE68A',
  warningBg:     '#2D1F0A',
  warningBorder: '#92400E',

  // Semantic: error
  errorFg:       '#FCA5A5',
  errorBg:       '#3D1010',
  errorBorder:   '#7F1D1D',

  // Semantic: info
  infoFg:        '#7DD3FC',
  infoBg:        '#1E3A4A',
  infoBorder:    '#1D4ED8',

  // Gray scale (night-shifted)
  gray50:  '#0F172A',
  gray100: '#1E293B',
  gray150: '#1E293B',
  gray200: '#334155',
  gray300: '#334155',
  gray400: '#475569',
  gray500: '#64748B',
  gray600: '#94A3B8',
  gray700: '#CBD5E1',
  gray800: '#E2E8F0',
  gray900: '#F8FAFC',

  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

/**
 * Expo `useFonts` registers these @expo-google-fonts/lora faces by name.
 * Every typography token gets an explicit face so RN does not fall back to system UI fonts.
 */
/** Concrete @expo-google-fonts/lora names registered in `app/_layout.tsx`. */
export const passengerFontFaces = {
  regular: 'Lora_400Regular',
  medium: 'Lora_500Medium',
  semibold: 'Lora_600SemiBold',
  bold: 'Lora_700Bold',
  italic: 'Lora_400Regular_Italic',
} as const;

function typographyWithLoraFaces(): Theme['typography'] {
  const base = lightTheme.typography;
  const keys = Object.keys(base) as Array<keyof typeof base>;
  const out = { ...base } as Record<string, (typeof base)[keyof typeof base]>;

  for (const key of keys) {
    const spec = base[key];
    const w = spec.fontWeight;
    const face =
      key === 'mono'
        ? passengerFontFaces.regular
        : w === '600'
          ? passengerFontFaces.semibold
          : passengerFontFaces.medium;
    out[key as string] = { ...spec, fontFamily: face } as (typeof base)[typeof key];
  }

  return out as Theme['typography'];
}

export const passengerTheme: Theme = {
  ...lightTheme,
  fontFamily: {
    sans: passengerFontFaces.regular,
    display: passengerFontFaces.semibold,
    mono: passengerFontFaces.regular,
  } as unknown as Theme['fontFamily'],
  typography: typographyWithLoraFaces(),
};

/**
 * Night variant — same Lora typography, dark slate palette derived from
 * JourneyCard.tsx night-mode colors (#0F172A sky, #1E293B surfaces).
 */
export const passengerNightTheme: Theme = {
  ...passengerTheme,
  colors: nightColors as unknown as Theme['colors'],
};
