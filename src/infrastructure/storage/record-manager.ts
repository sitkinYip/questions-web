import { z } from "zod";
import type { QuestAttempt } from "@/domain/quest/types";
import { parseStoredAttempt } from "@/infrastructure/storage/progress.repository";

export interface EnumerableStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface QuestStorageReference {
  step: number;
  revision: string;
}

export type LocalRecordKind =
  | "attempt"
  | "legacy-completion"
  | "legacy-penalty"
  | "rank"
  | "notification"
  | "letter-cache"
  | "audio-preference";

export interface LocalQuestionRecord {
  key: string;
  kind: LocalRecordKind;
  format: "current" | "legacy";
  step?: number;
  userId?: string;
  revision?: string;
  rank?: string;
  attempt?: QuestAttempt;
  isCorrupt: boolean;
}

export type LocalRecordFilterKind =
  "all" | "progress" | "penalty" | "rank" | "system";

export interface LocalRecordFilter {
  kind: LocalRecordFilterKind;
  step?: number;
  userId?: string;
  rank?: string;
}

const legacyCompletionValueSchema = z.object({
  type: z.literal("bingo"),
  date: z.number().optional(),
  input: z.string().optional(),
});
const legacyPenaltyValueSchema = z.object({
  wrongCount: z.number().int().nonnegative().optional(),
  penaltyEndTime: z.number().optional(),
});

function parseJson(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function findLegacyReference(
  key: string,
  prefixFor: (reference: QuestStorageReference) => string,
  suffixFor: (reference: QuestStorageReference) => string,
  references: readonly QuestStorageReference[],
) {
  return [...references]
    .sort((left, right) => right.revision.length - left.revision.length)
    .find(
      (reference) =>
        key.startsWith(prefixFor(reference)) &&
        key.endsWith(suffixFor(reference)),
    );
}

function parseCurrentAttempt(
  key: string,
  storage: EnumerableStorage,
): LocalQuestionRecord | null {
  const match = /^questions:v1:attempt:([^:]*):(\d+):(.*)$/.exec(key);
  if (!match) return null;
  const attempt = parseStoredAttempt(storage.getItem(key));
  return {
    key,
    kind: "attempt",
    format: "current",
    userId: match[1],
    step: Number(match[2]),
    revision: match[3],
    attempt: attempt ?? undefined,
    isCorrupt: !attempt,
  };
}

function parseLegacyCompletion(
  key: string,
  storage: EnumerableStorage,
  references: readonly QuestStorageReference[],
): LocalQuestionRecord | null {
  if (!key.startsWith("qaIndex")) return null;
  const reference = findLegacyReference(
    key,
    (item) => `qaIndex${item.step}`,
    (item) => item.revision,
    references,
  );
  const prefix = reference ? `qaIndex${reference.step}` : "qaIndex";
  const suffix = reference?.revision ?? "";
  const userId = key.slice(prefix.length, suffix ? -suffix.length : undefined);
  const value = legacyCompletionValueSchema.safeParse(
    parseJson(storage.getItem(key)),
  );
  return {
    key,
    kind: "legacy-completion",
    format: "legacy",
    step: reference?.step,
    revision: reference?.revision,
    userId,
    isCorrupt: !value.success,
  };
}

function parseLegacyPenalty(
  key: string,
  storage: EnumerableStorage,
  references: readonly QuestStorageReference[],
): LocalQuestionRecord | null {
  if (!key.startsWith("qa_penalty_")) return null;
  const reference = findLegacyReference(
    key,
    (item) => `qa_penalty_${item.step}_`,
    (item) => `_${item.revision}`,
    references,
  );
  const genericMatch = /^qa_penalty_(\d+)_([^_]*)_(.*)$/.exec(key);
  const prefix = reference ? `qa_penalty_${reference.step}_` : null;
  const suffix = reference ? `_${reference.revision}` : null;
  const value = legacyPenaltyValueSchema.safeParse(
    parseJson(storage.getItem(key)),
  );
  return {
    key,
    kind: "legacy-penalty",
    format: "legacy",
    step:
      reference?.step ?? (genericMatch ? Number(genericMatch[1]) : undefined),
    revision: reference?.revision ?? genericMatch?.[3],
    userId:
      prefix && suffix
        ? key.slice(prefix.length, -suffix.length)
        : (genericMatch?.[2] ?? ""),
    isCorrupt: !value.success,
  };
}

function parseRank(key: string): LocalQuestionRecord | null {
  const match = /^rankUpShown_(.*)_([^_]*)$/.exec(key);
  return match
    ? {
        key,
        kind: "rank",
        format: "legacy",
        userId: match[1],
        rank: match[2],
        isCorrupt: false,
      }
    : null;
}

export function scanLocalQuestionRecords(
  storage: EnumerableStorage,
  references: readonly QuestStorageReference[] = [],
): LocalQuestionRecord[] {
  const records: LocalQuestionRecord[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    const record =
      parseCurrentAttempt(key, storage) ??
      parseLegacyCompletion(key, storage, references) ??
      parseLegacyPenalty(key, storage, references) ??
      parseRank(key) ??
      (key === "notification_seen_ids"
        ? ({
            key,
            kind: "notification",
            format: "legacy",
            isCorrupt: false,
          } satisfies LocalQuestionRecord)
        : null) ??
      (key === "letter_records_cache"
        ? ({
            key,
            kind: "letter-cache",
            format: "legacy",
            isCorrupt: false,
          } satisfies LocalQuestionRecord)
        : null) ??
      (key === "questions:v1:bgm"
        ? ({
            key,
            kind: "audio-preference",
            format: "current",
            isCorrupt: false,
          } satisfies LocalQuestionRecord)
        : null);
    if (record) records.push(record);
  }
  return records.sort((left, right) => left.key.localeCompare(right.key));
}

function recordHasPenalty(record: LocalQuestionRecord) {
  return (
    record.kind === "legacy-penalty" ||
    (record.kind === "attempt" &&
      Boolean(record.attempt && record.attempt.penaltyEndsAt !== null))
  );
}

export function matchesLocalRecordFilter(
  record: LocalQuestionRecord,
  filter: LocalRecordFilter,
) {
  if (
    filter.kind === "progress" &&
    record.kind !== "attempt" &&
    record.kind !== "legacy-completion"
  )
    return false;
  if (filter.kind === "penalty" && !recordHasPenalty(record)) return false;
  if (filter.kind === "rank" && record.kind !== "rank") return false;
  if (
    filter.kind === "system" &&
    record.kind !== "notification" &&
    record.kind !== "letter-cache" &&
    record.kind !== "audio-preference"
  )
    return false;
  if (filter.step !== undefined && record.step !== filter.step) return false;
  if (filter.userId && record.userId !== filter.userId) return false;
  if (filter.rank && record.rank !== filter.rank) return false;
  return true;
}

export function deleteLocalRecords(
  storage: EnumerableStorage,
  keys: readonly string[],
) {
  for (const key of keys) storage.removeItem(key);
}

export function clearRecordPenalty(
  storage: EnumerableStorage,
  record: LocalQuestionRecord,
): boolean {
  if (record.kind === "legacy-penalty") {
    storage.removeItem(record.key);
    return true;
  }
  if (record.kind !== "attempt" || !record.attempt) return false;
  const attempt: QuestAttempt = {
    ...record.attempt,
    status:
      record.attempt.completedAt !== null
        ? "completed"
        : record.attempt.wrongCount > 0
          ? "incorrect"
          : "unanswered",
    penaltyEndsAt: null,
  };
  storage.setItem(record.key, JSON.stringify({ version: 1, attempt }));
  return true;
}
