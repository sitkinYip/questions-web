import { describe, expect, it } from "vitest";
import {
  BGM_PREFERENCES_KEY,
  createBgmPreferencesRepository,
} from "@/infrastructure/storage/audio.repository";

describe("BGM preferences repository", () => {
  it("migrates playback and position without resetting the user's preference", () => {
    const preferences = { enabled: false, position: { x: 0.2, y: 0.7 } };
    const values = new Map([["questions:v1:bgm", JSON.stringify(preferences)]]);
    const repository = createBgmPreferencesRepository({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    expect(repository.load()).toEqual(preferences);
    expect(JSON.parse(values.get(BGM_PREFERENCES_KEY) ?? "null")).toEqual(
      preferences,
    );
  });

  it("defaults to enabled and persists an explicit pause", () => {
    const values = new Map<string, string>();
    const repository = createBgmPreferencesRepository({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });

    expect(repository.load()).toEqual({ enabled: true });
    repository.save({ enabled: false });
    expect(JSON.parse(values.get(BGM_PREFERENCES_KEY) ?? "{}")).toEqual({
      enabled: false,
    });
    expect(repository.load()).toEqual({ enabled: false });
  });

  it("persists floating position without losing playback preference", () => {
    const values = new Map<string, string>();
    const repository = createBgmPreferencesRepository({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });

    repository.save({ enabled: false });
    repository.save({ position: { x: 0.25, y: 0.4 } });
    expect(repository.load()).toEqual({
      enabled: false,
      position: { x: 0.25, y: 0.4 },
    });
  });

  it("recovers safely from malformed preferences", () => {
    const repository = createBgmPreferencesRepository({
      getItem: () => "broken",
      setItem: () => undefined,
    });
    expect(repository.load()).toEqual({ enabled: true });
  });
});
