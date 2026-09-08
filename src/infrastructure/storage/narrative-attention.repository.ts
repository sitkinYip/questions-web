import { z } from "zod";
import type { KeyValueStorage } from "@/infrastructure/storage/progress.repository";

const openedNarrativeIdsSchema = z.array(z.string().min(1));
const maxRememberedNarratives = 128;

export const narrativeAttentionKey = (userId: string, assignmentId: string) =>
  `questions:v1:narrative-attention:${encodeURIComponent(userId || "anonymous")}:${encodeURIComponent(assignmentId)}`;

export function createNarrativeAttentionRepository(storage: KeyValueStorage) {
  const load = (userId: string, assignmentId: string) => {
    try {
      const raw = storage.getItem(narrativeAttentionKey(userId, assignmentId));
      if (!raw) return new Set<string>();
      const parsed = openedNarrativeIdsSchema.safeParse(JSON.parse(raw));
      return new Set(parsed.success ? parsed.data : []);
    } catch {
      return new Set<string>();
    }
  };

  return {
    load,
    markOpened(userId: string, assignmentId: string, clueId: string) {
      try {
        const opened = [...load(userId, assignmentId), clueId];
        storage.setItem(
          narrativeAttentionKey(userId, assignmentId),
          JSON.stringify([...new Set(opened)].slice(-maxRememberedNarratives)),
        );
      } catch {
        // Attention is progressive enhancement; navigation must still work.
      }
    },
  };
}
