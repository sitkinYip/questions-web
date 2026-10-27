import {
  readStorageItem,
  writeStorageItem,
} from "@/infrastructure/storage/namespace";
import type { KeyValueStorage } from "@/infrastructure/storage/progress.repository";

export const questAnswerGuideKey = (userId: string) =>
  `starward:v1:quest-answer-guide:${encodeURIComponent(userId || "anonymous")}`;

export function createQuestAnswerGuideRepository(storage: KeyValueStorage) {
  return {
    hasSeen(userId: string) {
      return readStorageItem(storage, questAnswerGuideKey(userId)) === "1";
    },
    markSeen(userId: string) {
      writeStorageItem(storage, questAnswerGuideKey(userId), "1");
    },
  };
}
