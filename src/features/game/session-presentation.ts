import type {
  GameAssignment,
  GameClue,
  GameClueEffect,
  GamePresentation,
} from "@/api/game.contracts";
import type { QuestFinalDestination } from "@/domain/quest/types";
import type { PresentationStep } from "./useGamePresentation";
import {
  clueBelongsToLevel,
  clueView,
  combinationView,
  compareClues,
  isCombinationClue,
  selectExplicitEffectClues,
} from "./clue-presentation";
function fallbackAnswerClues(
  previous: readonly GameClue[],
  current: readonly GameClue[],
  sessionLevel: string,
) {
  const known = new Set(previous.map((clue) => clue.id));
  return current
    .filter(
      (clue) => !known.has(clue.id) && clueBelongsToLevel(clue, sessionLevel),
    )
    .toSorted(compareClues);
}
function destinationView(
  assignment: GameAssignment,
): QuestFinalDestination | null {
  const target = assignment.completionTarget;
  return target?.kind === "narrative"
    ? {
        href: `/play/${assignment.id}/content/${target.id}`,
        target: "internal",
      }
    : target?.kind === "link"
      ? { href: target.url, target: "external" }
      : null;
}
export function resolveLevelPresentation(
  assignment: GameAssignment,
  override?: GamePresentation,
) {
  const bgmUrl =
    override?.bgmMode === "silent"
      ? undefined
      : override?.bgmMode === "custom"
        ? override.bgmUrl
        : assignment.presentation.bgmMode === "silent"
          ? undefined
          : assignment.presentation.bgmUrl;
  const background =
    override?.backgroundMode === "none"
      ? undefined
      : override?.backgroundMode === "custom"
        ? override.backgroundUrl
        : override?.backgroundUrl ||
          (assignment.presentation.backgroundMode === "none"
            ? undefined
            : assignment.presentation.backgroundUrl);
  return {
    bgmUrl,
    background,
    hideTitle: override?.hideTitle ?? assignment.presentation.hideTitle,
  };
}
export function startPresentationSteps(
  previous: GameAssignment,
  value: GameAssignment,
): PresentationStep[] {
  const explicit = selectExplicitEffectClues(
    value.clues,
    value.transitionEffects,
    value.levels.map((level) => level.id),
  );
  const known = new Set(previous.clues.map((clue) => clue.id));
  const unlocked =
    explicit ??
    value.clues.filter((clue) => !known.has(clue.id)).toSorted(compareClues);
  const effectAutoPlay =
    value.transitionEffects === undefined
      ? null
      : new Map(
          value.transitionEffects.map((effect) => [
            effect.clueId,
            effect.autoPlay,
          ]),
        );
  return unlocked
    .filter(
      (clue) =>
        (effectAutoPlay?.get(clue.id) ?? clue.autoPlay) &&
        !isCombinationClue(clue, value.totalLevels),
    )
    .map((clue) => ({ type: "clue", clue: clueView(clue, value.id) }));
}
export function answerPresentationSteps(
  previous: GameAssignment,
  settled: GameAssignment,
  stepId: string,
  effects?: GameClueEffect[],
): PresentationStep[] {
  const completed = settled.status === "completed";
  const settledStep = settled.levels.find((level) => level.id === stepId);
  const explicit = selectExplicitEffectClues(
    settled.clues,
    effects,
    settled.levels.map((level) => level.id),
  );
  const unlocked =
    explicit ?? fallbackAnswerClues(previous.clues, settled.clues, stepId);
  const effectAutoPlay =
    effects === undefined
      ? null
      : new Map(effects.map((effect) => [effect.clueId, effect.autoPlay]));
  const automatic = unlocked.filter(
    (clue) =>
      (effectAutoPlay?.get(clue.id) ?? clue.autoPlay) &&
      !isCombinationClue(clue, settled.totalLevels),
  );
  const sequence: PresentationStep[] = automatic.map((clue) => ({
    type: "clue",
    clue: clueView(clue, settled.id),
  }));
  const finale = completed && settled.presentation.completionStyle === "finale";
  if (finale) sequence.unshift({ type: "completion", variant: "final" });
  else if (completed && settled.totalLevels > 1)
    sequence.push({ type: "completion", variant: "multi" });
  if (completed) {
    for (const clue of unlocked.filter((clue) =>
      isCombinationClue(clue, settled.totalLevels),
    ))
      sequence.push({ type: "combination", clue: combinationView(clue) });
    const destination = destinationView(settled);
    if (finale && destination)
      sequence.push({ type: "destination", destination });
  } else if (settledStep?.autoNext)
    sequence.push({
      type: "advance",
      index: settled.currentIndex,
      delay: automatic.length ? 0 : 1500,
    });

  return sequence;
}
