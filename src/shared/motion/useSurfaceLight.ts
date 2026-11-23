// Motion Prompt #154 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#154
// 鸿蒙沉浸光感通用 Hook：零延迟将指针/触摸坐标写入 CSS 变量，驱动表面柔光与边缘辉光。
import { useCallback, type PointerEvent } from "react";

export interface SurfaceLightHandlers {
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 为任意玻璃容器提供鸿蒙沉浸光感的点光源坐标追踪（零组件重渲染、零业务耦合）。
 * 与 `.ui-light-surface` 样式原语配合使用，写入 `--light-x` / `--light-y` 与 `data-light-active`。
 */
export function useSurfaceLight(disabled = false): SurfaceLightHandlers {
  const update = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (disabled || prefersReducedMotion()) return;
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      element.style.setProperty(
        "--light-x",
        `${Math.round(event.clientX - rect.left)}px`,
      );
      element.style.setProperty(
        "--light-y",
        `${Math.round(event.clientY - rect.top)}px`,
      );
      element.dataset.lightActive = "true";
    },
    [disabled],
  );

  const clear = useCallback((event: PointerEvent<HTMLElement>) => {
    delete event.currentTarget.dataset.lightActive;
  }, []);

  return {
    onPointerMove: update,
    onPointerDown: update,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}
