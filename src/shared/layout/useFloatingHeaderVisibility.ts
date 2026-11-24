import { useEffect, useState, type RefObject } from "react";

const TOP_REVEAL_THRESHOLD = 16;
const HIDE_AFTER = 56;
const DOWN_DELTA = 10;
const UP_DELTA = 6;

interface ScrollTracker {
  lastY: number;
  anchorY: number;
}

/**
 * 悬浮顶栏滚向显隐控制：
 * - 页面顶部始终展示
 * - 连续向下滚动超过阈值后平滑隐藏（支持慢速触摸、滚轮及单次 scrollTo 跳转）
 * - 向上滚动超过小阈值后即时重新展示
 * - 切换题目或键盘焦点落入顶栏时强制展示
 */
export function useFloatingHeaderVisibility(options: {
  enabled: boolean;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  resetKey?: string | number;
}) {
  const { enabled, scrollContainerRef, resetKey } = options;
  const [hiddenState, setHiddenState] = useState<{
    key: string | number | undefined;
    hidden: boolean;
  }>({ key: resetKey, hidden: false });

  const hidden = enabled && hiddenState.key === resetKey && hiddenState.hidden;

  useEffect(() => {
    if (!enabled) return;

    const getWindowY = () =>
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const initialWindowY = getWindowY();
    const trackers = new WeakMap<EventTarget, ScrollTracker>();
    trackers.set(window, { lastY: initialWindowY, anchorY: initialWindowY });

    const setHidden = (next: boolean) => {
      setHiddenState((prev) =>
        prev.key === resetKey && prev.hidden === next
          ? prev
          : { key: resetKey, hidden: next },
      );
    };

    const handleScroll = (target: EventTarget | null) => {
      let currentTop = 0;
      let key: EventTarget = window;
      if (
        target instanceof HTMLElement &&
        target !== document.documentElement &&
        target !== document.body
      ) {
        // 仅响应主阅读区滚动，避免横向进度条或选择题面板内滚动误触发顶栏隐藏
        if (
          !target.classList.contains("desktop-question__reading") &&
          !target.classList.contains("quest-layout")
        ) {
          return;
        }
        currentTop = target.scrollTop;
        key = target;
      } else {
        currentTop = getWindowY();
        key = window;
      }

      const prev = trackers.get(key) ?? { lastY: 0, anchorY: 0 };
      const stepDelta = currentTop - prev.lastY;
      if (stepDelta === 0) return;

      // 滚动方向反转时重置锚点，确保反方向立刻开始累计位移
      let anchorY = prev.anchorY;
      const prevDirection = prev.lastY - prev.anchorY;
      if (
        (stepDelta > 0 && prevDirection < 0) ||
        (stepDelta < 0 && prevDirection > 0)
      ) {
        anchorY = prev.lastY;
      }

      if (currentTop <= TOP_REVEAL_THRESHOLD) {
        setHidden(false);
        trackers.set(key, { lastY: currentTop, anchorY: currentTop });
        return;
      }

      const netDelta = currentTop - anchorY;
      if (netDelta >= DOWN_DELTA && currentTop >= HIDE_AFTER) {
        setHidden(true);
        anchorY = currentTop;
      } else if (netDelta <= -UP_DELTA) {
        setHidden(false);
        anchorY = currentTop;
      }

      trackers.set(key, { lastY: currentTop, anchorY });
    };

    const onWindowScroll = () => handleScroll(window);
    const onCaptureScroll = (event: Event) => handleScroll(event.target);
    const onFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest(".session-header")
      ) {
        setHidden(false);
      }
    };

    const container = scrollContainerRef?.current;
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    container?.addEventListener("scroll", onCaptureScroll, {
      passive: true,
      capture: true,
    });
    document.addEventListener("focusin", onFocusIn, true);

    return () => {
      window.removeEventListener("scroll", onWindowScroll);
      container?.removeEventListener("scroll", onCaptureScroll, true);
      document.removeEventListener("focusin", onFocusIn, true);
    };
  }, [enabled, resetKey, scrollContainerRef]);

  return hidden;
}
