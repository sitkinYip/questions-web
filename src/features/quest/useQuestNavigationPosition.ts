import { useEffect, useRef, type RefObject } from "react";
import { useOverlayStatus } from "../../components/ui/overlay-context";

const POSITION_AFTER_OVERLAY_MS = 80;

export function useQuestNavigationPosition(
  activeQuestId: string,
  targetRef: RefObject<HTMLElement | null>,
  scrollToQuestion = true,
) {
  const { hasOpenOverlay } = useOverlayStatus();
  const previousQuestIdRef = useRef(activeQuestId);
  const pendingQuestIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousQuestIdRef.current !== activeQuestId) {
      previousQuestIdRef.current = activeQuestId;
      pendingQuestIdRef.current = activeQuestId;
    }
    if (!pendingQuestIdRef.current || hasOpenOverlay) return;

    const pendingQuestId = pendingQuestIdRef.current;
    const timer = window.setTimeout(() => {
      if (pendingQuestIdRef.current !== pendingQuestId) return;
      const target = targetRef.current;
      if (!target) return;

      target.focus({ preventScroll: true });
      if (scrollToQuestion && typeof target.scrollIntoView === "function") {
        const prefersReducedMotion =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
          inline: "nearest",
        });
      }
      pendingQuestIdRef.current = null;
    }, POSITION_AFTER_OVERLAY_MS);

    return () => window.clearTimeout(timer);
  }, [activeQuestId, hasOpenOverlay, targetRef, scrollToQuestion]);
}
