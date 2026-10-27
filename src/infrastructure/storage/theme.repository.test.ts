import { describe, expect, it } from "vitest";
import {
  createThemePreferencesRepository,
  THEME_PREFERENCES_KEY,
} from "@/infrastructure/storage/theme.repository";

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
    read: () => value,
  };
}

describe("theme preferences repository", () => {
  it("preserves an existing Questions theme preference under the new namespace", () => {
    const values = new Map([
      [
        "questions:v1:theme",
        JSON.stringify({ version: 1, preference: "light" }),
      ],
    ]);
    const repository = createThemePreferencesRepository({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    expect(repository.load()).toBe("light");
    expect(values.get(THEME_PREFERENCES_KEY)).toBe(
      values.get("questions:v1:theme"),
    );
  });

  it("defaults invalid or missing state to the system preference", () => {
    expect(createThemePreferencesRepository(memoryStorage()).load()).toBe(
      "system",
    );
    expect(
      createThemePreferencesRepository(memoryStorage("not-json")).load(),
    ).toBe("system");
    expect(
      createThemePreferencesRepository(
        memoryStorage(JSON.stringify({ version: 2, preference: "light" })),
      ).load(),
    ).toBe("system");
  });

  it("stores a versioned application-wide preference", () => {
    const storage = memoryStorage();
    const repository = createThemePreferencesRepository(storage);
    repository.save("light");

    expect(JSON.parse(storage.read() ?? "null")).toEqual({
      version: 1,
      preference: "light",
    });
    expect(repository.load()).toBe("light");
    expect(THEME_PREFERENCES_KEY).toBe("starward:v1:theme");
  });

  it("keeps working when browser storage is unavailable", () => {
    const repository = createThemePreferencesRepository({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });

    expect(repository.load()).toBe("system");
    expect(() => repository.save("dark")).not.toThrow();
  });
});
