import { useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/Button";

type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

/** One gesture owner prevents pinch/pan from accidentally changing images. */
export function ZoomableImage({
  src,
  alt,
  onSwipe,
}: {
  src: string;
  alt: string;
  onSwipe: (direction: "next" | "previous") => void;
}) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const current = useRef(view);
  const pointers = useRef(new Map<number, Point>());
  const swipe = useRef<Point | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const update = (
    scale: number,
    x = current.current.x,
    y = current.current.y,
  ) => {
    scale = Math.max(1, Math.min(4, scale));
    const bounds = stage.current?.getBoundingClientRect();
    const next = {
      scale,
      x: clamp(x, ((bounds?.width ?? 0) * (scale - 1)) / 2),
      y: clamp(y, ((bounds?.height ?? 0) * (scale - 1)) / 2),
    };
    current.current = next;
    setView(next);
  };
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    swipe.current =
      pointers.current.size === 1 &&
      current.current.scale === 1 &&
      event.pointerType !== "mouse"
        ? point
        : null;
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    const other = [...pointers.current.entries()].find(
      ([id]) => id !== event.pointerId,
    )?.[1];
    if (other) {
      swipe.current = null;
      const before = distance(previous, other);
      if (before > 0) {
        const scale = (current.current.scale * distance(next, other)) / before;
        const rect = stage.current!.getBoundingClientRect();
        const center = {
          x: (previous.x + other.x) / 2 - rect.left - rect.width / 2,
          y: (previous.y + other.y) / 2 - rect.top - rect.height / 2,
        };
        const ratio = Math.max(1, Math.min(4, scale)) / current.current.scale;
        update(
          scale,
          center.x +
            (current.current.x - center.x) * ratio +
            (next.x - previous.x) / 2,
          center.y +
            (current.current.y - center.y) * ratio +
            (next.y - previous.y) / 2,
        );
      }
    } else if (current.current.scale > 1) {
      update(
        current.current.scale,
        current.current.x + next.x - previous.x,
        current.current.y + next.y - previous.y,
      );
    }
    pointers.current.set(event.pointerId, next);
  };
  const finish = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (!cancelled && swipe.current && current.current.scale === 1) {
      const dx = event.clientX - swipe.current.x,
        dy = event.clientY - swipe.current.y;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.15)
        onSwipe(dx < 0 ? "next" : "previous");
    }
    swipe.current = null;
    pointers.current.delete(event.pointerId);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };
  return (
    <>
      <div
        ref={stage}
        className="media-viewer-stage media-viewer-stage--zoom"
        data-zoomed={view.scale > 1}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={(event) => finish(event)}
        onPointerCancel={(event) => finish(event, true)}
        onLostPointerCapture={(event) => {
          pointers.current.delete(event.pointerId);
          swipe.current = null;
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          }}
        />
      </div>
      <div className="media-viewer-zoom">
        <label>
          缩放{" "}
          <input
            aria-label="图片缩放"
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={view.scale}
            onChange={(event) => update(Number(event.target.value))}
          />
        </label>
        <output>{Math.round(view.scale * 100)}%</output>
        <Button size="small" variant="secondary" onClick={() => update(1)}>
          复位
        </Button>
        <small>双指缩放 · 放大后拖动</small>
      </div>
    </>
  );
}
