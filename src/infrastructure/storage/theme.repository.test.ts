import { describe, expect, it } from "vitest";
import {
  createThemePreferencesRepository,
  THEME_PREFERENCES_KEY,
} from "./theme.repository";

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
    expect(THEME_PREFERENCES_KEY).toBe("questions:v1:theme");
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
