import { useEffect, useState } from "react";

// Motion Prompt #007 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#007

/**
 * 数字快起慢收计数 Hook（移植自 Motion Prompt #007 Count-up）
 * 严格使用公式 value = round(target * (1 - (1 - p)^4))，服从减少动画偏好。
 */
export function useCountUp(
  target: number,
  options?: { durationMs?: number; active?: boolean; reducedMotion?: boolean },
): { value: number; landed: boolean } {
  const durationMs = options?.durationMs ?? 720;
  const active = options?.active ?? true;
  const reducedMotion =
    Boolean(options?.reducedMotion) ||
    (typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const [state, setState] = useState<{ value: number; landed: boolean }>({
    value: reducedMotion ? target : 0,
    landed: reducedMotion,
  });

  useEffect(() => {
    if (!active || reducedMotion) return;

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const next = Math.round(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) {
        setState({ value: next, landed: false });
        rafId = requestAnimationFrame(tick);
      } else {
        setState({ value: target, landed: true });
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs, active, reducedMotion]);

  if (reducedMotion) {
    return { value: target, landed: true };
  }

  return state;
}
