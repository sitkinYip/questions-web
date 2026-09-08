import { uiCopy } from "@/config/ui-copy";
import { useCallback, useMemo, useState } from "react";
import type { Notification } from "@/domain/notification/types";
import { createNotificationLauncherPositionRepository } from "@/infrastructure/storage/notification.repository";
import { useDraggableFloatingControl } from "@/shared/gestures/useDraggableFloatingControl";
import { NotificationDialog } from "@/features/notification/NotificationDialog";
import { useNotifications } from "@/features/notification/useNotifications";

export interface NotificationCenterProps {
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
    ? uiCopy.notificationCenter.unknownTime
    : notificationDateFormatter.format(date);
}

export function NotificationCenter({
  userId,
  blocked,
  onOpenImages,
  onOpenVideo,
}: NotificationCenterProps) {
  return (
    <NotificationCenterView
      userId={userId}
      blocked={blocked}
      onOpenImages={onOpenImages}
      onOpenVideo={onOpenVideo}
      {...useNotifications(userId)}
    />
  );
}
export function NotificationCenterView({
  userId,
  blocked,
  onOpenImages,
  onOpenVideo,
  notifications,
  unreadCount,
  current,
  queuedCount,
  markRead,
  dismissCurrent,
}: NotificationCenterProps & {
  notifications: readonly Notification[];
  unreadCount: number;
  current: Notification | null;
  queuedCount: number;
  markRead: (id: string) => void;
  dismissCurrent: () => void;
}) {
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
              aria-label={uiCopy.notificationCenter.listLabel}
            >
              <div className="notification-list-signal" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <header>
                <div>
                  <p className="eyebrow">{uiCopy.notificationCenter.eyebrow}</p>
                  <h2>{uiCopy.notificationCenter.title}</h2>
                </div>
                <span
                  aria-label={uiCopy.notificationCenter.count(
                    notifications.length,
                  )}
                >
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
                        {item.title ||
                          item.popupTitle ||
                          uiCopy.notificationCenter.untitled}
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
            aria-label={
              isListOpen
                ? uiCopy.notificationCenter.close
                : uiCopy.notificationCenter.open
            }
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
            {uiCopy.notificationCenter.dragInstructions}
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
