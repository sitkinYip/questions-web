import { useCallback, useMemo, useState } from "react";
import type { Notification } from "../../domain/notification/types";
import { createNotificationLauncherPositionRepository } from "../../infrastructure/storage/notification.repository";
import { useDraggableFloatingControl } from "../../shared/gestures/useDraggableFloatingControl";
import { NotificationDialog } from "./NotificationDialog";
import { useNotifications } from "./useNotifications";

interface NotificationCenterProps {
  userId: string;
  blocked: boolean;
  onOpenImages: (urls: readonly string[]) => void;
  onOpenVideo: (url: string, poster?: string) => void;
}

const notificationDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatNotificationTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "未知时序"
    : notificationDateFormatter.format(date);
}

export function NotificationCenter({
  userId,
  blocked,
  onOpenImages,
  onOpenVideo,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    current,
    queuedCount,
    markRead,
    dismissCurrent,
  } = useNotifications(userId);
  const [manualNotification, setManualNotification] =
    useState<Notification | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const launcherPositionRepository = useMemo(
    () => createNotificationLauncherPositionRepository(window.localStorage),
    [],
  );
  const initialLauncherPosition = useMemo(
    () => launcherPositionRepository.load() ?? { x: 0, y: 1 },
    [launcherPositionRepository],
  );
  const saveLauncherPosition = useCallback(
    (position: { x: number; y: number }) => {
      try {
        launcherPositionRepository.save(position);
      } catch {
        // The launcher remains draggable when storage is unavailable.
      }
    },
    [launcherPositionRepository],
  );
  const {
    controlRef,
    isDragging,
    position: launcherPosition,
    style: launcherStyle,
    handlers: launcherDragHandlers,
    consumeSuppressedClick,
  } = useDraggableFloatingControl({
    initialPosition: initialLauncherPosition,
    fallbackSize: 54,
    onPositionCommit: saveLauncherPosition,
  });
  const active = manualNotification ?? current;
  const visibleNotification = blocked ? null : active;
  const closeDialog = useCallback(() => {
    if (manualNotification) setManualNotification(null);
    else dismissCurrent();
  }, [dismissCurrent, manualNotification]);

  return (
    <>
      {notifications.length > 0 && !blocked && !active && (
        <aside
          className={`notification-launcher ${isDragging ? "is-dragging" : ""}`}
          style={launcherStyle}
          data-state={isListOpen ? "open" : "closed"}
          data-horizontal={launcherPosition.x < 0.5 ? "left" : "right"}
          data-vertical={launcherPosition.y < 0.5 ? "below" : "above"}
        >
          {isListOpen && (
            <div
              className="notification-list"
              id="notification-archive"
              aria-label="通知列表"
            >
              <div className="notification-list-signal" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <header>
                <div>
                  <p className="eyebrow">Signal archive</p>
                  <h2>远方来的讯息</h2>
                </div>
                <span aria-label={`${notifications.length} 条通知`}>
                  {String(notifications.length).padStart(2, "0")}
                </span>
              </header>
              <div className="notification-list-items">
                {notifications.slice(0, 5).map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      markRead(item.id);
                      setManualNotification(item);
                      setIsListOpen(false);
                    }}
                  >
                    <span
                      className="notification-list-index"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="notification-list-copy">
                      <strong>
                        {item.title || item.popupTitle || "未命名通知"}
                      </strong>
                      <span>{formatNotificationTime(item.createdAt)}</span>
                    </span>
                    <span
                      className="notification-list-action"
                      aria-hidden="true"
                    >
                      <i />
                      <span>→</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            ref={controlRef}
            type="button"
            className="notification-bell"
            {...launcherDragHandlers}
            aria-label={isListOpen ? "关闭通知列表" : "打开通知列表"}
            aria-expanded={isListOpen}
            aria-controls="notification-archive"
            aria-describedby="notification-drag-instructions"
            onClick={() => {
              if (!consumeSuppressedClick()) {
                setIsListOpen((currentState) => !currentState);
              }
            }}
          >
            <span className="notification-bell-signal" aria-hidden="true">
              <i />
              <i />
              <span>✦</span>
            </span>
            {unreadCount > 0 && (
              <strong aria-hidden="true">
                {unreadCount > 9 ? "9+" : unreadCount}
              </strong>
            )}
          </button>
          <span id="notification-drag-instructions" className="sr-only">
            可拖拽移动；键盘用户可按 Alt 加方向键调整位置。
          </span>
        </aside>
      )}
      <NotificationDialog
        notification={visibleNotification}
        userId={userId}
        queuedCount={manualNotification ? 1 : queuedCount}
        onClose={closeDialog}
        onOpenImages={onOpenImages}
        onOpenVideo={onOpenVideo}
      />
    </>
  );
}
