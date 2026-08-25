import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchNotifications } from "../../api/client";
import { ApiError } from "../../api/errors";
import type { Notification } from "../../domain/notification/types";
import { createNotificationSeenRepository } from "../../infrastructure/storage/notification.repository";

const POLL_INTERVAL_MS = 5_000;

export function useNotifications(userId: string, initialDelay = 5_000) {
  const repository = useMemo(
    () => createNotificationSeenRepository(window.localStorage),
    [],
  );
  const seenIdsRef = useRef(repository.load());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [queue, setQueue] = useState<Notification[]>([]);

  useEffect(() => {
    let stopped = false;
    let requesting = false;
    let timer: number | null = null;
    let controller: AbortController | null = null;

    const schedule = (delay: number) => {
      if (stopped || document.hidden) return;
      timer = window.setTimeout(poll, delay);
    };
    const poll = async () => {
      if (stopped || requesting || document.hidden) return;
      requesting = true;
      controller = new AbortController();
      try {
        const remote = await fetchNotifications(userId, controller.signal);
        if (stopped) return;
        setNotifications(remote);
        const next = [...remote]
          .reverse()
          .find((item) => !seenIdsRef.current.has(item.id));
        if (next) {
          seenIdsRef.current.add(next.id);
          try {
            repository.markSeen(next.id);
          } catch {
            // The current session still avoids duplicate popups if storage is blocked.
          }
          setQueue((current) => [...current, next]);
        }
      } catch (error) {
        if (!(error instanceof ApiError && error.kind === "cancelled")) {
          console.error("轮询通知失败:", error);
        }
      } finally {
        requesting = false;
        controller = null;
        schedule(POLL_INTERVAL_MS);
      }
    };
    const handleVisibilityChange = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      if (document.hidden) controller?.abort();
      else schedule(1_000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    schedule(initialDelay);
    return () => {
      stopped = true;
      if (timer !== null) window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [initialDelay, repository, userId]);

  const dismissCurrent = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  return {
    notifications,
    current: queue[0] ?? null,
    queuedCount: queue.length,
    dismissCurrent,
  };
}
