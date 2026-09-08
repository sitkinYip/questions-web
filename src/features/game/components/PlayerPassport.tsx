import { uiCopy } from "@/config/ui-copy";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon, StarFourIcon } from "@phosphor-icons/react";
import type { GamePlayer } from "@/api/game.contracts";
import { CelestialAtlas } from "@/components/effects/CelestialAtlas";
import { experienceProgress } from "@/features/game/game-presentation";
import { useGame } from "@/features/game/useGame";

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
            : uiCopy.playerPassport.rankCode(player.level.order)}
        </span>
      </div>
      <progress
        value={percent}
        max={100}
        aria-label={uiCopy.playerPassport.progressLabel}
      />
      <p className={compact ? "sr-only" : undefined}>
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
}: {
  compact?: boolean;
  editable?: boolean;
}) {
  const { player, avatarUrl } = useGame();
  return (
    <section
      className={`player-passport${compact ? " player-passport--compact" : ""}`}
      aria-label={uiCopy.playerPassport.label}
    >
      <div className="player-passport__heading">
        <span>{uiCopy.playerPassport.title}</span>
        <StarFourIcon aria-hidden="true" />
      </div>
      {!compact && <CelestialAtlas compact />}
      <div className="player-passport__identity">
        <PlayerAvatar name={player.displayName} url={avatarUrl} large />
        <div>
          <h2>{player.displayName}</h2>
          <p>
            {player.level.name}
            <span>{uiCopy.playerPassport.rank(player.level.order)}</span>
          </p>
        </div>
      </div>
      <ExperienceMeter player={player} />
      {editable && (
        <Link className="game-text-link" to="/profile">
          {uiCopy.playerPassport.edit}
          <ArrowUpRightIcon aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
