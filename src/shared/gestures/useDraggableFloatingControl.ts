import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

export interface FloatingPosition {
  x: number;
  y: number;
}

interface DraggableFloatingControlOptions {
  initialPosition?: FloatingPosition;
  margin?: number;
  fallbackSize?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
  onPositionCommit?: (position: FloatingPosition) => void;
}

const clampRatio = (value: number) => Math.min(1, Math.max(0, value));

function clampPosition(position: FloatingPosition): FloatingPosition {
  return { x: clampRatio(position.x), y: clampRatio(position.y) };
}

export function useDraggableFloatingControl({
  initialPosition = { x: 1, y: 1 },
  margin = 12,
  fallbackSize = 56,
  fallbackWidth = fallbackSize,
  fallbackHeight = fallbackSize,
  onPositionCommit,
}: DraggableFloatingControlOptions = {}) {
  const controlRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const positionRef = useRef(clampPosition(initialPosition));
  const [position, setPositionState] = useState(() =>
    clampPosition(initialPosition),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const handleResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const travelX = Math.max(0, viewport.width - fallbackWidth - margin * 2);
  const travelY = Math.max(0, viewport.height - fallbackHeight - margin * 2);
  const pixels = {
    left: margin + position.x * travelX,
    top: margin + position.y * travelY,
  };

  const setPosition = useCallback((next: FloatingPosition) => {
    const clamped = clampPosition(next);
    positionRef.current = clamped;
    setPositionState(clamped);
    return clamped;
  }, []);

  const positionFromPixels = useCallback(
    (left: number, top: number) =>
      setPosition({
        x: travelX === 0 ? 0 : (left - margin) / travelX,
        y: travelY === 0 ? 0 : (top - margin) / travelY,
      }),
    [margin, setPosition, travelX, travelY],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: pixels.left,
      originTop: pixels.top,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    drag.moved = true;
    setIsDragging(true);
    positionFromPixels(drag.originLeft + deltaX, drag.originTop + deltaY);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setIsDragging(false);
    if (!drag.moved) return;
    suppressClickRef.current = true;
    const snapped = setPosition({
      x: positionRef.current.x < 0.5 ? 0 : 1,
      y: positionRef.current.y,
    });
    onPositionCommit?.(snapped);
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!event.altKey || !event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const step = event.shiftKey ? 48 : 16;
    const deltaX =
      event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const deltaY =
      event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    const next = positionFromPixels(pixels.left + deltaX, pixels.top + deltaY);
    onPositionCommit?.(next);
  };

  const consumeSuppressedClick = () => {
    const suppressed = suppressClickRef.current;
    suppressClickRef.current = false;
    return suppressed;
  };

  return {
    controlRef,
    isDragging,
    position,
    style: { left: pixels.left, top: pixels.top } satisfies CSSProperties,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel,
      onKeyDown,
    },
    consumeSuppressedClick,
  };
}
