import { describe, expect, it } from "vitest";
import {
  createNotificationLauncherPositionRepository,
  createNotificationSeenRepository,
  NOTIFICATION_LAUNCHER_POSITION_KEY,
  NOTIFICATION_SEEN_IDS_KEY,
} from "./notification.repository";

describe("notification seen repository", () => {
  it("uses the legacy key and preserves existing seen ids", () => {
    const values = new Map([[NOTIFICATION_SEEN_IDS_KEY, '["old"]']]);
    const repository = createNotificationSeenRepository({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });

    expect([...repository.load()]).toEqual(["old"]);
    repository.markSeen("new");
    expect(JSON.parse(values.get(NOTIFICATION_SEEN_IDS_KEY) ?? "[]")).toEqual([
      "old",
      "new",
    ]);
  });

  it("recovers from malformed legacy data", () => {
    const repository = createNotificationSeenRepository({
      getItem: () => "not-json",
      setItem: () => undefined,
    });
    expect(repository.load().size).toBe(0);
  });
});

describe("notification launcher position repository", () => {
  it("persists and restores a valid floating position", () => {
    const values = new Map<string, string>();
    const repository = createNotificationLauncherPositionRepository({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });

    repository.save({ x: 1, y: 0.42 });

    expect(repository.load()).toEqual({ x: 1, y: 0.42 });
    expect(values.has(NOTIFICATION_LAUNCHER_POSITION_KEY)).toBe(true);
  });

  it("ignores malformed or out-of-bounds positions", () => {
    const repository = createNotificationLauncherPositionRepository({
      getItem: () => '{"x":2,"y":0.4}',
      setItem: () => undefined,
    });

    expect(repository.load()).toBeNull();
  });
});
