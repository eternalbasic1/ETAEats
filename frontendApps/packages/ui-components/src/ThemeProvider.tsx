import React, { createContext, useContext } from 'react';
import { lightTheme } from '@eta/ui-tokens';
import type { Theme } from '@eta/ui-tokens';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
