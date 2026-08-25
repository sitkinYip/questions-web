import { z } from "zod";

export const NOTIFICATION_SEEN_IDS_KEY = "notification_seen_ids";

const seenIdsSchema = z.array(z.string().min(1));

export interface NotificationSeenRepository {
  load(): Set<string>;
  markSeen(id: string): void;
}

export function createNotificationSeenRepository(
  storage: Pick<Storage, "getItem" | "setItem">,
): NotificationSeenRepository {
  const load = () => {
    try {
      const raw = storage.getItem(NOTIFICATION_SEEN_IDS_KEY);
      if (!raw) return new Set<string>();
      const parsed = seenIdsSchema.safeParse(JSON.parse(raw));
      return new Set(parsed.success ? parsed.data : []);
    } catch {
      return new Set<string>();
    }
  };

  return {
    load,
    markSeen(id) {
      const ids = load();
      ids.add(id);
      storage.setItem(NOTIFICATION_SEEN_IDS_KEY, JSON.stringify([...ids]));
    },
  };
}
