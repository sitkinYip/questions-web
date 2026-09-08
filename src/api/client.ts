import { uiCopy } from "@/config/ui-copy";
import { env } from "@/config/env";
import type { MultiQuestClue, Quest } from "@/domain/quest/types";
import type { Letter } from "@/domain/letter/types";
import type { Notification } from "@/domain/notification/types";
import { adaptLetterRecord } from "@/api/letter.adapter";
import { lettersResponseSchema } from "@/api/letter.schema";
import { adaptLevelRecord } from "@/api/level.adapter";
import { levelsResponseSchema } from "@/api/level.schema";
import { multiQuestCluesResponseSchema } from "@/api/multi-clue.schema";
import { adaptNotificationRecord } from "@/api/notification.adapter";
import { notificationsResponseSchema } from "@/api/notification.schema";
import type { Blessing } from "@/domain/bless/types";
import { adaptPhraseRecord } from "@/api/phrase.adapter";
import { phrasesResponseSchema } from "@/api/phrase.schema";
import { contractError, requestJson } from "@/api/request";
export { ApiError } from "@/api/errors";

export function escapePocketBaseFilterValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

export async function fetchNotifications(
  userId: string,
  signal?: AbortSignal,
): Promise<Notification[]> {
  const filters = ["(enabled=true)"];
  if (userId) {
    filters.push(`(user='${escapePocketBaseFilterValue(userId)}')`);
  }
  const query = new URLSearchParams({
    perPage: "100",
    sort: "-created",
    filter: filters.join("&&"),
  });
  const response = await requestJson(
    `${env.VITE_API_BASE_URL}/notifications/records?${query}`,
    { signal, resource: uiCopy.client.notifications },
  );
  const parsed = notificationsResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw contractError(
      uiCopy.client.notificationApi,
      response.status,
      parsed.error,
    );
  return parsed.data.items
    .filter((item) => item.enabled && (!userId || item.user?.trim() === userId))
    .map(adaptNotificationRecord);
}

export async function fetchMultiQuestClue(
  steps: readonly number[],
  signal?: AbortSignal,
): Promise<MultiQuestClue | null> {
  const qas = steps.join(",");
  const query = new URLSearchParams({
    perPage: "1",
    filter: `qas="${qas}"`,
  });
  const response = await requestJson(
    `${env.VITE_API_BASE_URL}/multi_quest_clues/records?${query}`,
    { signal, resource: uiCopy.client.multiClue },
  );
  const parsed = multiQuestCluesResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw contractError(uiCopy.client.multiClue, response.status, parsed.error);
  const item = parsed.data.items[0];
  return item
    ? {
        id: item.id,
        qas: item.qas,
        content: item.content,
        title: item.title ?? undefined,
        buttonText: item.buttonText ?? undefined,
        description: item.desc ?? undefined,
        revision: item.updated,
      }
    : null;
}

export async function fetchQuests(signal?: AbortSignal): Promise<Quest[]> {
  const query = new URLSearchParams({ perPage: "500", sort: "step" });
  const response = await requestJson(
    `${env.VITE_API_BASE_URL}/levels/records?${query}`,
    { signal, resource: uiCopy.client.levels },
  );
  const parsed = levelsResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw contractError(uiCopy.client.levelApi, response.status, parsed.error);
  return parsed.data.items.map(adaptLevelRecord);
}

export async function fetchLetters(signal?: AbortSignal): Promise<Letter[]> {
  const query = new URLSearchParams({ perPage: "500", sort: "created" });
  const response = await requestJson(
    `${env.VITE_API_BASE_URL}/letter/records?${query}`,
    { signal, resource: uiCopy.client.letters },
  );
  const parsed = lettersResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw contractError(uiCopy.client.letterApi, response.status, parsed.error);
  return parsed.data.items.map(adaptLetterRecord);
}

export async function fetchBlessings(
  signal?: AbortSignal,
): Promise<Blessing[]> {
  const query = new URLSearchParams({ perPage: "500", sort: "created" });
  const response = await requestJson(
    `${env.VITE_API_BASE_URL}/phrase/records?${query}`,
    { signal, resource: uiCopy.client.blessing },
  );
  const parsed = phrasesResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw contractError(
      uiCopy.client.blessingApi,
      response.status,
      parsed.error,
    );
  return parsed.data.items.map(adaptPhraseRecord);
}
