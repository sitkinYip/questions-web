import { uiCopy } from "@/config/ui-copy";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { authState, gameApi } from "@/api/game.client";
import { AppToast } from "@/components/ui/Toast";
import {
  NotificationCenterView,
  type NotificationCenterProps,
} from "@/features/notification/NotificationCenter";
import { gameKeys, useGameNotifications } from "@/features/game/game-queries";
import { useGame } from "@/features/game/useGame";
import type { GameNotification } from "@/api/game.contracts";

export function GameNotificationCenter(
  props: Omit<NotificationCenterProps, "userId">,
) {
  const { player } = useGame();
  const client = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryKey = gameKeys.notifications(player.id);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [allRead, setAllRead] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  const notes = useGameNotifications();
  const read = useMutation({
    mutationFn: async (notificationId: string) => {
      await client.cancelQueries({ queryKey });
      const receipt: unknown = await gameApi.readNotification(notificationId);
      if (authState.get()?.playerId !== player.id) return;
      if (
        receipt !== null &&
        typeof receipt === "object" &&
        "id" in receipt &&
        receipt.id === notificationId &&
        "readAt" in receipt &&
        typeof receipt.readAt === "string" &&
        receipt.readAt.length > 0
      ) {
        const readAt = receipt.readAt;
        client.setQueryData<{ items: GameNotification[] }>(
          queryKey,
          (previous) =>
            previous
              ? {
                  items: previous.items.map((item) =>
                    item.id === notificationId ? { ...item, readAt } : item,
                  ),
                }
              : previous,
        );
      }
      setAllRead(true);
      await client.invalidateQueries({ queryKey });
    },
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
  const current = ready
    ? unread.findLast((item) => !dismissed.has(item.id))
    : undefined;
  const openInbox = () => {
    setAllRead(false);
    void navigate("/notifications", {
      state: { returnTo: id ? `/play/${id}` : undefined },
    });
  };
  return (
    <>
      <NotificationCenterView
        {...props}
        userId=""
        notifications={unread.map(notification)}
        unreadCount={unread.length}
        current={current ? notification(current) : null}
        queuedCount={unread.length}
        pending={read.isPending}
        feedback={
          read.isError ? (
            <p className="feedback" data-tone="danger" role="status">
              {uiCopy.gameNotificationCenter.saveFailed}
            </p>
          ) : undefined
        }
        feedbackId={read.variables}
        markRead={() => {}}
        acknowledge={(notificationId) => read.mutateAsync(notificationId)}
        openInbox={openInbox}
        dismissCurrent={() => {
          if (current)
            setDismissed((previous) => new Set(previous).add(current.id));
        }}
      />
      {allRead && (
        <AppToast
          open={allRead && unread.length === 0 && !props.blocked}
          onOpenChange={setAllRead}
          title={uiCopy.gameNotificationCenter.allRead}
          description={uiCopy.gameNotificationCenter.archiveHint}
          actionLabel={uiCopy.gameNotificationCenter.viewInbox}
          onAction={openInbox}
          onContentClick={openInbox}
        />
      )}
    </>
  );
}
