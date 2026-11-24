import { uiCopy } from "@/config/ui-copy";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { GamePlayer } from "@/api/game.contracts";
import { experienceProgress } from "@/features/game/game-presentation";
import { useGame } from "@/features/game/useGame";
import { ExtraMessages } from "./ExtraMessages";
import { StarRing } from "@/design/components/StarRing";
import { useCountUp } from "@/design/useCountUp";
import { useImmersiveLight } from "@/design/useImmersiveLight";

export interface PassportStats {
  solved: number | null;
  sessions: number | null;
  rewards: number | null;
}

export function PlayerAvatar({
  name,
  url,
  large = false,
}: {
  name: string;
  url?: string;
  large?: boolean;
}) {
  return (
    <span className={`player-avatar${large ? " player-avatar--large" : ""}`}>
      {url ? (
        <img
          src={url}
          alt={uiCopy.playerPassport.avatarAlt(name)}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <span aria-hidden="true">
          {Array.from(name.trim() || uiCopy.playerPassport.avatarFallback)[0]}
        </span>
      )}
    </span>
  );
}

export function ExperienceMeter({
  player,
  compact = false,
}: {
  player: GamePlayer;
  compact?: boolean;
}) {
  const { percent, remaining } = experienceProgress(player);
  return (
    <div className={`game-xp${compact ? " game-xp--compact" : ""}`}>
      <div className="game-xp__label">
        <span>{uiCopy.playerPassport.experience(player.totalXp)}</span>
        <span>
          {compact
            ? player.nextLevel
              ? uiCopy.playerPassport.remainingExperience(remaining)
              : uiCopy.playerPassport.maxLevel
            : `Lv.${player.level.order}`}
        </span>
      </div>
      <progress
        value={percent}
        max={100}
        aria-label={uiCopy.playerPassport.progressLabel}
      />
      <p className="sr-only">
        {player.nextLevel
          ? uiCopy.playerPassport.nextLevel(remaining, player.nextLevel.name)
          : uiCopy.playerPassport.maxLevelDescription}
      </p>
    </div>
  );
}

export function PlayerPassport({
  compact = false,
  editable = false,
  stats,
}: {
  compact?: boolean;
  editable?: boolean;
  stats?: PassportStats;
}) {
  const { player, avatarUrl } = useGame();
  const { percent, remaining } = experienceProgress(player);
  const { value: displayXp, landed } = useCountUp(player.totalXp, {
    durationMs: 720,
  });
  const light = useImmersiveLight(true);

  return (
    <section
      className={`player-passport${compact ? " player-passport--compact" : ""}`}
      aria-label={uiCopy.playerPassport.label}
      {...light}
    >
      <div className="player-passport__hero">
        <StarRing
          progress={percent / 100}
          size={86}
          strokeWidth={4}
          glow
          ariaLabel={uiCopy.playerPassport.progressLabel}
        >
          <PlayerAvatar name={player.displayName} url={avatarUrl} large />
        </StarRing>
        <div className="player-passport__identity-copy">
          <h2>{player.displayName}</h2>
          <p className="player-passport__exp tabular-nums">
            <span>Lv.{player.level.order}</span>
            {" · "}
            <span className={landed ? "player-passport__xp-land" : undefined}>
              {displayXp.toLocaleString("en-US")}
            </span>
            {player.nextLevel
              ? ` / ${player.nextLevel.minTotalXp.toLocaleString("en-US")}`
              : ""}{" "}
            EXP
          </p>
          <span className="sr-only">
            {player.level.name}
            {player.nextLevel
              ? `，${uiCopy.playerPassport.nextLevel(remaining, player.nextLevel.name)}`
              : `，${uiCopy.playerPassport.maxLevelDescription}`}
          </span>
        </div>
      </div>

      {stats && (
        <dl className="player-passport__stats" aria-label="探索统计">
          <div>
            <dd className="tabular-nums">{stats.solved ?? "—"}</dd>
            <dt>已解开</dt>
          </div>
          <div>
            <dd className="tabular-nums">{stats.sessions ?? "—"}</dd>
            <dt>场次</dt>
          </div>
          <div>
            <dd className="tabular-nums">{stats.rewards ?? "—"}</dd>
            <dt>收藏</dt>
          </div>
        </dl>
      )}

      <ExtraMessages value={player} />
      {editable && (
        <Link className="game-text-link" to="/profile">
          {uiCopy.playerPassport.edit}
          <ArrowUpRightIcon aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
