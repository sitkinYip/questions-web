import { isAcceptedAnswer } from "@/domain/quest/answer";
import type {
  Quest,
  QuestAttempt,
  QuestAvailability,
  QuestCompletionTransition,
  QuestSession,
  SubmitAnswerResult,
} from "@/domain/quest/types";

const DEFAULT_PENALTIES = [3 * 60 * 1000, -1] as const;

export function getQuestAvailability(
  quest: Quest,
  now: number,
): QuestAvailability {
  if (quest.startsAt !== undefined && now < quest.startsAt) {
    return { status: "not-started", startsAt: quest.startsAt };
  }
  if (quest.endsAt !== undefined && now >= quest.endsAt) {
    return { status: "ended", endedAt: quest.endsAt };
  }
  return { status: "available" };
}

export function createEmptyAttempt(questId: string): QuestAttempt {
  return {
    questId,
    status: "unanswered",
    input: "",
    wrongCount: 0,
    penaltyEndsAt: null,
    completedAt: null,
  };
}

export function createQuestSession(input: {
  sessionId: string;
  userId?: string;
  quests: readonly Quest[];
  restoredAttempts?: Readonly<Record<string, QuestAttempt>>;
}): QuestSession {
  if (input.quests.length === 0) {
    throw new Error("QuestSession requires at least one quest");
  }

  const attempts = Object.fromEntries(
    input.quests.map((quest) => [
      quest.id,
      input.restoredAttempts?.[quest.id] ?? createEmptyAttempt(quest.id),
    ]),
  );
  const firstIncomplete = input.quests.findIndex(
    (quest) => attempts[quest.id].status !== "completed",
  );
  const completed = firstIncomplete === -1;

  return {
    sessionId: input.sessionId,
    userId: input.userId ?? "",
    quests: input.quests,
    attempts,
    activeIndex: completed ? input.quests.length - 1 : firstIncomplete,
    status: completed ? "completed" : "active",
  };
}

export function submitAnswer(
  session: QuestSession,
  questId: string,
  rawInput: string,
  now = Date.now(),
): SubmitAnswerResult {
  const questIndex = session.quests.findIndex((quest) => quest.id === questId);
  if (questIndex === -1) throw new Error(`Unknown quest: ${questId}`);

  const quest = session.quests[questIndex];
  const previous = session.attempts[questId];
  const availability = getQuestAvailability(quest, now);
  if (availability.status !== "available") {
    return { type: "blocked", reason: availability.status, session };
  }
  if (
    previous.penaltyEndsAt === -1 ||
    (previous.penaltyEndsAt !== null && previous.penaltyEndsAt > now)
  ) {
    return { type: "blocked", reason: "penalized", session };
  }

  const input = rawInput.trim();
  if (isAcceptedAnswer(quest, input)) {
    const attempt: QuestAttempt = {
      ...previous,
      input,
      status: "completed",
      penaltyEndsAt: null,
      completedAt: now,
    };
    const attempts = { ...session.attempts, [questId]: attempt };
    const nextIncomplete = session.quests.findIndex(
      (candidate) => attempts[candidate.id].status !== "completed",
    );
    const isComplete = nextIncomplete === -1;
    return {
      type: "correct",
      attempt,
      session: {
        ...session,
        attempts,
        activeIndex: questIndex,
        status: isComplete ? "completed" : "active",
      },
    };
  }

  // Legacy behavior only penalizes choice questions. Text questions remain retryable.
  const wrongCount = previous.wrongCount + 1;
  const penalties = quest.penaltyDurationsMs.length
    ? quest.penaltyDurationsMs
    : DEFAULT_PENALTIES;
  const penaltyDuration =
    penalties[Math.min(wrongCount - 1, penalties.length - 1)];
  const penaltyEndsAt =
    quest.kind === "choice"
      ? penaltyDuration === -1
        ? -1
        : now + penaltyDuration
      : null;
  const attempt: QuestAttempt = {
    ...previous,
    input,
    wrongCount: quest.kind === "choice" ? wrongCount : previous.wrongCount,
    penaltyEndsAt,
    status: penaltyEndsAt === null ? "incorrect" : "penalized",
  };

  return {
    type: "incorrect",
    attempt,
    session: {
      ...session,
      activeIndex: questIndex,
      attempts: { ...session.attempts, [questId]: attempt },
    },
  };
}

export function getCompletionTransition(
  session: QuestSession,
  completedQuestId: string,
): QuestCompletionTransition {
  if (session.status === "completed") return { type: "complete" };
  const quest = session.quests.find((item) => item.id === completedQuestId);
  if (!quest) throw new Error(`Unknown quest: ${completedQuestId}`);
  const targetIndex = session.quests.findIndex(
    (item) => session.attempts[item.id].status !== "completed",
  );
  if (targetIndex === -1) return { type: "complete" };
  return quest.autoNext
    ? { type: "auto", targetIndex }
    : { type: "manual", targetIndex };
}

export function canActivateQuest(
  session: QuestSession,
  targetIndex: number,
): boolean {
  if (targetIndex < 0 || targetIndex >= session.quests.length) return false;
  const firstIncomplete = session.quests.findIndex(
    (quest) => session.attempts[quest.id].status !== "completed",
  );
  return firstIncomplete === -1 || targetIndex <= firstIncomplete;
}

export function activateQuest(
  session: QuestSession,
  targetIndex: number,
): QuestSession {
  return canActivateQuest(session, targetIndex)
    ? { ...session, activeIndex: targetIndex }
    : session;
}
