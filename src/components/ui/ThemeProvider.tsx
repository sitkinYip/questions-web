import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createThemePreferencesRepository,
  THEME_PREFERENCES_KEY,
} from "@/infrastructure/storage/theme.repository";
import {
  resolveTheme,
  SYSTEM_THEME_QUERY,
  systemThemeFromMatches,
  themePreferenceFromSearch,
  type ResolvedTheme,
  type ThemePreference,
} from "@/shared/theme/theme";
import { ThemeContext } from "@/components/ui/theme-context";

function readSystemTheme(): ResolvedTheme {
  if (typeof window.matchMedia !== "function") return "dark";
  return systemThemeFromMatches(window.matchMedia(SYSTEM_THEME_QUERY).matches);
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#10110f" : "#f4f0e7");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const repository = useMemo(
    () => createThemePreferencesRepository(window.localStorage),
    [],
  );
  const [preference, setStoredPreference] = useState<ThemePreference>(
    () =>
      themePreferenceFromSearch(window.location.search) ?? repository.load(),
  );
  const [systemTheme, setSystemTheme] = useState(readSystemTheme);
  const resolvedTheme = resolveTheme(preference, systemTheme);

  const setPreference = useCallback(
    (nextPreference: ThemePreference) => {
      setStoredPreference(nextPreference);
      repository.save(nextPreference);
    },
    [repository],
  );

  useLayoutEffect(() => applyTheme(resolvedTheme), [resolvedTheme]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(SYSTEM_THEME_QUERY);
    const update = (matches: boolean) =>
      setSystemTheme(systemThemeFromMatches(matches));
    const onChange = (event: MediaQueryListEvent) => update(event.matches);
    update(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_PREFERENCES_KEY)
        setStoredPreference(repository.load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [repository]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
