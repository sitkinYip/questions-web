import { describe, expect, it } from "vitest";
import type { Quest } from "@/domain/quest/types";
import {
  createProgressRepository,
  legacyCompletionKey,
  legacyPenaltyKey,
  progressKey,
  type KeyValueStorage,
} from "@/infrastructure/storage/progress.repository";

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

const quest: Quest = {
  id: "level-record-id",
  step: 3,
  revision: "revision",
  kind: "choice",
  prompt: "question",
  content: [],
  clues: [],
  acceptedAnswers: ["A"],
  options: [],
  penaltyDurationsMs: [],
  autoNext: false,
  isFinal: false,
};

describe("progress repository", () => {
  it("migrates a legacy completion record to the versioned key", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      legacyCompletionKey(quest, "alice"),
      JSON.stringify({ type: "bingo", date: 123, input: "A" }),
    );
    const attempt = createProgressRepository(storage).load(quest, "alice");
    expect(attempt).toMatchObject({
      status: "completed",
      completedAt: 123,
      input: "A",
    });
    expect(storage.getItem(progressKey(quest, "alice"))).not.toBeNull();
  });

  it("migrates a legacy penalty record", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      legacyPenaltyKey(quest, "alice"),
      JSON.stringify({ wrongCount: 2, penaltyEndTime: -1 }),
    );
    expect(
      createProgressRepository(storage).load(quest, "alice"),
    ).toMatchObject({ status: "penalized", wrongCount: 2, penaltyEndsAt: -1 });
  });
});
