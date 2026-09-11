import { useExitSnapshot } from "@/shared/motion/useExitSnapshot";
import { uiCopy } from "@/config/ui-copy";
import { useCallback, useEffect } from "react";
import { ZoomableImage } from "@/features/media/ZoomableImage";
import { AppDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { overlayPriority } from "@/components/ui/overlay-context";
import { NativeVideo } from "@/features/media/NativeVideo";

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
  state: requestedValue,
  onClose,
  onImageIndexChange,
  onVideoPlayingChange,
  onVideoEnded,
}: MediaViewerProps) {
  const snapshot = useExitSnapshot(requestedValue);
  const state = snapshot.value;
  const closeViewer = () => {
    onClose();
  };
  const navigateImage = useCallback(
    (direction: "next" | "previous") => {
      if (!requestedValue || !state || state.type !== "images") return;
      const nextIndex =
        direction === "next" ? state.index + 1 : state.index - 1;
      if (nextIndex < 0 || nextIndex >= state.urls.length) return;
      onImageIndexChange(nextIndex);
    },
    [onImageIndexChange, requestedValue, state],
  );

  useEffect(() => {
    if (!requestedValue || !state) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state.type !== "images") return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, select, [contenteditable=true]")
      )
        return;
      if (event.key === "ArrowLeft") navigateImage("previous");
      if (event.key === "ArrowRight") navigateImage("next");
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigateImage, requestedValue, state]);

  if (!state) return null;

  return (
    <AppDialog
      overlayId="media-viewer"
      priority={overlayPriority.media}
      open={snapshot.open}
      onExitComplete={snapshot.release}
      onOpenChange={(open) => {
        if (!open) closeViewer();
      }}
      accessibleTitle={
        state.type === "images"
          ? uiCopy.mediaViewer.imageTitle
          : uiCopy.mediaViewer.videoTitle
      }
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
        aria-label={uiCopy.mediaViewer.close}
      >
        ×
      </Button>

      {state.type === "images" ? (
        <>
          <ZoomableImage
            key={`${state.urls[state.index]}-${state.index}`}
            src={state.urls[state.index]}
            alt={uiCopy.mediaViewer.imageAlt(state.index + 1)}
            onSwipe={navigateImage}
          />
          {state.urls.length > 1 && (
            <div className="media-viewer-navigation">
              <Button
                size="small"
                variant="secondary"
                disabled={state.index === 0}
                onClick={() => navigateImage("previous")}
              >
                {uiCopy.mediaViewer.previous}
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
                {uiCopy.mediaViewer.next}
              </Button>
            </div>
          )}
          {state.urls.length > 1 && (
            <span id="media-viewer-swipe-instructions" className="sr-only">
              {uiCopy.mediaViewer.swipeHint}
            </span>
          )}
        </>
      ) : (
        <NativeVideo
          src={state.url}
          poster={state.poster}
          controls
          autoPlay
          playsInline
          onPlay={() => onVideoPlayingChange(true)}
          onPause={() => onVideoPlayingChange(false)}
          onEnded={() => {
            onVideoPlayingChange(false);
            onVideoEnded?.();
          }}
          renderVideo={(video) => (
            <div className="media-viewer-stage media-viewer-stage--video">
              {video}
              <span className="media-viewer-frame" aria-hidden="true" />
            </div>
          )}
        />
      )}
    </AppDialog>
  );
}
