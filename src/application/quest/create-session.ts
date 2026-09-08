import { createQuestSession } from "@/domain/quest/session";
import type { Quest, QuestAttempt, QuestSession } from "@/domain/quest/types";

export interface SessionCreationResult {
  session: QuestSession | null;
  missingSteps: number[];
}

export function selectQuestsByStep(
  allQuests: readonly Quest[],
  requestedSteps: readonly number[],
): { quests: Quest[]; missingSteps: number[] } {
  const byStep = new Map(allQuests.map((quest) => [quest.step, quest]));
  const seen = new Set<number>();
  const quests: Quest[] = [];
  const missingSteps: number[] = [];

  for (const step of requestedSteps) {
    if (seen.has(step)) continue;
    seen.add(step);
    const quest = byStep.get(step);
    if (quest) quests.push(quest);
    else missingSteps.push(step);
  }

  return { quests, missingSteps };
}

export function createSessionFromSelection(input: {
  allQuests: readonly Quest[];
  requestedSteps: readonly number[];
  userId: string;
  restore: (quest: Quest, userId: string) => QuestAttempt;
}): SessionCreationResult {
  const { quests, missingSteps } = selectQuestsByStep(
    input.allQuests,
    input.requestedSteps,
  );
  if (quests.length === 0) return { session: null, missingSteps };

  const restoredAttempts = Object.fromEntries(
    quests.map((quest) => [quest.id, input.restore(quest, input.userId)]),
  );
  const signature = quests
    .map((quest) => `${quest.step}@${quest.revision}`)
    .join(",");

  return {
    missingSteps,
    session: createQuestSession({
      sessionId: `${input.userId}:${signature}`,
      userId: input.userId,
      quests,
      restoredAttempts,
    }),
  };
}
