import { describe, expect, it } from "vitest";
import {
  createQuestAnswerGuideRepository,
  questAnswerGuideKey,
} from "./quest-guide.repository";

describe("quest answer guide repository", () => {
  it("marks the guide as seen per user", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const repository = createQuestAnswerGuideRepository(storage);

    expect(questAnswerGuideKey("alice:bob")).toBe(
      "questions:v1:quest-answer-guide:alice%3Abob",
    );
    expect(repository.hasSeen("alice")).toBe(false);
    repository.markSeen("alice");
    expect(repository.hasSeen("alice")).toBe(true);
    expect(repository.hasSeen("bob")).toBe(false);
  });
});
