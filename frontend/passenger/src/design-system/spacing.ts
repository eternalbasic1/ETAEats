// Soft Luxury Operating System — Spacing Tokens
// 8pt rhythm with 4pt micro steps. Breathing room is non-negotiable.

export const spacing = {
  0:  0,
  px: 1,
  1:  4,   // micro — icon gaps
  2:  8,   // tight — stacked labels
  3:  12,  // inline gaps between small items
  4:  16,  // default card inset, small group spacing
  5:  20,  // content blocks
  6:  24,  // card inset, section gap on mobile
  7:  28,
  8:  32,  // section gap
  9:  36,
  10: 40,  // generous section gap
  11: 44,
  12: 48,  // page-level spacing
  14: 56,
  16: 64,  // hero / empty-state breathing
  20: 80,
  24: 96,
} as const

export type Spacing = typeof spacing
