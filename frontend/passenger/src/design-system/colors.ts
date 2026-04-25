// Soft Luxury Operating System — Color Tokens
// Restrained, warm neutral foundation + sparingly-used atmospheric accents.

export const colors = {
  // Core surfaces
  bg:       '#F5F5F2', // page background — warm off-white
  card:     '#FFFFFF', // primary card / surface
  elevated: '#FAFAF8', // subtly elevated / hover surface

  // Text hierarchy
  text: {
    primary:   '#111111', // headlines, values, amounts
    secondary: '#3E3E3A', // body copy
    tertiary:  '#6F6F6A', // supporting labels
    muted:     '#8C8C84', // meta, hints, timestamps
    disabled:  '#A9A9A2',
    onDark:    '#FAFAF8', // text on black CTA
  },

  // Borders
  border: {
    subtle:  '#EFEFEA', // hairline dividers on tinted surfaces
    default: '#E8E8E2', // standard card border
    strong:  '#D9D9D1', // emphasised outlines, focus states
  },

  // Neutral scale — warmed, no cool grays
  gray: {
    50:  '#FCFCFA',
    100: '#F5F5F2',
    150: '#FAFAF8',
    200: '#EFEFEA',
    300: '#E8E8E2',
    400: '#D9D9D1',
    500: '#B8B8B0',
    600: '#8C8C84',
    700: '#6F6F6A',
    800: '#3E3E3A',
    900: '#111111',
  },

  // Accent atmosphere — never used as primary CTA
  accent: {
    powderBlue: '#DDEAF3', // "assigned / live / info" atmosphere
    softCream:  '#FFF7E8', // "recommended / warmth / promo" atmosphere
    peach:      '#FFD7C2', // "ready / arriving / warm alert"
    mutedMint:  '#EAF4EA', // "success / healthy / confirmed"
    blackCta:   '#0D0D0D', // the only dark — reserved for primary action
  },

  // Deeper accent tints for text-on-accent
  accentInk: {
    powderBlue: '#2B4A63',
    softCream:  '#7A5A25',
    peach:      '#8A4A2A',
    mutedMint:  '#2E5D38',
  },

  // Semantic states — restrained, never saturated
  semantic: {
    success: { bg: '#EAF4EA', fg: '#2E5D38', border: '#CFE2CF' },
    warning: { bg: '#FFF4EB', fg: '#8A5634', border: '#F2DBC6' },
    error:   { bg: '#FCEFEF', fg: '#8A3B3B', border: '#EED4D4' },
    info:    { bg: '#DDEAF3', fg: '#3A5568', border: '#C7D6E2' },
    neutral: { bg: '#F0F0EC', fg: '#6F6F6A', border: '#E8E8E2' },
  },
} as const

export type Colors = typeof colors
