import { uiCopy } from "@/config/ui-copy";
import { useCallback, useMemo } from "react";
import { ArchiveBoxIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { createMultiClueLauncherPositionRepository } from "@/infrastructure/storage/multi-clue-launcher.repository";
import { useDraggableFloatingControl } from "@/shared/gestures/useDraggableFloatingControl";

interface MultiClueLauncherProps {
  onOpen: () => void;
}

const defaultPosition = { x: 1, y: 0.72 };

export function MultiClueLauncher({ onOpen }: MultiClueLauncherProps) {
  const repository = useMemo(
    () => createMultiClueLauncherPositionRepository(window.localStorage),
    [],
  );
  const initialPosition = useMemo(
    () => repository.load() ?? defaultPosition,
    [repository],
  );
  const savePosition = useCallback(
    (position: { x: number; y: number }) => {
      try {
        repository.save(position);
      } catch {
        // Opening the clue remains available when storage is unavailable.
      }
    },
    [repository],
  );
  const {
    controlRef,
    isDragging,
    position,
    style,
    handlers,
    consumeSuppressedClick,
  } = useDraggableFloatingControl({
    initialPosition,
    fallbackWidth: 174,
    fallbackHeight: 64,
    onPositionCommit: savePosition,
  });

  return (
    <>
      <button
        ref={controlRef}
        type="button"
        className={`multi-clue-launcher${isDragging ? " is-dragging" : ""}`}
        style={style}
        {...handlers}
        data-horizontal={position.x < 0.5 ? "left" : "right"}
        aria-label={uiCopy.multiClueLauncher.title}
        aria-describedby="multi-clue-launcher-drag-instructions"
        onClick={() => {
          if (!consumeSuppressedClick()) onOpen();
        }}
      >
        <span className="multi-clue-launcher__signal" aria-hidden="true">
          <i />
          <ArchiveBoxIcon weight="duotone" />
        </span>
        <span className="multi-clue-launcher__copy">
          <small>{uiCopy.multiClueLauncher.eyebrow}</small>
          <strong>{uiCopy.multiClueLauncher.title}</strong>
        </span>
        <ArrowUpRightIcon
          className="multi-clue-launcher__arrow"
          weight="bold"
          aria-hidden="true"
        />
      </button>
      <span id="multi-clue-launcher-drag-instructions" className="sr-only">
        {uiCopy.multiClueLauncher.dragInstructions}
      </span>
    </>
  );
}
