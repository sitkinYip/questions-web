import type { GameClue } from "../../api/game.contracts";
import type { MultiQuestClue, QuestClue } from "../../domain/quest/types";

interface ClueSelection {
  assignmentId: string;
  totalLevels: number;
  sessionLevel?: string;
  levelOrder?: readonly string[];
}

function sourceOf(clue: GameClue) {
  // In-memory query data can briefly outlive a coordinated API rollout.
  return clue.source ?? "session";
}

function compareText(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function levelPositions(levelOrder: readonly string[]) {
  return new Map(levelOrder.map((id, index) => [id, index]));
}

export function compareClues(
  left: GameClue,
  right: GameClue,
  levels = new Map<string, number>(),
) {
  const source =
    (sourceOf(left) === "session" ? 0 : 1) -
    (sourceOf(right) === "session" ? 0 : 1);
  if (source) return source;
  if (sourceOf(left) === "question") {
    const leftLevel = levels.get(left.sessionLevel) ?? Number.MAX_SAFE_INTEGER;
    const rightLevel =
      levels.get(right.sessionLevel) ?? Number.MAX_SAFE_INTEGER;
    if (leftLevel !== rightLevel) return leftLevel - rightLevel;
  }
  if (left.position !== right.position) return left.position - right.position;
  const definition = compareText(
    left.definitionId || left.id,
    right.definitionId || right.id,
  );
  return definition || compareText(left.id, right.id);
}

export function isCombinationClue(clue: GameClue, totalLevels: number) {
  return (
    sourceOf(clue) === "session" &&
    totalLevels > 1 &&
    clue.trigger === "session_completed" &&
    !clue.sessionLevel &&
    clue.kind === "text"
  );
}

export function clueBelongsToLevel(clue: GameClue, sessionLevel: string) {
  if (sourceOf(clue) === "question")
    return Boolean(clue.sessionLevel) && clue.sessionLevel === sessionLevel;
  return !clue.sessionLevel || clue.sessionLevel === sessionLevel;
}

export function selectGameClues(
  clues: readonly GameClue[],
  totalLevels: number,
  sessionLevel?: string,
  levelOrder: readonly string[] = [],
) {
  const levels = levelPositions(levelOrder);
  return clues
    .filter(
      (clue) =>
        !isCombinationClue(clue, totalLevels) &&
        (!sessionLevel || clueBelongsToLevel(clue, sessionLevel)),
    )
    .toSorted((left, right) => compareClues(left, right, levels));
}

export function clueView(clue: GameClue, assignmentId: string): QuestClue {
  const narrative = clue.kind === "letter" || clue.kind === "bless";
  return {
    id: clue.id,
    kind: clue.kind as QuestClue["kind"],
    title: clue.content.title || undefined,
    content: clue.content.text,
    autoPlay: clue.autoPlay,
    url: clue.content.url || undefined,
    imageUrls: clue.content.imageUrls,
    tips: clue.content.tips,
    href: narrative
      ? `/play/${assignmentId}/content/${clue.narrative}`
      : clue.content.url || undefined,
    linkTarget: narrative ? "internal" : "external",
  };
}

export function selectClueViews(
  clues: readonly GameClue[],
  selection: ClueSelection,
) {
  return selectGameClues(
    clues,
    selection.totalLevels,
    selection.sessionLevel,
    selection.levelOrder,
  ).map((clue) => clueView(clue, selection.assignmentId));
}

export function combinationView(clue: GameClue): MultiQuestClue {
  return {
    id: clue.id,
    qas: "",
    revision: clue.unlockedAt,
    title: clue.content.title,
    content: clue.content.text,
    buttonText: clue.content.buttonText,
    description: clue.content.description,
  };
}

export function selectCombinationClues(
  clues: readonly GameClue[],
  totalLevels: number,
) {
  return clues
    .filter((clue) => isCombinationClue(clue, totalLevels))
    .toSorted(compareClues);
}

export function selectExplicitEffectClues(
  clues: readonly GameClue[],
  effects: readonly { type: "clue"; clueId: string }[] | undefined,
  levelOrder: readonly string[] = [],
) {
  if (effects === undefined) return undefined;
  const clueIds = new Set(
    effects
      .filter((effect) => effect.type === "clue")
      .map((effect) => effect.clueId),
  );
  const levels = levelPositions(levelOrder);
  return clues
    .filter((clue) => clueIds.has(clue.id))
    .toSorted((left, right) => compareClues(left, right, levels));
}
