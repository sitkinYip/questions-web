import { uiCopy } from "@/config/ui-copy";
interface BgmControlsProps {
  visible: boolean;
  isPlaying: boolean;
  showAuthHint: boolean;
  onToggle: () => void;
  onAuthorize: () => void;
  onDismissAuthHint: () => void;
}

export function BgmControls({
  visible,
  isPlaying,
  showAuthHint,
  onToggle,
  onAuthorize,
  onDismissAuthHint,
}: BgmControlsProps) {
  const repository = useMemo(
    () => createBgmPreferencesRepository(window.localStorage),
    [],
  );
  const initialPosition = useMemo(
    () => repository.load().position ?? { x: 1, y: 1 },
    [repository],
  );
  const savePosition = useCallback(
    (position: { x: number; y: number }) => {
      try {
        repository.save({ position });
      } catch {
        // Dragging remains available when storage is unavailable.
      }
    },
    [repository],
  );
  const { controlRef, isDragging, style, handlers, consumeSuppressedClick } =
    useDraggableFloatingControl({
      initialPosition,
      onPositionCommit: savePosition,
    });

  if (!visible) return null;
  return (
    <>
      {showAuthHint && (
        <AppToast
          className="bgm-auth-hint"
          open
          onOpenChange={(open) => {
            if (!open) onDismissAuthHint();
          }}
          title={uiCopy.bgmControls.title}
          description={uiCopy.bgmControls.description}
          actionLabel={uiCopy.bgmControls.enable}
          actionAltText={uiCopy.bgmControls.enableDescription}
          onAction={onAuthorize}
          duration={15_000}
        />
      )}
      <button
        ref={controlRef}
        type="button"
        className={`bgm-control ${isPlaying ? "is-playing" : ""} ${isDragging ? "is-dragging" : ""}`}
        style={style}
        {...handlers}
        onClick={() => {
          if (!consumeSuppressedClick()) onToggle();
        }}
        aria-label={
          isPlaying ? uiCopy.bgmControls.pause : uiCopy.bgmControls.play
        }
        aria-pressed={isPlaying}
        aria-describedby="bgm-drag-instructions"
        data-playback-state={isPlaying ? "playing" : "paused"}
      >
        <span className="bgm-note" aria-hidden="true">
          ♪
        </span>
        <span className="bgm-playback-badge" aria-hidden="true">
          {isPlaying ? (
            <span className="bgm-pause-glyph">
              <i />
              <i />
            </span>
          ) : (
            <span className="bgm-play-glyph" />
          )}
        </span>
        {isPlaying && (
          <span className="bgm-waves" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        <span className="sr-only">
          {isPlaying ? uiCopy.bgmControls.playing : uiCopy.bgmControls.paused}
        </span>
      </button>
      <span id="bgm-drag-instructions" className="sr-only">
        {uiCopy.bgmControls.dragInstructions}
      </span>
    </>
  );
}
import { useCallback, useMemo } from "react";
import { AppToast } from "@/components/ui/Toast";
import { createBgmPreferencesRepository } from "@/infrastructure/storage/audio.repository";
import { useDraggableFloatingControl } from "@/shared/gestures/useDraggableFloatingControl";
