import React, { createContext, useContext } from 'react';
import { lightTheme } from '@eta/ui-tokens';
import type { Theme } from '@eta/ui-tokens';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({
  children,
  theme = lightTheme,
}: {
  children: React.ReactNode;
  /** Optional override (e.g. passenger app pins concrete Lora font faces). */
  theme?: Theme;
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
