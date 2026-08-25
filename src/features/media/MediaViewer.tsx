import { useEffect, useState } from "react";
import { AppDialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { overlayPriority } from "../../components/ui/overlay-context";

export type MediaViewerState =
  | { type: "images"; urls: readonly string[]; index: number }
  | { type: "video"; url: string; poster?: string }
  | null;

interface MediaViewerProps {
  state: MediaViewerState;
  onClose: () => void;
  onImageIndexChange: (index: number) => void;
  onVideoPlayingChange: (playing: boolean) => void;
  onVideoEnded?: () => void;
}

export function MediaViewer({
  state,
  onClose,
  onImageIndexChange,
  onVideoPlayingChange,
  onVideoEnded,
}: MediaViewerProps) {
  const [imageDirection, setImageDirection] = useState<
    "initial" | "next" | "previous"
  >("initial");
  const closeViewer = () => {
    setImageDirection("initial");
    onClose();
  };

  useEffect(() => {
    if (!state) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state.type !== "images") return;
      if (event.key === "ArrowLeft" && state.index > 0) {
        setImageDirection("previous");
        onImageIndexChange(state.index - 1);
      }
      if (event.key === "ArrowRight" && state.index < state.urls.length - 1) {
        setImageDirection("next");
        onImageIndexChange(state.index + 1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onImageIndexChange, state]);

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
      contentClassName="media-viewer"
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
          <div className="media-viewer-stage" data-direction={imageDirection}>
            <img
              key={`${state.urls[state.index]}-${state.index}`}
              src={state.urls[state.index]}
              alt={`预览图片 ${state.index + 1}`}
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
                onClick={() => {
                  setImageDirection("previous");
                  onImageIndexChange(state.index - 1);
                }}
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
                onClick={() => {
                  setImageDirection("next");
                  onImageIndexChange(state.index + 1);
                }}
              >
                下一张
              </Button>
            </div>
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
