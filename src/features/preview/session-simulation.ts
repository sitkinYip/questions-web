import type { GameAssignment, GameClueEffect } from "@/api/game.contracts";
export type SessionStage = "brief" | "play" | "completed";
export interface SessionBookmark {
  stage: SessionStage;
  levelId: string;
}
const time = "2026-01-01T00:00:00.000Z";
/** Pure, disposable display simulation. Never judges answers, awards XP or grants access. */
export function sessionSnapshot(
  definition: GameAssignment,
  stage: SessionStage,
  completed: ReadonlySet<string>,
  manual: ReadonlySet<string>,
  wrong: Record<string, number> = {},
): GameAssignment {
  const currentIndex = Math.max(
    0,
    definition.levels.findIndex((l) => !completed.has(l.id)),
  );
  const finished =
    stage === "completed" ||
    (stage === "play" &&
      definition.levels.length > 0 &&
      completed.size === definition.levels.length);
  const clues = definition.clues
    .filter(
      (c) =>
        stage !== "brief" &&
        (c.trigger === "start" ||
          (c.trigger === "session_completed" && finished) ||
          ((c.trigger === "level_completed" ||
            c.trigger === "question_completed") &&
            completed.has(c.sessionLevel)) ||
          (c.trigger === "manual" && manual.has(c.id))),
    )
    .map((c) => ({ ...c, unlockedAt: time }));
  return {
    ...definition,
    status: stage === "brief" ? "assigned" : finished ? "completed" : "active",
    startedAt: stage === "brief" ? "" : time,
    completedAt: finished ? time : "",
    completedLevels: completed.size,
    currentIndex,
    clues,
    levels: definition.levels.map((l, index) => ({
      ...l,
      question:
        finished || index <= currentIndex || completed.has(l.id)
          ? l.question
          : null,
      completedAt: completed.has(l.id) ? time : "",
      wrongCount: wrong[l.id] || 0,
    })),
  };
}
export function initialSessionSimulation(
  definition: GameAssignment,
  bookmark: SessionBookmark,
) {
  const index = Math.max(
    0,
    definition.levels.findIndex((l) => l.id === bookmark.levelId),
  );
  const completed = new Set(
    definition.levels
      .filter(
        (_, i) =>
          bookmark.stage === "completed" ||
          (bookmark.stage === "play" && i < index),
      )
      .map((l) => l.id),
  );
  return { index, completed };
}
export function newlyVisibleEffects(
  before: GameAssignment,
  after: GameAssignment,
): GameClueEffect[] {
  const known = new Set(before.clues.map((c) => c.id));
  return after.clues
    .filter((c) => !known.has(c.id))
    .map((c) => ({ type: "clue", clueId: c.id, autoPlay: c.autoPlay }));
}
