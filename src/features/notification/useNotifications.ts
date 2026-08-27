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
  const [seenIds, setSeenIds] = useState(() => repository.load());
  const seenIdsRef = useRef(seenIds);
  const queuedIdsRef = useRef(new Set<string>());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [queue, setQueue] = useState<Notification[]>([]);

  const markRead = useCallback(
    (id: string) => {
      if (seenIdsRef.current.has(id)) return;
      const nextSeenIds = new Set(seenIdsRef.current).add(id);
      seenIdsRef.current = nextSeenIds;
      setSeenIds(nextSeenIds);
      try {
        repository.markSeen(id);
      } catch {
        // The current session still reflects the read state if storage is blocked.
      }
    },
    [repository],
  );

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
          .find(
            (item) =>
              !seenIdsRef.current.has(item.id) &&
              !queuedIdsRef.current.has(item.id),
          );
        if (next) {
          queuedIdsRef.current.add(next.id);
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
    const dismissed = queue[0];
    if (!dismissed) return;
    queuedIdsRef.current.delete(dismissed.id);
    markRead(dismissed.id);
    setQueue((current) => current.slice(1));
  }, [markRead, queue]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !seenIds.has(item.id)).length,
    [notifications, seenIds],
  );

  return {
    notifications,
    unreadCount,
    current: queue[0] ?? null,
    queuedCount: queue.length,
    markRead,
    dismissCurrent,
  };
}
