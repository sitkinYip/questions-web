import { uiCopy } from "@/config/ui-copy";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gameApi } from "@/api/game.client";
import {
  NotificationCenterView,
  type NotificationCenterProps,
} from "@/features/notification/NotificationCenter";
import { useGame } from "@/features/game/useGame";

export function GameNotificationCenter(
  props: Omit<NotificationCenterProps, "userId">,
) {
  const { player } = useGame();
  const client = useQueryClient();
  const queryKey = ["game", player.id, "notifications"];
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  const notes = useQuery({
    enabled: ready,
    queryKey,
    queryFn: ({ signal }) => gameApi.notifications(signal),
    refetchInterval: 5000,
  });
  const read = useMutation({
    mutationFn: gameApi.readNotification,
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  const unread = (notes.data?.items || []).filter((item) => !item.readAt);
  const notification = (
    item: NonNullable<typeof notes.data>["items"][number],
  ) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    popupTitle: item.popupTitle,
    buttonText: item.buttonText,
    revision: item.sentAt,
    createdAt: item.sentAt,
  });
  const current = unread.at(-1);
  return (
    <>
      <NotificationCenterView
        {...props}
        userId=""
        notifications={(notes.data?.items || []).map(notification)}
        unreadCount={unread.length}
        current={current ? notification(current) : null}
        queuedCount={unread.length}
        markRead={(id) => {
          if (!read.isPending) read.mutate(id);
        }}
        dismissCurrent={() => {
          if (current && !read.isPending) read.mutate(current.id);
        }}
      />
      {read.isError && (
        <p className="feedback" data-tone="danger" role="status">
          {uiCopy.gameNotificationCenter.saveFailed}
        </p>
      )}
    </>
  );
}
