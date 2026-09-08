import { describe, expect, it } from "vitest";
import {
  clearRecordPenalty,
  deleteLocalRecords,
  matchesLocalRecordFilter,
  scanLocalQuestionRecords,
  type EnumerableStorage,
} from "@/infrastructure/storage/record-manager";

class MemoryStorage implements EnumerableStorage {
  readonly values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
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

const attempt = {
  questId: "quest-11",
  status: "penalized" as const,
  input: "A",
  wrongCount: 2,
  penaltyEndsAt: -1,
  completedAt: null,
};

describe("local Questions record manager", () => {
  it("scans current and legacy records while ignoring unrelated origin data", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "questions:v1:attempt:alice:11:2026-08-24 12:00:00.000Z",
      JSON.stringify({ version: 1, attempt }),
    );
    storage.setItem(
      "qaIndex11alice2026-08-24 12:00:00.000Z",
      JSON.stringify({ type: "bingo", date: 10, input: "answer" }),
    );
    storage.setItem(
      "qa_penalty_11_alice_2026-08-24 12:00:00.000Z",
      JSON.stringify({ wrongCount: 1, penaltyEndTime: 20 }),
    );
    storage.setItem("rankUpShown_alice_gold", "1");
    storage.setItem("notification_seen_ids", "[]");
    storage.setItem("letter_records_cache", "[]");
    storage.setItem("questions:v1:bgm", '{"enabled":false}');
    storage.setItem("another-app-token", "keep");

    const records = scanLocalQuestionRecords(storage, [
      { step: 11, revision: "2026-08-24 12:00:00.000Z" },
    ]);

    expect(records).toHaveLength(7);
    expect(
      records.find((record) => record.kind === "legacy-completion"),
    ).toMatchObject({
      step: 11,
      userId: "alice",
      isCorrupt: false,
    });
    expect(records.some((record) => record.key === "another-app-token")).toBe(
      false,
    );
    expect(
      records.find((record) => record.kind === "audio-preference"),
    ).toMatchObject({ format: "current", isCorrupt: false });
  });

  it("filters by penalty, step and user", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "questions:v1:attempt:alice:11:r1",
      JSON.stringify({ version: 1, attempt }),
    );
    storage.setItem(
      "questions:v1:attempt:bob:12:r2",
      JSON.stringify({
        version: 1,
        attempt: {
          ...attempt,
          questId: "quest-12",
          status: "completed",
          penaltyEndsAt: null,
        },
      }),
    );
    const records = scanLocalQuestionRecords(storage);

    expect(
      records.filter((record) =>
        matchesLocalRecordFilter(record, {
          kind: "penalty",
          step: 11,
          userId: "alice",
        }),
      ),
    ).toHaveLength(1);
  });

  it("clears a current penalty without deleting completion data", () => {
    const storage = new MemoryStorage();
    const key = "questions:v1:attempt:alice:11:r1";
    storage.setItem(key, JSON.stringify({ version: 1, attempt }));
    const [record] = scanLocalQuestionRecords(storage);

    expect(clearRecordPenalty(storage, record)).toBe(true);
    expect(JSON.parse(storage.getItem(key) ?? "{}").attempt).toMatchObject({
      status: "incorrect",
      penaltyEndsAt: null,
      wrongCount: 2,
    });
  });

  it("deletes only explicit keys", () => {
    const storage = new MemoryStorage();
    storage.setItem("notification_seen_ids", "[]");
    storage.setItem("another-app-token", "keep");

    deleteLocalRecords(storage, ["notification_seen_ids"]);
    expect(storage.getItem("notification_seen_ids")).toBeNull();
    expect(storage.getItem("another-app-token")).toBe("keep");
  });
});
