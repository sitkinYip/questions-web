import { useId } from "react";

/**
 * 赴星之约动态星环主徽标：
 * 以品牌四芒星与倾斜前后纵深星环为核心，叠加流光公转外轨与反向微虚内轨，
 * 纯矢量零额外媒体解码，完整适配深浅主题变量与系统减少动画设置。
 */
export function StarRingEmblem({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const auraId = `${uid}-aura`;
  const starId = `${uid}-star`;
  const ringFrontId = `${uid}-ring-front`;
  const ringBackId = `${uid}-ring-back`;
  const arcId = `${uid}-arc`;

  return (
    <div className={`star-ring-loader${className ? ` ${className}` : ""}`}>
      <div className="star-ring-loader__aura" />
      <svg
        className="star-ring-loader__svg"
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              style={{ stopColor: "var(--color-accent-strong)" }}
              stopOpacity="0.42"
            />
            <stop
              offset="52%"
              style={{ stopColor: "var(--color-accent)" }}
              stopOpacity="0.14"
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--color-accent)" }}
              stopOpacity="0"
            />
          </radialGradient>

          <radialGradient id={starId} cx="50%" cy="46%" r="58%">
            <stop
              offset="0%"
              style={{ stopColor: "var(--color-star-core)" }}
              stopOpacity="1"
            />
            <stop
              offset="48%"
              style={{ stopColor: "var(--color-star-mid)" }}
              stopOpacity="0.96"
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--color-star-edge)" }}
              stopOpacity="0.98"
            />
          </radialGradient>

          <linearGradient id={ringFrontId} x1="0%" y1="40%" x2="100%" y2="60%">
            <stop
              offset="0%"
              style={{ stopColor: "var(--color-accent)" }}
              stopOpacity="0.18"
            />
            <stop
              offset="28%"
              style={{ stopColor: "var(--color-accent-strong)" }}
              stopOpacity="0.88"
            />
            <stop
              offset="74%"
              style={{ stopColor: "var(--color-accent)" }}
              stopOpacity="0.96"
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--color-accent-strong)" }}
              stopOpacity="0.52"
            />
          </linearGradient>

          <linearGradient id={ringBackId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop
              offset="0%"
              style={{ stopColor: "var(--color-accent)" }}
              stopOpacity="0.12"
            />
            <stop
              offset="50%"
              style={{ stopColor: "var(--color-accent)" }}
              stopOpacity="0.42"
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--color-accent-strong)" }}
              stopOpacity="0.34"
            />
          </linearGradient>

          <linearGradient id={arcId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: "var(--color-accent)" }}
              stopOpacity="0"
            />
            <stop
              offset="62%"
              style={{ stopColor: "var(--color-accent)" }}
              stopOpacity="0.45"
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--color-accent-strong)" }}
              stopOpacity="1"
            />
          </linearGradient>
        </defs>

        {/* 柔和星核内晕 */}
        <circle cx="140" cy="140" r="96" fill={`url(#${auraId})`} />

        {/* 外层极细星轨底圈 */}
        <circle
          className="star-ring-loader__track"
          cx="140"
          cy="140"
          r="112"
          strokeWidth="1"
        />

        {/* 顺时针流光星环与公转星点 */}
        <g className="star-ring-loader__orbit">
          <circle
            cx="140"
            cy="140"
            r="112"
            stroke={`url(#${arcId})`}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="118 590"
            transform="rotate(-86 140 140)"
          />
          <circle
            className="star-ring-loader__satellite"
            cx="140"
            cy="28"
            r="4.2"
          />
          <circle
            className="star-ring-loader__satellite-halo"
            cx="140"
            cy="28"
            r="9.5"
          />
        </g>

        {/* 内层反向微轨与双星尘 */}
        <g className="star-ring-loader__inner-orbit">
          <circle
            className="star-ring-loader__subtrack"
            cx="140"
            cy="140"
            r="84"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
          <circle
            className="star-ring-loader__spark"
            cx="224"
            cy="140"
            r="2.4"
          />
          <circle
            className="star-ring-loader__spark"
            cx="56"
            cy="140"
            r="1.8"
            opacity="0.58"
          />
        </g>

        {/* 品牌斜环后弧（位于四芒星后方，形成前后纵深） */}
        <g className="star-ring-loader__tilt">
          <path
            d="M 32 140 A 108 29 0 0 1 248 140"
            stroke={`url(#${ringBackId})`}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* 中心品牌修长四芒星 */}
        <g className="star-ring-loader__core">
          <path
            d="M 140 50 Q 145 128 202 140 Q 145 152 140 230 Q 135 152 78 140 Q 135 128 140 50 Z"
            fill={`url(#${starId})`}
            className="star-ring-loader__star-body"
          />
          <path
            d="M 140 94 Q 143 134 170 140 Q 143 146 140 186 Q 137 146 110 140 Q 137 134 140 94 Z"
            className="star-ring-loader__star-glint"
          />
        </g>

        {/* 品牌斜环前弧（掠过四芒星前方，带厚实冰蓝质感与细高光） */}
        <g className="star-ring-loader__tilt">
          <path
            d="M 248 140 A 108 29 0 0 1 32 140"
            stroke={`url(#${ringFrontId})`}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <path
            d="M 241 146 A 104 26 0 0 1 56 151"
            className="star-ring-loader__ring-sheen"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
