import type { KeyValueStorage } from "./progress.repository";

export const rankUpKey = (userId: string, rank: string) =>
  `rankUpShown_${userId}_${rank}`;

export function createRankRepository(storage: KeyValueStorage) {
  return {
    hasShown(userId: string, rank: string) {
      return storage.getItem(rankUpKey(userId, rank)) === "1";
    },
    markShown(userId: string, rank: string) {
      storage.setItem(rankUpKey(userId, rank), "1");
    },
  };
}
