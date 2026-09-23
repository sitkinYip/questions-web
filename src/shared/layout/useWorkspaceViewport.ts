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
    let frame = 0;
    const measure = () => {
      const shellBox = shell.getBoundingClientRect();
      // Add scrollTop so scrolling the fallback does not switch modes mid-gesture.
      const top = root.getBoundingClientRect().top + shell.scrollTop;
      const navigationHeight = desktop
        ? 0
        : navigation.getBoundingClientRect().height +
          parseFloat(getComputedStyle(navigation).marginBottom || "0");
      const viewportBottom = window.visualViewport
        ? window.visualViewport.height + window.visualViewport.offsetTop
        : window.innerHeight;
      const available = Math.min(shellBox.bottom, viewportBottom) - top;
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
    observer?.observe(navigation);
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
