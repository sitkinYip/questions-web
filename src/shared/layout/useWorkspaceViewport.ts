import { useLayoutEffect, type RefObject } from "react";

/** Keep a usable reading pane when browser chrome or rotation exhausts the shell. */
export function useWorkspaceViewport(
  ref: RefObject<HTMLDivElement | null>,
  desktop: boolean,
) {
  useLayoutEffect(() => {
    const root = ref.current;
    const shell = root?.closest<HTMLElement>(".game-shell");
    const navigation = root?.querySelector<HTMLElement>('[role="tablist"]');
    if (!root || !shell || !navigation) return;
    const headerRow =
      navigation.closest<HTMLElement>(".game-page-head") ?? navigation;
    const floatingNav = desktop
      ? null
      : (shell
          .closest<HTMLElement>(".game-world")
          ?.querySelector<HTMLElement>(
            ".game-navigation:not(.game-navigation--desktop)",
          ) ?? null);
    let frame = 0;
    const measure = () => {
      const shellBox = shell.getBoundingClientRect();
      // Add scrollTop so scrolling the fallback does not switch modes mid-gesture.
      const top = root.getBoundingClientRect().top + shell.scrollTop;
      const navigationHeight =
        headerRow.getBoundingClientRect().height +
        parseFloat(getComputedStyle(headerRow).marginBottom || "0");
      const viewportBottom = window.visualViewport
        ? window.visualViewport.height + window.visualViewport.offsetTop
        : window.innerHeight;
      // 非桌面端扣除固定悬浮底栏占用高度，避免横屏矮视口高估可用阅读区。
      const navBound = floatingNav
        ? floatingNav.getBoundingClientRect().top - 12
        : Infinity;
      const available =
        Math.min(shellBox.bottom, viewportBottom, navBound) - top;
      root.style.setProperty(
        "--workspace-fallback-height",
        `${navigationHeight + 180}px`,
      );
      shell.toggleAttribute(
        "data-workspace-fallback",
        available < navigationHeight + 180,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(schedule);
    observer?.observe(shell);
    observer?.observe(root);
    observer?.observe(headerRow);
    if (floatingNav) observer?.observe(floatingNav);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      shell.removeAttribute("data-workspace-fallback");
      root.style.removeProperty("--workspace-fallback-height");
    };
  }, [ref, desktop]);
}
