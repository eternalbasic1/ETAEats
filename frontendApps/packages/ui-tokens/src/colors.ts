export const palette = {
  bg:           '#F5F5F2',
  surface:      '#FFFFFF',
  surface2:     '#FAFAF8',
  surfaceSunk:  '#F0F0EC',

  borderSubtle: '#EFEFEA',
  border:       '#E8E8E2',
  borderStrong: '#D9D9D1',

  textPrimary:   '#111111',
  textSecondary: '#3E3E3A',
  textTertiary:  '#6F6F6A',
  textMuted:     '#8C8C84',
  textDisabled:  '#A9A9A2',
  textOnDark:    '#FAFAF8',

  primary:      '#0D0D0D',
  primaryHover: '#000000',
  primarySoft:  '#DDEAF3',

  accentPowderBlue: '#DDEAF3',
  accentSoftCream:  '#FFF7E8',
  accentPeach:      '#FFD7C2',
  accentMutedMint:  '#EAF4EA',

  accentPowderBlueInk: '#2B4A63',
  accentSoftCreamInk:  '#7A5A25',
  accentPeachInk:      '#8A4A2A',
  accentMutedMintInk:  '#2E5D38',

  successFg:     '#2E5D38',
  successBg:     '#EAF4EA',
  successBorder: '#CFE2CF',

  warningFg:     '#8A5634',
  warningBg:     '#FFF4EB',
  warningBorder: '#F2DBC6',

  errorFg:       '#8A3B3B',
  errorBg:       '#FCEFEF',
  errorBorder:   '#EED4D4',

  infoFg:        '#3A5568',
  infoBg:        '#DDEAF3',
  infoBorder:    '#C7D6E2',

  gray50:  '#FCFCFA',
  gray100: '#F5F5F2',
  gray150: '#FAFAF8',
  gray200: '#EFEFEA',
  gray300: '#E8E8E2',
  gray400: '#D9D9D1',
  gray500: '#B8B8B0',
  gray600: '#8C8C84',
  gray700: '#6F6F6A',
  gray800: '#3E3E3A',
  gray900: '#111111',

  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorToken = keyof typeof palette;
