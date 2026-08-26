export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

export function themePreferenceFromSearch(
  search: string,
): ThemePreference | undefined {
  const preference = new URLSearchParams(search).get("theme");
  return preference === "system" ||
    preference === "light" ||
    preference === "dark"
    ? preference
    : undefined;
}

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return preference === "system" ? systemTheme : preference;
}

export function systemThemeFromMatches(matchesDark: boolean): ResolvedTheme {
  return matchesDark ? "dark" : "light";
}
