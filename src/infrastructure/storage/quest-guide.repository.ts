import type { KeyValueStorage } from "@/infrastructure/storage/progress.repository";

export const questAnswerGuideKey = (userId: string) =>
  `questions:v1:quest-answer-guide:${encodeURIComponent(userId || "anonymous")}`;

export function createQuestAnswerGuideRepository(storage: KeyValueStorage) {
  return {
    hasSeen(userId: string) {
      return storage.getItem(questAnswerGuideKey(userId)) === "1";
    },
    markSeen(userId: string) {
      storage.setItem(questAnswerGuideKey(userId), "1");
    },
  };
}
