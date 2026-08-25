import { describe, expect, it } from "vitest";
import {
  createNotificationSeenRepository,
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
