import { z } from "zod";

export const BGM_PREFERENCES_KEY = "questions:v1:bgm";

const preferencesSchema = z.object({
  enabled: z.boolean(),
  position: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
    .optional(),
});

export interface BgmPreferences {
  enabled: boolean;
  position?: { x: number; y: number };
}

export function createBgmPreferencesRepository(
  storage: Pick<Storage, "getItem" | "setItem">,
) {
  return {
    load(): BgmPreferences {
      try {
        const raw = storage.getItem(BGM_PREFERENCES_KEY);
        if (!raw) return { enabled: true };
        const parsed = preferencesSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : { enabled: true };
      } catch {
        return { enabled: true };
      }
    },
    save(preferences: Partial<BgmPreferences>) {
      storage.setItem(
        BGM_PREFERENCES_KEY,
        JSON.stringify({ ...this.load(), ...preferences }),
      );
    },
  };
}
