import { useCallback, type PointerEvent } from "react";

/**
 * 鸿蒙沉浸光感指针追踪 Hook
 * 在手指按下/滑动或鼠标悬停时，驱动表面局部光斑跟随位置，不扭曲玻璃材质。
 */
export function useImmersiveLight(enabled = true) {
  const updatePosition = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const el = event.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
      el.style.setProperty("--sw-light-x", `${x}px`);
      el.style.setProperty("--sw-light-y", `${y}px`);
      el.setAttribute("data-light", "active");
    },
    [enabled],
  );

  const clearPosition = useCallback((event: PointerEvent<HTMLElement>) => {
    event.currentTarget.removeAttribute("data-light");
  }, []);

  return {
    onPointerEnter: updatePosition,
    onPointerDown: updatePosition,
    onPointerMove: updatePosition,
    onPointerLeave: clearPosition,
    onPointerUp: clearPosition,
    onPointerCancel: clearPosition,
  };
}
