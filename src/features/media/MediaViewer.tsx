import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AppDialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { overlayPriority } from "../../components/ui/overlay-context";

export type MediaViewerState =
  | { type: "images"; urls: readonly string[]; index: number }
  | { type: "video"; url: string; poster?: string }
  | null;

interface MediaViewerProps {
  className?: string;
  state: MediaViewerState;
  onClose: () => void;
  onImageIndexChange: (index: number) => void;
  onVideoPlayingChange: (playing: boolean) => void;
  onVideoEnded?: () => void;
}

export function MediaViewer({
  className,
  state,
  onClose,
  onImageIndexChange,
  onVideoPlayingChange,
  onVideoEnded,
}: MediaViewerProps) {
  const [imageDirection, setImageDirection] = useState<
    "initial" | "next" | "previous"
  >("initial");
  const swipeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const closeViewer = () => {
    setImageDirection("initial");
    swipeRef.current = null;
    onClose();
  };
  const navigateImage = useCallback(
    (direction: "next" | "previous") => {
      if (!state || state.type !== "images") return;
      const nextIndex =
        direction === "next" ? state.index + 1 : state.index - 1;
      if (nextIndex < 0 || nextIndex >= state.urls.length) return;
      setImageDirection(direction);
      onImageIndexChange(nextIndex);
    },
    [onImageIndexChange, state],
  );

  const beginImageSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !state ||
      state.type !== "images" ||
      state.urls.length < 2 ||
      !event.isPrimary ||
      event.pointerType === "mouse"
    ) {
      return;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    swipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const finishImageSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) return;
    swipeRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;
    const threshold = Math.min(
      96,
      Math.max(48, event.currentTarget.clientWidth * 0.12),
    );
    if (
      Math.abs(deltaX) < threshold ||
      Math.abs(deltaX) <= Math.abs(deltaY) * 1.15
    ) {
      return;
    }
    navigateImage(deltaX < 0 ? "next" : "previous");
  };

  const cancelImageSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (swipeRef.current?.pointerId === event.pointerId) {
      swipeRef.current = null;
    }
  };

  useEffect(() => {
    if (!state) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state.type !== "images") return;
      if (event.key === "ArrowLeft") navigateImage("previous");
      if (event.key === "ArrowRight") navigateImage("next");
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigateImage, state]);

  if (!state) return null;

  return (
    <AppDialog
      overlayId="media-viewer"
      priority={overlayPriority.content}
      open
      onOpenChange={(open) => {
        if (!open) closeViewer();
      }}
      accessibleTitle={state.type === "images" ? "图片预览" : "视频播放器"}
      overlayClassName="media-viewer-backdrop"
      contentClassName={
        className ? `media-viewer ${className}` : "media-viewer"
      }
    >
      <div className="media-viewer-ambient" aria-hidden="true">
        <i />
        <i />
      </div>
      <Button
        variant="icon"
        className="media-viewer-close"
        onClick={closeViewer}
        data-modal-initial-focus
        aria-label="关闭媒体预览"
      >
        ×
      </Button>

      {state.type === "images" ? (
        <>
          <div
            className="media-viewer-stage"
            data-direction={imageDirection}
            data-swipe-enabled={state.urls.length > 1 ? "true" : "false"}
            onPointerDown={beginImageSwipe}
            onPointerUp={finishImageSwipe}
            onPointerCancel={cancelImageSwipe}
            aria-describedby={
              state.urls.length > 1
                ? "media-viewer-swipe-instructions"
                : undefined
            }
          >
            <img
              key={`${state.urls[state.index]}-${state.index}`}
              src={state.urls[state.index]}
              alt={`预览图片 ${state.index + 1}`}
              draggable={false}
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <span className="media-viewer-frame" aria-hidden="true" />
          </div>
          {state.urls.length > 1 && (
            <div className="media-viewer-navigation">
              <Button
                size="small"
                variant="secondary"
                disabled={state.index === 0}
                onClick={() => navigateImage("previous")}
              >
                上一张
              </Button>
              <span>
                {state.index + 1} / {state.urls.length}
              </span>
              <Button
                size="small"
                variant="secondary"
                disabled={state.index === state.urls.length - 1}
                onClick={() => navigateImage("next")}
              >
                下一张
              </Button>
            </div>
          )}
          {state.urls.length > 1 && (
            <span id="media-viewer-swipe-instructions" className="sr-only">
              可左右滑动切换图片。
            </span>
          )}
        </>
      ) : (
        <div className="media-viewer-stage media-viewer-stage--video">
          <video
            src={state.url}
            poster={state.poster}
            controls
            autoPlay
            playsInline
            onPlay={() => onVideoPlayingChange(true)}
            onPause={() => onVideoPlayingChange(false)}
            onEnded={() => {
              setImageDirection("initial");
              onVideoPlayingChange(false);
              onVideoEnded?.();
            }}
          >
            当前浏览器无法播放此视频。
          </video>
          <span className="media-viewer-frame" aria-hidden="true" />
        </div>
      )}
    </AppDialog>
  );
}
