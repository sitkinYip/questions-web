import { useLayoutEffect, useState, type RefObject } from "react";

function milliseconds(value: string) {
  return parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000) || 0;
}

/** CSS is the clock. End/cancel events and a bounded computed-duration fallback agree. */
export function useMotionPresence<T extends HTMLElement>(
  open: boolean,
  ref: RefObject<T | null>,
) {
  const [retained, setRetained] = useState(open);
  const present = open || retained;
  if (open && !retained) setRetained(true);
  useLayoutEffect(() => {
    if (open) return;
    let cancelled = false;
    if (!retained) return;
    const node = ref.current;
    const finish = () => {
      if (!cancelled) setRetained(false);
    };
    if (!node) {
      finish();
      return;
    }
    const style = getComputedStyle(node);
    const durations = style.animationDuration.split(",").map(milliseconds);
    const delays = style.animationDelay.split(",").map(milliseconds);
    const duration =
      style.animationName === "none"
        ? 0
        : Math.max(
            0,
            ...durations.map(
              (value, index) => value + delays[index % delays.length],
            ),
          );
    if (
      !duration ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      finish();
      return;
    }
    const ended = (event: AnimationEvent) => {
      if (
        event.target === node &&
        event.animationName?.startsWith("motion-") &&
        event.animationName.endsWith("exit")
      )
        finish();
    };
    node.addEventListener("animationend", ended);
    node.addEventListener("animationcancel", ended);
    const timer = window.setTimeout(finish, Math.min(duration + 80, 2000));
    return () => {
      cancelled = true;
      clearTimeout(timer);
      node.removeEventListener("animationend", ended);
      node.removeEventListener("animationcancel", ended);
    };
  }, [open, ref, retained]);
  return present;
}
