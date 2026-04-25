// Soft Luxury Operating System — Motion Tokens
// Gentle springs, premium easing, never bouncy. Everything subtle.

export const motion = {
  duration: {
    instant: 80,
    fast:    140,
    base:    220,
    slow:    320,
    deliberate: 480,
  },

  // CSS easing curves
  easing: {
    standard: 'cubic-bezier(0.22, 0.61, 0.36, 1)',   // default UI motion
    enter:    'cubic-bezier(0.16, 1, 0.3, 1)',       // elements appearing
    exit:     'cubic-bezier(0.7, 0, 0.84, 0)',       // elements leaving
    softSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // subtle overshoot
  },

  // Framer-motion spring presets
  spring: {
    soft:   { type: 'spring', stiffness: 220, damping: 28 },
    medium: { type: 'spring', stiffness: 280, damping: 30 },
    snappy: { type: 'spring', stiffness: 340, damping: 32 },
    sheet:  { type: 'spring', stiffness: 260, damping: 32 },
  },

  // Hover lift recipe — apply to interactive cards
  hoverLift: {
    rest:  { y: 0,  transition: { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] } },
    hover: { y: -2, transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1]   } },
    tap:   { scale: 0.985, transition: { duration: 0.1 } },
  },

  // Page transition recipe
  page: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
    exit:    { opacity: 0, y: -4, transition: { duration: 0.2 } },
  },
} as const

export type Motion = typeof motion
