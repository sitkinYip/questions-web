import { Link } from "react-router-dom";
import { ArrowUpRightIcon, StarFourIcon } from "@phosphor-icons/react";
import type { GamePlayer } from "../../../api/game.contracts";
import { CelestialAtlas } from "../../../components/effects/CelestialAtlas";
import { experienceProgress } from "../game-presentation";
import { useGame } from "../useGame";

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
          alt={`${name}的头像`}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <span aria-hidden="true">{Array.from(name.trim() || "旅")[0]}</span>
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
        <span>{player.totalXp} EXP</span>
        <span>
          {compact
            ? player.nextLevel
              ? `距下一级 ${remaining} EXP`
              : "已满级"
            : `RANK ${String(player.level.order).padStart(2, "0")}`}
        </span>
      </div>
      <progress value={percent} max={100} aria-label="等级经验进度" />
      <p className={compact ? "sr-only" : undefined}>
        {player.nextLevel
          ? `再收集 ${remaining} 经验，成为「${player.nextLevel.name}」`
          : "已抵达当前最高等级，故事仍在继续。"}
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
      aria-label="冒险者名片"
    >
      <div className="player-passport__heading">
        <span>冒险者护照</span>
        <StarFourIcon aria-hidden="true" />
      </div>
      {!compact && <CelestialAtlas compact />}
      <div className="player-passport__identity">
        <PlayerAvatar name={player.displayName} url={avatarUrl} large />
        <div>
          <h2>{player.displayName}</h2>
          <p>
            {player.level.name}
            <span> · Lv.{player.level.order}</span>
          </p>
        </div>
      </div>
      <ExperienceMeter player={player} />
      {editable && (
        <Link className="game-text-link" to="/profile">
          装扮我的名片 <ArrowUpRightIcon aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
