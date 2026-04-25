// Soft Luxury Operating System — Radius Tokens
// Soft but sophisticated — rounded, never pillowy.

export const radius = {
  none:   0,
  xs:     6,   // tiny chips, inline tags
  sm:     10,  // inputs, small buttons
  md:     14,  // list tiles, menu rows
  lg:     18,  // standard buttons
  xl:     22,  // large cards, bottom sheets corners
  card:   28,  // signature soft-luxury card radius
  hero:   32,  // hero / feature cards, modals
  pill:   999, // chips, status pills, bottom nav capsule
} as const

export type Radius = typeof radius
