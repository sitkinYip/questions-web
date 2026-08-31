import { describe, expect, it } from "vitest";
import { makeAssignment, makePlayer } from "../test/game-fixtures";
import {
  gameAnswerSchema,
  gameAssignmentSchema,
  gameClueSchema,
} from "./game.schema";

const content = {
  title: "线索",
  text: "正文",
  url: "",
  imageUrls: [],
  buttonText: "查看",
};

describe("game clue contract", () => {
  it("accepts question-scoped clues with their concrete session level", () => {
    expect(
      gameClueSchema.parse({
        id: "assignment-clue",
        source: "question",
        definitionId: "common-clue",
        question: "question-1",
        sessionLevel: "session-level-1",
        trigger: "question_completed",
        kind: "text",
        position: 1,
        narrative: "",
        autoPlay: true,
        unlockedAt: "2026-08-31T00:00:00Z",
        content,
      }),
    ).toMatchObject({
      source: "question",
      definitionId: "common-clue",
      question: "question-1",
      sessionLevel: "session-level-1",
    });
  });

  it("normalizes the real legacy session-clue DTO during a rolling deploy", () => {
    expect(
      gameClueSchema.parse({
        id: "legacy-clue",
        sessionLevel: "session-level-1",
        trigger: "level_completed",
        kind: "text",
        position: 0,
        narrative: "",
        autoPlay: false,
        unlockedAt: "2026-08-30T00:00:00Z",
        content,
      }),
    ).toMatchObject({
      id: "legacy-clue",
      source: "session",
      definitionId: "legacy-clue",
      question: "",
    });
  });

  it.each(["letter", "bless"])(
    "rejects %s narratives as common question clues",
    (kind) => {
      expect(
        gameClueSchema.safeParse({
          id: "common-narrative",
          source: "question",
          definitionId: "common-narrative",
          question: "question-1",
          sessionLevel: "session-level-1",
          trigger: "question_completed",
          kind,
          position: 0,
          narrative: "narrative-1",
          autoPlay: false,
          unlockedAt: "2026-08-30T00:00:00Z",
          content,
        }).success,
      ).toBe(false);
    },
  );
});

describe("game answer effects", () => {
  const assignment = {
    ...makeAssignment({ totalLevels: 0, completedLevels: 0 }),
    presentation: {},
    completionTarget: null,
    currentIndex: 0,
    clues: [],
    levels: [],
    serverTime: "2026-08-31T00:00:00Z",
  };
  const base = {
    result: "correct",
    xpDelta: 0,
    rewardIds: [],
    assignment,
    player: makePlayer(),
  };

  it("keeps effects optional for old answer responses", () => {
    expect(gameAnswerSchema.parse(base).effects).toBeUndefined();
  });

  it("validates explicit clue effects", () => {
    expect(
      gameAnswerSchema.parse({
        ...base,
        effects: [{ type: "clue", clueId: "assignment-clue", autoPlay: true }],
      }).effects,
    ).toEqual([{ type: "clue", clueId: "assignment-clue", autoPlay: true }]);
  });
});

describe("game start transition effects", () => {
  const assignment = {
    ...makeAssignment({ totalLevels: 0, completedLevels: 0 }),
    presentation: {},
    completionTarget: null,
    currentIndex: 0,
    clues: [],
    levels: [],
    serverTime: "2026-08-31T00:00:00Z",
  };

  it("keeps transition effects optional for an old server", () => {
    expect(
      gameAssignmentSchema.parse(assignment).transitionEffects,
    ).toBeUndefined();
  });

  it("validates the start-time autoplay snapshot", () => {
    expect(
      gameAssignmentSchema.parse({
        ...assignment,
        transitionEffects: [
          { type: "clue", clueId: "start-clue", autoPlay: false },
        ],
      }).transitionEffects,
    ).toEqual([{ type: "clue", clueId: "start-clue", autoPlay: false }]);
  });
});
