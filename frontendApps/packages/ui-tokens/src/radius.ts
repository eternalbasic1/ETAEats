export const radius = {
  none: 0,
  xs:   6,
  sm:  10,
  md:  14,
  lg:  18,
  xl:  22,
  card: 28,
  hero: 32,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
