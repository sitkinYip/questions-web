import { uiCopy } from "@/config/ui-copy";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppToast } from "@/components/ui/Toast";
import {
  NotificationCenterView,
  type NotificationCenterProps,
} from "@/features/notification/NotificationCenter";
import { useGameNotifications } from "@/features/game/game-queries";
import { useGameReadNotifications } from "@/features/game/hooks/useGameReadNotifications";

export function GameNotificationCenter(
  props: Omit<NotificationCenterProps, "userId">,
) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [allRead, setAllRead] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  const notes = useGameNotifications();
  const read = useGameReadNotifications();
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
        feedbackId={read.variables?.ids[0]}
        markRead={() => {}}
        acknowledge={async (notificationId) => {
          await read.mutateAsync({ ids: [notificationId] });
          setAllRead(true);
        }}
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
