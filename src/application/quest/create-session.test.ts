import { describe, expect, it, vi } from "vitest";
import { createEmptyAttempt } from "../../domain/quest/session";
import type { Quest } from "../../domain/quest/types";
import {
  createSessionFromSelection,
  selectQuestsByStep,
} from "./create-session";

const quest = (step: number): Quest => ({
  id: `quest-${step}`,
  step,
  revision: "r1",
  kind: "text",
  prompt: `Question ${step}`,
  content: [],
  clues: [],
  acceptedAnswers: ["answer"],
  options: [],
  penaltyDurationsMs: [],
  autoNext: false,
  isFinal: false,
});

describe("session creation", () => {
  it("preserves requested order, reports missing steps and removes duplicates", () => {
    const result = selectQuestsByStep(
      [quest(1), quest(2), quest(3)],
      [3, 9, 1, 3],
    );
    expect(result.quests.map((item) => item.step)).toEqual([3, 1]);
    expect(result.missingSteps).toEqual([9]);
  });

  it("restores each attempt before creating the session", () => {
    const restore = vi.fn((item: Quest) => createEmptyAttempt(item.id));
    const result = createSessionFromSelection({
      allQuests: [quest(1), quest(2)],
      requestedSteps: [2, 1],
      userId: "alice",
      restore,
    });

    expect(result.session?.quests.map((item) => item.step)).toEqual([2, 1]);
    expect(restore).toHaveBeenCalledTimes(2);
  });

  it("opens a restored multi-quest session at the first incomplete quest", () => {
    const restore = vi.fn((item: Quest) => ({
      ...createEmptyAttempt(item.id),
      status: item.step < 3 ? ("completed" as const) : ("unanswered" as const),
      completedAt: item.step < 3 ? 100 : null,
    }));
    const result = createSessionFromSelection({
      allQuests: [quest(1), quest(2), quest(3)],
      requestedSteps: [1, 2, 3],
      userId: "alice",
      restore,
    });

    expect(result.session?.activeIndex).toBe(2);
    expect(result.session?.status).toBe("active");
  });
});
