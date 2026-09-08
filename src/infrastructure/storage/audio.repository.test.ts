import { describe, expect, it } from "vitest";
import {
  BGM_PREFERENCES_KEY,
  createBgmPreferencesRepository,
} from "@/infrastructure/storage/audio.repository";

describe("BGM preferences repository", () => {
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
