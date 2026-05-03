import { lightTheme } from '@eta/ui-tokens';
import type { Theme } from '@eta/ui-tokens';

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
  },
  typography: typographyWithLoraFaces(),
};
