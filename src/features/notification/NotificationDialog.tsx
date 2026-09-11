import { useExitSnapshot } from "@/shared/motion/useExitSnapshot";
import { uiCopy } from "@/config/ui-copy";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AppDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { overlayPriority } from "@/components/ui/overlay-context";
import { parseLegacyContent } from "@/domain/content/parser";
import type { Notification } from "@/domain/notification/types";
import { trackAnalytics } from "@/infrastructure/analytics";

interface NotificationDialogProps {
  notification: Notification | null;
  userId: string;
  queuedCount: number;
  onClose: () => void;
  onAcknowledge?: () => void;
  pending?: boolean;
  feedback?: ReactNode;
  onOpenImages: (urls: readonly string[]) => void;
  onOpenVideo: (url: string, poster?: string) => void;
}

export function NotificationDialog({
  notification: requestedValue,
  userId,
  queuedCount,
  onClose,
  onAcknowledge,
  pending = false,
  feedback,
  onOpenImages,
  onOpenVideo,
}: NotificationDialogProps) {
  const snapshot = useExitSnapshot(requestedValue);
  const notification = snapshot.value;
  useEffect(() => {
    if (!requestedValue) return;
    trackAnalytics(
      {
        name: "notification_state",
        notificationId: requestedValue.id,
        title: requestedValue.title,
        popupTitle: requestedValue.popupTitle,
        content: requestedValue.content,
        state: "opened",
      },
      userId,
    );
    return () => {
      trackAnalytics(
        {
          name: "notification_state",
          notificationId: requestedValue.id,
          title: requestedValue.title,
          popupTitle: requestedValue.popupTitle,
          content: requestedValue.content,
          state: "closed",
        },
        userId,
      );
    };
  }, [requestedValue, userId]);

  if (!notification) return null;
  const segments = parseLegacyContent(notification.content);

  return (
    <AppDialog
      overlayId="notification"
      priority={overlayPriority.notification}
      open={snapshot.open}
      onExitComplete={snapshot.release}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      accessibleTitle={
        notification.popupTitle || uiCopy.notificationDialog.title
      }
      overlayClassName="notification-backdrop"
      contentClassName="notification-dialog"
    >
      <div className="notification-signal" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="notification-dialog-scroll">
        <header>
          <p className="eyebrow">{uiCopy.notificationDialog.eyebrow}</p>
          <h2 id="notification-dialog-title">
            {notification.popupTitle || uiCopy.notificationDialog.heading}
          </h2>
          {notification.title && <p>{notification.title}</p>}
        </header>
        <div className="notification-content">
          {segments.map((segment, index) => {
            const key = `${segment.type}-${index}`;
            if (segment.type === "text")
              return (
                <span className="notification-segment" key={key}>
                  {segment.content}
                </span>
              );
            if (segment.type === "highlight")
              return (
                <mark className="notification-segment" key={key}>
                  {segment.content}
                </mark>
              );
            if (segment.type === "break") return <br key={key} />;
            if (segment.type === "link")
              return segment.target === "internal" ? (
                <Link
                  className="notification-segment"
                  key={key}
                  to={segment.href}
                >
                  {segment.content}
                </Link>
              ) : (
                <a
                  key={key}
                  className="notification-segment"
                  href={segment.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {segment.content}
                </a>
              );
            if (segment.type === "image")
              return (
                <button
                  key={key}
                  type="button"
                  className="notification-media notification-segment"
                  onClick={() => onOpenImages([segment.url])}
                  aria-label={uiCopy.notificationDialog.viewImage}
                >
                  <img
                    src={segment.url}
                    alt={uiCopy.notificationDialog.contentLabel}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </button>
              );
            return (
              <button
                key={key}
                type="button"
                className="notification-media notification-video notification-segment"
                onClick={() => onOpenVideo(segment.url, segment.poster)}
                aria-label={uiCopy.notificationDialog.playVideo}
              >
                {segment.poster ? (
                  <img
                    src={segment.poster}
                    alt={uiCopy.notificationDialog.videoPoster}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <span className="video-placeholder">
                    {uiCopy.notificationDialog.play}
                  </span>
                )}
                <span className="play-badge" aria-hidden="true">
                  ▶
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <footer>
        {feedback && (
          <div className="notification-dialog-feedback">{feedback}</div>
        )}
        <span>
          {queuedCount > 1
            ? uiCopy.notificationDialog.pendingCount(queuedCount - 1)
            : ""}
        </span>
        <Button
          variant="primary"
          onClick={onAcknowledge ?? onClose}
          disabled={pending}
          data-modal-initial-focus
        >
          {pending
            ? uiCopy.notificationLetter.pending
            : notification.buttonText || uiCopy.notificationDialog.acknowledge}
        </Button>
      </footer>
    </AppDialog>
  );
}
