import { uiCopy } from "@/config/ui-copy";
import { useEffect } from "react";
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
  onOpenImages: (urls: readonly string[]) => void;
  onOpenVideo: (url: string, poster?: string) => void;
}

export function NotificationDialog({
  notification,
  userId,
  queuedCount,
  onClose,
  onOpenImages,
  onOpenVideo,
}: NotificationDialogProps) {
  useEffect(() => {
    if (!notification) return;
    trackAnalytics(
      {
        name: "notification_state",
        notificationId: notification.id,
        title: notification.title,
        popupTitle: notification.popupTitle,
        content: notification.content,
        state: "opened",
      },
      userId,
    );
    return () => {
      trackAnalytics(
        {
          name: "notification_state",
          notificationId: notification.id,
          title: notification.title,
          popupTitle: notification.popupTitle,
          content: notification.content,
          state: "closed",
        },
        userId,
      );
    };
  }, [notification, userId]);

  if (!notification) return null;
  const segments = parseLegacyContent(notification.content);

  return (
    <AppDialog
      overlayId="notification"
      priority={overlayPriority.notification}
      open
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
        <span>
          {queuedCount > 1
            ? uiCopy.notificationDialog.pendingCount(queuedCount - 1)
            : ""}
        </span>
        <Button variant="primary" onClick={onClose} data-modal-initial-focus>
          {notification.buttonText || uiCopy.notificationDialog.acknowledge}
        </Button>
      </footer>
    </AppDialog>
  );
}
