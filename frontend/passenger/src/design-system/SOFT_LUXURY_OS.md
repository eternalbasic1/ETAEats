# Soft Luxury Operating System (Passenger)

This passenger theme applies the ETAEats "Soft Luxury Operating System" language.

## Core Principles

- Black (`#0D0D0D`) is reserved for primary intent and high-emphasis actions.
- Accent tones are contextual, not decorative.
- Interfaces prioritize breathing room, calm hierarchy, and restrained depth.
- Shadows stay subtle and never become visual focus.

## Accent Usage

- `powderBlue` (`#DDEAF3`): journey context, hero cards, selected navigation moments.
- `softCream` (`#FFF7E8`): trust/payment/informational zones.
- `peach` (`#FFD7C2`): gentle attention, special notes, delays.
- `mutedMint` (`#EAF4EA`): success/progress/reassurance.

## Token Files

- `colors.ts` - neutral, accent, and semantic palettes.
- `typography.ts` - editorial + product type scale.
- `spacing.ts` - 8pt rhythm adapted for mobile.
- `radius.ts` - soft geometry, including card/pill radii.
- `shadow.ts` - restrained elevation levels.

## Tailwind Mapping

Theme tokens are mapped in `tailwind.config.ts` and surfaced via CSS variables in
`src/app/globals.css`. Prefer semantic utility names (`bg-surface2`,
`text-text-secondary`, `rounded-card`, `shadow-e1`) over hardcoded values.
