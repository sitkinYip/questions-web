import { useId, type CSSProperties } from "react";
import { SparkleIcon } from "@phosphor-icons/react";
import { useExitSnapshot } from "@/shared/motion/useExitSnapshot";
import { uiCopy } from "@/config/ui-copy";
import { AppDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { overlayPriority } from "@/components/ui/overlay-context";
import type { QuestRank } from "@/domain/quest/types";

interface RankUpDialogProps {
  rank: QuestRank | null;
  onClose: () => void;
}

const RANK_RAYS = [
  { deg: 0, gold: true },
  { deg: 30, gold: false },
  { deg: 60, gold: true },
  { deg: 90, gold: false },
  { deg: 120, gold: true },
  { deg: 150, gold: false },
  { deg: 180, gold: true },
  { deg: 210, gold: false },
  { deg: 240, gold: true },
  { deg: 270, gold: false },
  { deg: 300, gold: true },
  { deg: 330, gold: false },
] as const;

const RANK_SPARKS = [
  { x: -94, y: -62, gold: true, delay: 90, size: 5 },
  { x: 98, y: -56, gold: false, delay: 130, size: 6 },
  { x: -108, y: 18, gold: false, delay: 160, size: 4 },
  { x: 112, y: 26, gold: true, delay: 110, size: 5 },
  { x: -72, y: 82, gold: true, delay: 180, size: 4 },
  { x: 76, y: 84, gold: false, delay: 150, size: 5 },
  { x: -34, y: -102, gold: false, delay: 120, size: 4 },
  { x: 38, y: -100, gold: true, delay: 170, size: 5 },
  { x: -12, y: 102, gold: true, delay: 200, size: 3.5 },
  { x: 120, y: -16, gold: true, delay: 210, size: 3.5 },
] as const;

/**
 * 极光玻璃 v2 升级礼赞演出（星穹加冕）：
 * 融合冰蓝极光与荣耀暖金双星环、双波段冲击波、12 道双色星芒射线、八芒星冕与悬浮星尘。
 */
function RankCrestStage({ code }: { code: string }) {
  const uid = useId().replace(/:/g, "");
  const auraId = `${uid}-aura`;
  const starMainId = `${uid}-star-main`;
  const starGoldId = `${uid}-star-gold`;
  const ringIceId = `${uid}-ring-ice`;
  const ringGoldId = `${uid}-ring-gold`;
  const outerArcId = `${uid}-outer-arc`;

  return (
    <div className="rank-up-emblem" aria-hidden="true">
      {/* 双波段冲击光环 */}
      <span className="rank-up-wave rank-up-wave--ice" />
      <span className="rank-up-wave rank-up-wave--gold" />

      {/* 12 道冰蓝与荣耀金交错星芒射线 */}
      {RANK_RAYS.map(({ deg, gold }) => (
        <span
          key={deg}
          className={`rank-up-ray${gold ? " rank-up-ray--gold" : ""}`}
          style={{ "--ray-deg": `${deg}deg` } as CSSProperties}
        />
      ))}

      {/* 10 颗放射星尘粒子 */}
      {RANK_SPARKS.map((spark, index) => (
        <span
          key={index}
          className={`rank-up-spark${spark.gold ? " rank-up-spark--gold" : ""}`}
          style={
            {
              "--sx": `${spark.x}px`,
              "--sy": `${spark.y}px`,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              animationDelay: `${spark.delay}ms`,
            } as CSSProperties
          }
        />
      ))}

      {/* 三层立体星穹星环与八芒星冕 SVG */}
      <div className="rank-up-orbit">
        <svg
          className="rank-up-svg"
          viewBox="0 0 280 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                style={{ stopColor: "var(--color-reward)" }}
                stopOpacity="0.46"
              />
              <stop
                offset="48%"
                style={{ stopColor: "var(--color-accent)" }}
                stopOpacity="0.24"
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--color-accent)" }}
                stopOpacity="0"
              />
            </radialGradient>

            <radialGradient id={starMainId} cx="50%" cy="46%" r="58%">
              <stop
                offset="0%"
                style={{ stopColor: "var(--color-star-core)" }}
                stopOpacity="1"
              />
              <stop
                offset="52%"
                style={{ stopColor: "var(--color-star-mid)" }}
                stopOpacity="0.96"
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--color-star-edge)" }}
                stopOpacity="0.98"
              />
            </radialGradient>

            <linearGradient id={starGoldId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "var(--color-reward-highlight)" }}
                stopOpacity="0.95"
              />
              <stop
                offset="55%"
                style={{ stopColor: "var(--color-reward)" }}
                stopOpacity="0.88"
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--color-reward)" }}
                stopOpacity="0.45"
              />
            </linearGradient>

            <linearGradient id={ringIceId} x1="0%" y1="30%" x2="100%" y2="70%">
              <stop
                offset="0%"
                style={{ stopColor: "var(--color-accent)" }}
                stopOpacity="0.16"
              />
              <stop
                offset="40%"
                style={{ stopColor: "var(--color-accent-strong)" }}
                stopOpacity="0.92"
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--color-accent)" }}
                stopOpacity="0.34"
              />
            </linearGradient>

            <linearGradient id={ringGoldId} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop
                offset="0%"
                style={{ stopColor: "var(--color-reward)" }}
                stopOpacity="0.18"
              />
              <stop
                offset="48%"
                style={{ stopColor: "var(--color-reward)" }}
                stopOpacity="0.96"
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--color-reward-highlight)" }}
                stopOpacity="0.44"
              />
            </linearGradient>

            <linearGradient id={outerArcId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "var(--color-reward)" }}
                stopOpacity="0"
              />
              <stop
                offset="64%"
                style={{ stopColor: "var(--color-reward)" }}
                stopOpacity="0.62"
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--color-reward-highlight)" }}
                stopOpacity="1"
              />
            </linearGradient>
          </defs>

          <circle cx="140" cy="140" r="110" fill={`url(#${auraId})`} />

          {/* 最外层荣耀金星轨与公转金星点 */}
          <circle
            className="rank-up-svg__outer-track"
            cx="140"
            cy="140"
            r="116"
            strokeWidth="1"
          />
          <g className="rank-up-svg__outer-orbit">
            <circle
              cx="140"
              cy="140"
              r="116"
              stroke={`url(#${outerArcId})`}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeDasharray="132 610"
              transform="rotate(-84 140 140)"
            />
            <circle
              className="rank-up-svg__gold-node"
              cx="140"
              cy="24"
              r="4.6"
            />
            <circle
              className="rank-up-svg__gold-halo"
              cx="140"
              cy="24"
              r="10.5"
            />
            <circle
              className="rank-up-svg__ice-node"
              cx="140"
              cy="256"
              r="3.2"
            />
          </g>

          {/* 反向内圈冰蓝虚星轨 */}
          <g className="rank-up-svg__inner-orbit">
            <circle
              className="rank-up-svg__inner-track"
              cx="140"
              cy="140"
              r="88"
              strokeWidth="1.2"
              strokeDasharray="5 9"
            />
            <circle
              className="rank-up-svg__ice-node"
              cx="228"
              cy="140"
              r="2.8"
            />
            <circle
              className="rank-up-svg__gold-node"
              cx="52"
              cy="140"
              r="2.4"
            />
          </g>

          {/* 交叉双斜环后弧 */}
          <g
            className="rank-up-svg__tilt"
            style={{ "--tilt-deg": "-18deg" } as CSSProperties}
          >
            <path
              d="M 24 140 A 116 32 0 0 1 256 140"
              stroke={`url(#${ringIceId})`}
              strokeWidth="4.2"
              strokeLinecap="round"
              opacity="0.52"
            />
          </g>
          <g
            className="rank-up-svg__tilt rank-up-svg__tilt--gold"
            style={{ "--tilt-deg": "16deg" } as CSSProperties}
          >
            <path
              d="M 32 140 A 108 28 0 0 1 248 140"
              stroke={`url(#${ringGoldId})`}
              strokeWidth="3.6"
              strokeLinecap="round"
              opacity="0.48"
            />
          </g>

          {/* 中心八芒星冕（45° 荣耀金副芒 + 0° 冰蓝星白主芒） */}
          <g className="rank-up-svg__crest">
            <path
              d="M 140 58 Q 146 130 222 140 Q 146 150 140 222 Q 134 150 58 140 Q 134 130 140 58 Z"
              fill={`url(#${starGoldId})`}
              transform="rotate(45 140 140)"
              opacity="0.88"
            />
            <path
              d="M 140 34 Q 148 124 232 140 Q 148 156 140 246 Q 132 156 48 140 Q 132 124 140 34 Z"
              fill={`url(#${starMainId})`}
              className="rank-up-svg__star-body"
            />
          </g>

          {/* 交叉双斜环前弧（掠过星冕前方，形成璀璨 3D 环绕） */}
          <g
            className="rank-up-svg__tilt"
            style={{ "--tilt-deg": "-18deg" } as CSSProperties}
          >
            <path
              d="M 256 140 A 116 32 0 0 1 24 140"
              stroke={`url(#${ringIceId})`}
              strokeWidth="7.5"
              strokeLinecap="round"
            />
          </g>
          <g
            className="rank-up-svg__tilt rank-up-svg__tilt--gold"
            style={{ "--tilt-deg": "16deg" } as CSSProperties}
          >
            <path
              d="M 248 140 A 108 28 0 0 1 32 140"
              stroke={`url(#${ringGoldId})`}
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>
        </svg>

        {/* 星核等级徽章 */}
        <div className="rank-up-core">
          <small>Lv.</small>
          <strong className="tabular-nums">{code}</strong>
        </div>
      </div>
    </div>
  );
}

export function RankUpDialog({
  rank: requestedValue,
  onClose,
}: RankUpDialogProps) {
  const snapshot = useExitSnapshot(requestedValue);
  const rank = snapshot.value;
  if (!rank) return null;

  return (
    <AppDialog
      overlayId="rank-up"
      priority={overlayPriority.rank}
      open={snapshot.open}
      onExitComplete={snapshot.release}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      accessibleTitle={rank.name}
      overlayClassName="rank-up-backdrop"
      contentClassName="rank-up-dialog"
      closeOnOutside={false}
    >
      <div className="rank-up-rays" aria-hidden="true" />
      <RankCrestStage code={rank.code} />

      <div className="rank-up-copy">
        <p className="rank-up-badge">
          <SparkleIcon size={13} weight="fill" aria-hidden="true" />
          <span>{uiCopy.rankUpDialog.title}</span>
        </p>
        <h2 id="rank-up-title">{rank.name}</h2>
        <p className="rank-up-description tabular-nums">
          Lv.{rank.code} · {uiCopy.rankUpDialog.description}
        </p>
      </div>

      <Button
        variant="primary"
        className="rank-up-action"
        onClick={onClose}
        data-modal-initial-focus
      >
        {uiCopy.rankUpDialog.continueAdventure}
      </Button>
    </AppDialog>
  );
}
