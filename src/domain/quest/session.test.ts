import { describe, expect, it } from "vitest";
import {
  createQuestSession,
  getCompletionTransition,
  submitAnswer,
} from "./session";
import type { Quest } from "./types";

const makeQuest = (overrides: Partial<Quest> = {}): Quest => ({
  id: "quest-1",
  step: 1,
  revision: "2026-08-24",
  kind: "text",
  prompt: "答案是什么？",
  content: [],
  clues: [],
  acceptedAnswers: ["星辰，大海"],
  options: [],
  penaltyDurationsMs: [],
  autoNext: false,
  isFinal: false,
  ...overrides,
});

describe("QuestSession", () => {
  it("treats one and many quests as the same session model", () => {
    const single = createQuestSession({
      sessionId: "single",
      quests: [makeQuest()],
    });
    const multiple = createQuestSession({
      sessionId: "multiple",
      quests: [makeQuest(), makeQuest({ id: "quest-2", step: 2 })],
    });

    expect(single.quests).toHaveLength(1);
    expect(multiple.quests).toHaveLength(2);
    expect(single.activeIndex).toBe(0);
    expect(multiple.activeIndex).toBe(0);
  });

  it("normalizes punctuation, spaces, width and case when checking text answers", () => {
    const session = createQuestSession({
      sessionId: "s",
      quests: [makeQuest()],
    });
    const result = submitAnswer(session, "quest-1", "  星辰 大海  ", 100);

    expect(result.type).toBe("correct");
    expect(result.session.status).toBe("completed");
  });

  it("does not penalize incorrect text answers", () => {
    const session = createQuestSession({
      sessionId: "s",
      quests: [makeQuest()],
    });
    const result = submitAnswer(session, "quest-1", "错误答案", 100);

    expect(result.type).toBe("incorrect");
    if (result.type !== "incorrect") return;
    expect(result.attempt.wrongCount).toBe(0);
    expect(result.attempt.penaltyEndsAt).toBeNull();
  });

  it("applies configured penalties to choice questions", () => {
    const quest = makeQuest({
      kind: "choice",
      acceptedAnswers: ["B"],
      penaltyDurationsMs: [1_000, -1],
    });
    const session = createQuestSession({ sessionId: "s", quests: [quest] });
    const first = submitAnswer(session, quest.id, "A", 10_000);

    expect(first.type).toBe("incorrect");
    if (first.type !== "incorrect") return;
    expect(first.attempt.penaltyEndsAt).toBe(11_000);

    const second = submitAnswer(first.session, quest.id, "A", 11_001);
    expect(second.type).toBe("incorrect");
    if (second.type !== "incorrect") return;
    expect(second.attempt.penaltyEndsAt).toBe(-1);
  });

  it("plans auto advancement without switching before UI effects finish", () => {
    const quests = [
      makeQuest({ autoNext: true }),
      makeQuest({ id: "quest-2", step: 2 }),
    ];
    const start = createQuestSession({ sessionId: "s", quests });
    const first = submitAnswer(start, "quest-1", "星辰大海", 100);
    const second = submitAnswer(first.session, "quest-2", "星辰大海", 200);

    expect(first.session.activeIndex).toBe(0);
    expect(getCompletionTransition(first.session, "quest-1")).toEqual({
      type: "auto",
      targetIndex: 1,
    });
    expect(second.session.status).toBe("completed");
    expect(getCompletionTransition(second.session, "quest-2")).toEqual({
      type: "complete",
    });
  });

  it("blocks submissions outside the availability window", () => {
    const quest = makeQuest({ startsAt: 200, endsAt: 300 });
    const session = createQuestSession({ sessionId: "s", quests: [quest] });

    expect(submitAnswer(session, quest.id, "星辰大海", 100)).toMatchObject({
      type: "blocked",
      reason: "not-started",
    });
    expect(submitAnswer(session, quest.id, "星辰大海", 300)).toMatchObject({
      type: "blocked",
      reason: "ended",
    });
  });
});
