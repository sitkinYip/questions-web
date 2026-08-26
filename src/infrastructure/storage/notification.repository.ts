import { z } from "zod";

export const NOTIFICATION_SEEN_IDS_KEY = "notification_seen_ids";
export const NOTIFICATION_LAUNCHER_POSITION_KEY =
  "questions:v1:notification-launcher";

const seenIdsSchema = z.array(z.string().min(1));
const launcherPositionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export interface NotificationLauncherPosition {
  x: number;
  y: number;
}

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

export function createNotificationLauncherPositionRepository(
  storage: Pick<Storage, "getItem" | "setItem">,
) {
  return {
    load(): NotificationLauncherPosition | null {
      try {
        const raw = storage.getItem(NOTIFICATION_LAUNCHER_POSITION_KEY);
        if (!raw) return null;
        const parsed = launcherPositionSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
    save(position: NotificationLauncherPosition) {
      storage.setItem(
        NOTIFICATION_LAUNCHER_POSITION_KEY,
        JSON.stringify(position),
      );
    },
  };
}
