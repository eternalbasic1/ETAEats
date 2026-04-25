// Soft Luxury Operating System — Elevation Tokens
// Ultra-subtle shadows. Never sharp. Apple-level restraint.

export const shadow = {
  // Flat baseline — hair of separation
  e0: 'none',
  e1: '0 1px 2px rgba(17, 17, 17, 0.04), 0 0 0 0.5px rgba(17, 17, 17, 0.02)',
  // Standard card lift
  e2: '0 6px 18px rgba(17, 17, 17, 0.05), 0 1px 2px rgba(17, 17, 17, 0.03)',
  // Hover lift — used on interactive cards
  e3: '0 12px 28px rgba(17, 17, 17, 0.07), 0 2px 4px rgba(17, 17, 17, 0.04)',
  // Floating primary CTA
  floatingCta: '0 10px 28px rgba(13, 13, 13, 0.18), 0 2px 6px rgba(13, 13, 13, 0.10)',
  // Modal / bottom sheet
  modal: '0 24px 60px rgba(17, 17, 17, 0.14), 0 6px 16px rgba(17, 17, 17, 0.06)',
  // Floating bottom nav pill
  navPill: '0 10px 28px rgba(17, 17, 17, 0.10), 0 2px 8px rgba(17, 17, 17, 0.04)',
  // Inset for stepper / quantity inputs
  inset: 'inset 0 1px 2px rgba(17, 17, 17, 0.04)',
} as const

export type Shadow = typeof shadow
