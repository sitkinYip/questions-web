import { env } from "../config/env";
import type { MultiQuestClue, Quest } from "../domain/quest/types";
import type { Letter } from "../domain/letter/types";
import type { Notification } from "../domain/notification/types";
import { adaptLetterRecord } from "./letter.adapter";
import { lettersResponseSchema } from "./letter.schema";
import { adaptLevelRecord } from "./level.adapter";
import { levelsResponseSchema } from "./level.schema";
import { multiQuestCluesResponseSchema } from "./multi-clue.schema";
import { adaptNotificationRecord } from "./notification.adapter";
import { notificationsResponseSchema } from "./notification.schema";
import { contractError, requestJson } from "./request";
export { ApiError } from "./errors";

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
    { signal, resource: "实时通知" },
  );
  const parsed = notificationsResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw contractError("通知接口", response.status, parsed.error);
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
    { signal, resource: "多题组合线索" },
  );
  const parsed = multiQuestCluesResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw contractError("多题组合线索", response.status, parsed.error);
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
    { signal, resource: "关卡数据" },
  );
  const parsed = levelsResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw contractError("关卡接口", response.status, parsed.error);
  return parsed.data.items.map(adaptLevelRecord);
}

export async function fetchLetters(signal?: AbortSignal): Promise<Letter[]> {
  const query = new URLSearchParams({ perPage: "500", sort: "created" });
  const response = await requestJson(
    `${env.VITE_API_BASE_URL}/letter/records?${query}`,
    { signal, resource: "信件数据" },
  );
  const parsed = lettersResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw contractError("信件接口", response.status, parsed.error);
  return parsed.data.items.map(adaptLetterRecord);
}
