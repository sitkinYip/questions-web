import { describe, expect, it } from "vitest";
import type { GameClue } from "@/api/game.contracts";
import {
  isCombinationClue,
  selectClueViews,
  selectCombinationClues,
  selectExplicitEffectClues,
  selectGameClues,
} from "@/features/game/clue-presentation";

function clue(overrides: Partial<GameClue> = {}): GameClue {
  const id = overrides.id || "session-clue";
  const source = overrides.source || "session";
  return {
    id,
    source,
    definitionId: id,
    question: "",
    sessionLevel: "step-1",
    trigger:
      overrides.trigger ||
      (source === "question" ? "question_completed" : "level_completed"),
    kind: "text",
    position: 0,
    narrative: "",
    autoPlay: false,
    unlockedAt: "2026-08-31T00:00:00Z",
    content: {
      title: id,
      text: `${id} content`,
      url: "",
      imageUrls: [],
      buttonText: "",
    },
    ...overrides,
  };
}

describe("clue presentation selection", () => {
  it("orders session clues before question clues with stable local ordering", () => {
    const input = [
      clue({
        id: "question-b",
        source: "question",
        definitionId: "question-b",
        question: "question-1",
        position: 1,
      }),
      clue({ id: "session-b", position: 2 }),
      clue({
        id: "question-a",
        source: "question",
        definitionId: "question-a",
        question: "question-1",
        position: 1,
      }),
      clue({ id: "session-a", position: 0 }),
    ];

    expect(selectGameClues(input, 2).map((item) => item.id)).toEqual([
      "session-a",
      "session-b",
      "question-a",
      "question-b",
    ]);
    expect(input.map((item) => item.id)).toEqual([
      "question-b",
      "session-b",
      "question-a",
      "session-a",
    ]);
  });

  it("keeps each question's clues together in session-level order", () => {
    const input = [
      clue({
        id: "second-question-0",
        source: "question",
        definitionId: "a-second",
        question: "question-2",
        sessionLevel: "step-2",
        position: 0,
      }),
      clue({
        id: "first-question-1",
        source: "question",
        definitionId: "z-first-1",
        question: "question-1",
        sessionLevel: "step-1",
        position: 1,
      }),
      clue({
        id: "first-question-0",
        source: "question",
        definitionId: "z-first-0",
        question: "question-1",
        sessionLevel: "step-1",
        position: 0,
      }),
    ];

    expect(
      selectGameClues(input, 2, undefined, ["step-1", "step-2"]).map(
        (item) => item.id,
      ),
    ).toEqual(["first-question-0", "first-question-1", "second-question-0"]);
  });

  it("only shows a question clue on its concrete session level", () => {
    const clues = [
      clue({ id: "global-session", sessionLevel: "" }),
      clue({ id: "step-session", sessionLevel: "step-1" }),
      clue({
        id: "question-step-1",
        source: "question",
        definitionId: "common-1",
        question: "question-1",
        sessionLevel: "step-1",
      }),
      clue({
        id: "question-step-2",
        source: "question",
        definitionId: "common-2",
        question: "question-2",
        sessionLevel: "step-2",
      }),
      clue({
        id: "unbound-question",
        source: "question",
        definitionId: "bad-common",
        question: "question-1",
        sessionLevel: "",
      }),
    ];

    expect(
      selectClueViews(clues, {
        assignmentId: "assignment-1",
        totalLevels: 2,
        sessionLevel: "step-1",
      }).map((item) => item.id),
    ).toEqual(["global-session", "step-session", "question-step-1"]);
  });

  it("never classifies a question clue as a session combination", () => {
    const session = clue({
      id: "combination",
      sessionLevel: "",
      trigger: "session_completed",
    });
    const question = clue({
      id: "common-at-completion",
      source: "question",
      definitionId: "common-at-completion",
      question: "question-1",
      sessionLevel: "step-1",
      trigger: "session_completed",
    });

    expect(isCombinationClue(session, 2)).toBe(true);
    expect(isCombinationClue(question, 2)).toBe(false);
    expect(selectCombinationClues([question, session], 2)).toEqual([session]);
  });

  it("uses explicit answer effects as an allowlist and treats an empty list as final", () => {
    const old = clue({ id: "old" });
    const current = clue({ id: "current", position: 1 });

    expect(
      selectExplicitEffectClues([old, current], undefined),
    ).toBeUndefined();
    expect(selectExplicitEffectClues([old, current], [])).toEqual([]);
    expect(
      selectExplicitEffectClues(
        [old, current],
        [{ type: "clue", clueId: "current" }],
      ),
    ).toEqual([current]);
  });
});
