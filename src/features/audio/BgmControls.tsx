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
          title="背景音乐提示"
          description="浏览器需要一次手动确认，之后会记住你的选择。"
          actionLabel="开启背景音乐"
          actionAltText="开启背景音乐，也可以稍后使用悬浮音乐按钮"
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
        aria-label={isPlaying ? "暂停背景音乐" : "播放背景音乐"}
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
          {isPlaying ? "当前正在播放" : "当前已暂停"}
        </span>
      </button>
      <span id="bgm-drag-instructions" className="sr-only">
        可拖拽移动；键盘用户可按 Alt 加方向键调整位置。
      </span>
    </>
  );
}
import { useCallback, useMemo } from "react";
import { AppToast } from "../../components/ui/Toast";
import { createBgmPreferencesRepository } from "../../infrastructure/storage/audio.repository";
import { useDraggableFloatingControl } from "../../shared/gestures/useDraggableFloatingControl";
