import { useRef, type PointerEvent as ReactPointerEvent } from "react";

interface HorizontalSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
  threshold?: number;
}

interface PointerStart {
  pointerId: number;
  x: number;
  y: number;
}

const interactiveSelector =
  "button, input, textarea, select, a, video, audio, [role='button']";

export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  threshold = 52,
}: HorizontalSwipeOptions) {
  const startRef = useRef<PointerStart | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (disabled || !event.isPrimary || event.button !== 0) return;
    if (
      event.target instanceof Element &&
      event.target.closest(interactiveSelector)
    )
      return;
    startRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY))
      return;
    if (deltaX < 0) onSwipeLeft();
    else onSwipeRight();
  };

  const onPointerCancel = () => {
    startRef.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
}
