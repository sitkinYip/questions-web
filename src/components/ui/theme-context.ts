import { createContext, useContext } from "react";
import type { ResolvedTheme, ThemePreference } from "../../shared/theme/theme";

export interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export function useOptionalTheme() {
  return useContext(ThemeContext);
}
