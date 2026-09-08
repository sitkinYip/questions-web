import { z } from "zod";
import type { ThemePreference } from "@/shared/theme/theme";

export const THEME_PREFERENCES_KEY = "questions:v1:theme";

const storedThemeSchema = z.object({
  version: z.literal(1),
  preference: z.enum(["system", "light", "dark"]),
});

export interface ThemePreferencesRepository {
  load(): ThemePreference;
  save(preference: ThemePreference): void;
}

export function createThemePreferencesRepository(
  storage: Pick<Storage, "getItem" | "setItem">,
): ThemePreferencesRepository {
  return {
    load() {
      try {
        const raw = storage.getItem(THEME_PREFERENCES_KEY);
        if (!raw) return "system";
        const parsed = storedThemeSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data.preference : "system";
      } catch {
        return "system";
      }
    },
    save(preference) {
      try {
        storage.setItem(
          THEME_PREFERENCES_KEY,
          JSON.stringify({ version: 1, preference }),
        );
      } catch {
        // The active theme still works when storage is unavailable.
      }
    },
  };
}
