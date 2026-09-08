import { z } from "zod";
import { createEmptyAttempt } from "@/domain/quest/session";
import type { Quest, QuestAttempt } from "@/domain/quest/types";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const storedAttemptSchema = z.object({
  version: z.literal(1),
  attempt: z.object({
    questId: z.string(),
    status: z.enum(["unanswered", "incorrect", "penalized", "completed"]),
    input: z.string(),
    wrongCount: z.number().int().nonnegative(),
    penaltyEndsAt: z.number().nullable(),
    completedAt: z.number().nullable(),
  }),
});
const legacyCompletionSchema = z.object({
  type: z.literal("bingo"),
  date: z.number().optional(),
  input: z.string().optional(),
});
const legacyPenaltySchema = z.object({
  wrongCount: z.number().int().nonnegative().optional(),
  penaltyEndTime: z.number().optional(),
});

export const progressKey = (quest: Quest, userId: string) =>
  `questions:v1:attempt:${userId}:${quest.step}:${quest.revision}`;
export const legacyCompletionKey = (quest: Quest, userId: string) =>
  `qaIndex${quest.step}${userId}${quest.revision}`;
export const legacyPenaltyKey = (quest: Quest, userId: string) =>
  `qa_penalty_${quest.step}_${userId}_${quest.revision}`;

function parseJson(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function parseStoredAttempt(raw: string | null): QuestAttempt | null {
  const result = storedAttemptSchema.safeParse(parseJson(raw));
  return result.success ? result.data.attempt : null;
}

export function createProgressRepository(storage: KeyValueStorage) {
  const save = (quest: Quest, userId: string, attempt: QuestAttempt) =>
    storage.setItem(
      progressKey(quest, userId),
      JSON.stringify({ version: 1, attempt }),
    );
  const load = (quest: Quest, userId: string): QuestAttempt => {
    const current = parseStoredAttempt(
      storage.getItem(progressKey(quest, userId)),
    );
    if (current) return current;

    const attempt = createEmptyAttempt(quest.id);
    const completion = legacyCompletionSchema.safeParse(
      parseJson(storage.getItem(legacyCompletionKey(quest, userId))),
    );
    const penalty = legacyPenaltySchema.safeParse(
      parseJson(storage.getItem(legacyPenaltyKey(quest, userId))),
    );
    if (completion.success) {
      attempt.status = "completed";
      attempt.input = completion.data.input ?? "";
      attempt.completedAt = completion.data.date ?? null;
    } else if (penalty.success) {
      attempt.wrongCount = penalty.data.wrongCount ?? 0;
      attempt.penaltyEndsAt = penalty.data.penaltyEndTime ?? null;
      attempt.status = attempt.penaltyEndsAt ? "penalized" : "incorrect";
    }
    if (completion.success || penalty.success) save(quest, userId, attempt);
    return attempt;
  };
  return { load, save };
}
