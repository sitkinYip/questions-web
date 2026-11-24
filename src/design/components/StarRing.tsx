import { useId, type ReactNode } from "react";

export interface StarRingProps {
  /** 0 到 1 之间的进度比例 */
  progress: number;
  /** 外径尺寸（px） */
  size?: number;
  /** 环线宽度（px） */
  strokeWidth?: number;
  /** 是否开启进行中光晕 */
  glow?: boolean;
  /** 中心内容（如 2/5 数字或头像） */
  children?: ReactNode;
  ariaLabel?: string;
}

/**
 * 星环进度组件
 * 提炼自品牌 Logo 的轨道环，用于场次进度环与头像经验环，对应 ArkUI Progress(Ring)。
 */
export function StarRing({
  progress,
  size = 56,
  strokeWidth = 3.5,
  glow = false,
  children,
  ariaLabel,
}: StarRingProps) {
  const id = useId();
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped);

  return (
    <div
      className="sw-star-ring"
      data-glow={glow ? "true" : undefined}
      style={{ width: size, height: size }}
      role={ariaLabel ? "progressbar" : undefined}
      aria-label={ariaLabel}
      aria-valuenow={ariaLabel ? Math.round(clamped * 100) : undefined}
      aria-valuemin={ariaLabel ? 0 : undefined}
      aria-valuemax={ariaLabel ? 100 : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="sw-star-ring__svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--sw-accent-strong)" />
            <stop offset="100%" stopColor="var(--sw-accent)" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--sw-ring-track)"
          strokeWidth={strokeWidth}
        />
        {clamped > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="sw-star-ring__arc"
          />
        )}
      </svg>
      <div className="sw-star-ring__center">{children}</div>
    </div>
  );
}
