export const duration = {
  instant:     80,
  fast:       140,
  base:       220,
  slow:       320,
  deliberate: 480,
} as const;

export const easingValues = {
  standard: { x1: 0.22, y1: 0.61, x2: 0.36, y2: 1 },
  enter:    { x1: 0.16, y1: 1,    x2: 0.30, y2: 1 },
  exit:     { x1: 0.70, y1: 0,    x2: 0.84, y2: 0 },
} as const;

export const springConfig = {
  soft:   { damping: 22, stiffness: 180, mass: 1 },
  medium: { damping: 18, stiffness: 220, mass: 1 },
  snappy: { damping: 14, stiffness: 320, mass: 1 },
  sheet:  { damping: 26, stiffness: 260, mass: 1 },
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easingValues;
export type SpringToken = keyof typeof springConfig;
