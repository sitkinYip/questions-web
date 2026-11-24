import { useEffect, useId, useRef } from "react";
import { useCountUp } from "@/design/useCountUp";

// Motion Prompt #003 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#003
// Motion Prompt #007 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#007

export interface StarBurstOverlayProps {
  open: boolean;
  title?: string;
  xpDelta?: number;
  actionLabel?: string;
  secondaryLabel?: string;
  reducedMotion?: boolean;
  onAction: () => void;
  onDismiss?: () => void;
}

const RAY_ANGLES = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324] as const;

/**
 * 答对 / 升级游戏视效演出层
 * 融合品牌 Logo 四芒星与 Motion Prompt #003 Burst（蓄力→爆发→射线与星环扩散）+ #007 Count-up（等宽 EXP 递增落位）。
 */
export function StarBurstOverlay({
  open,
  title = "回答正确",
  xpDelta = 20,
  actionLabel = "下一题",
  secondaryLabel,
  reducedMotion,
  onAction,
  onDismiss,
}: StarBurstOverlayProps) {
  const gradId = useId();
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const systemReduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const effectiveReduced = reducedMotion ?? systemReduced;

  const { value: displayXp, landed } = useCountUp(Math.max(0, xpDelta), {
    durationMs: 680,
    active: open && xpDelta > 0,
    reducedMotion: effectiveReduced,
  });

  useEffect(() => {
    if (!open) return;
    actionRef.current?.focus({ preventScroll: true });
    if (!onDismiss) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      className="sw-burst"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget && onDismiss) onDismiss();
      }}
    >
      <div className="sw-burst__stage" aria-hidden="true">
        <span className="sw-burst__orbit sw-burst__orbit--outer sw-burst__orbit--mp003" />
        <span className="sw-burst__orbit sw-burst__orbit--inner" />
        {RAY_ANGLES.map((deg) => (
          <span
            key={deg}
            className="sw-burst__ray"
            style={{ "--ray-deg": `${deg}deg` } as React.CSSProperties}
          />
        ))}
        <svg
          className="sw-burst__star sw-burst__star--mp003"
          viewBox="0 0 120 120"
          width="112"
          height="112"
        >
          <defs>
            <linearGradient id={gradId} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#B8D4FF" />
              <stop offset="100%" stopColor="#699BFF" />
            </linearGradient>
          </defs>
          <path
            d="M60 6 C64 42 78 56 114 60 C78 64 64 78 60 114 C56 78 42 64 6 60 C42 56 56 42 60 6 Z"
            fill={`url(#${gradId})`}
          />
        </svg>
        <span className="sw-burst__spark sw-burst__spark--1" />
        <span className="sw-burst__spark sw-burst__spark--2" />
        <span className="sw-burst__spark sw-burst__spark--3" />
        <span className="sw-burst__spark sw-burst__spark--4" />
        <span className="sw-burst__spark sw-burst__spark--5" />
        <span className="sw-burst__spark sw-burst__spark--6" />
      </div>

      <div className="sw-burst__meta">
        <h2 className="sw-burst__title">{title}</h2>
        {xpDelta > 0 && (
          <p className="sw-burst__xp sw-tabular tabular-nums">
            <span className={landed ? "sw-count-land" : undefined}>
              +{displayXp} EXP
            </span>
          </p>
        )}
      </div>

      <div className="sw-burst__actions">
        <button
          ref={actionRef}
          type="button"
          className="sw-btn-primary"
          onClick={onAction}
        >
          {actionLabel}
        </button>
        {secondaryLabel && onDismiss && (
          <button
            type="button"
            className="sw-burst__dismiss"
            onClick={onDismiss}
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
