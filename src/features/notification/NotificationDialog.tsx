import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AppDialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { overlayPriority } from "../../components/ui/overlay-context";
import { parseLegacyContent } from "../../domain/content/parser";
import type { Notification } from "../../domain/notification/types";
import { trackAnalytics } from "../../infrastructure/analytics";

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
      accessibleTitle={notification.popupTitle || "魔法通知"}
      overlayClassName="notification-backdrop"
      contentClassName="notification-dialog"
    >
      <div className="notification-signal" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header>
        <p className="eyebrow">Incoming transmission</p>
        <h2 id="notification-dialog-title">
          {notification.popupTitle || "✨ 魔法通知 ✨"}
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
                aria-label="查看通知图片"
              >
                <img
                  src={segment.url}
                  alt="通知内容"
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
              aria-label="播放通知视频"
            >
              {segment.poster ? (
                <img
                  src={segment.poster}
                  alt="通知视频封面"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <span className="video-placeholder">点击播放视频</span>
              )}
              <span className="play-badge" aria-hidden="true">
                ▶
              </span>
            </button>
          );
        })}
      </div>
      <footer>
        <span>{queuedCount > 1 ? `还有 ${queuedCount - 1} 条讯息` : ""}</span>
        <Button variant="primary" onClick={onClose} data-modal-initial-focus>
          {notification.buttonText || "✨ 知晓了"}
        </Button>
      </footer>
    </AppDialog>
  );
}
