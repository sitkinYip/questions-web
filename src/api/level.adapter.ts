import type { Quest } from "../domain/quest/types.ts";
import { parseQuestRank } from "../domain/quest/rank.ts";
import { sanitizeMediaUrl, withSafeQuery } from "../domain/content/parser.ts";
import type { LevelRecord } from "./level.schema.ts";
import { adaptThread } from "./clue.adapter.ts";

function parseTimestamp(value?: string): number | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function buildPrompt(record: LevelRecord): string {
  return (
    record.question
      .flatMap((item) => [item.text, item.tips])
      .filter((value): value is string => Boolean(value))
      .join("\n") ||
    record.title ||
    `第 ${record.step} 题`
  );
}

export function adaptLevelRecord(record: LevelRecord): Quest {
  const finalTarget =
    record.FinalLevelConfig?.path ?? record.FinalLevelConfig?.link;
  const finalDestination = finalTarget
    ? withSafeQuery(finalTarget, record.FinalLevelConfig?.query ?? {})
    : null;
  return {
    id: record.id,
    step: record.step,
    revision: record.updated,
    kind: record.type === "MultipleChoice" ? "choice" : "text",
    title: record.title,
    displayName: record.userName,
    answerPlaceholder: record.placeholder,
    prompt: buildPrompt(record),
    content: record.question.map((item) => ({
      text: item.text,
      hint: item.tips,
      imageUrl: item.img
        ? (sanitizeMediaUrl(item.img) ?? undefined)
        : undefined,
      imageUrls: (item.imgList ?? [])
        .map(sanitizeMediaUrl)
        .filter((url): url is string => Boolean(url)),
      videoUrl: item.video
        ? (sanitizeMediaUrl(item.video) ?? undefined)
        : undefined,
    })),
    clues: adaptThread(record),
    acceptedAnswers: Array.from(
      new Set([record.answer, ...(record.answerList ?? [])]),
    ),
    options: (record.options ?? []).map((option) => ({
      key: option.key,
      text: option.text,
      imageUrl: option.img
        ? (sanitizeMediaUrl(option.img) ?? undefined)
        : undefined,
      videoUrl: option.video
        ? (sanitizeMediaUrl(option.video) ?? undefined)
        : undefined,
    })),
    startsAt: parseTimestamp(record.startTime),
    endsAt: parseTimestamp(record.endTime),
    penaltyDurationsMs: record.penaltyConfig ?? [],
    autoNext: record.autoNext ?? false,
    isFinal: record.isFinalLevel ?? false,
    finalDestination: finalDestination ?? undefined,
    rank: parseQuestRank(record.rank, record.rankName) ?? undefined,
    mainAudioUrl: record.mainAudio
      ? (sanitizeMediaUrl(record.mainAudio) ?? undefined)
      : undefined,
    backgroundImageUrl: record.mainBgImg
      ? (sanitizeMediaUrl(record.mainBgImg) ?? undefined)
      : undefined,
    avatarUrl: record.avatar
      ? (sanitizeMediaUrl(record.avatar) ?? undefined)
      : undefined,
  };
}
