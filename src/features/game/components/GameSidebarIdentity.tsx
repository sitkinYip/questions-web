import type { GamePlayer } from "../../../api/game.contracts";
import { StarFourIcon } from "@phosphor-icons/react";
import { CelestialAtlas } from "../../../components/effects/CelestialAtlas";
import { ExperienceMeter, PlayerAvatar } from "./PlayerPassport";

/** One identity layout; its ornament and scale adapt to the sheet's available height. */
export function GameSidebarIdentity({
  player,
  avatarUrl,
}: {
  player: GamePlayer;
  avatarUrl?: string;
}) {
  return (
    <section className="game-sidebar-identity" aria-label="冒险者名片">
      <div className="game-sidebar-identity__stamp" aria-hidden="true">
        <StarFourIcon weight="duotone" />
        <span>冒险者护照</span>
      </div>
      <div className="game-sidebar-identity__player">
        <div className="game-sidebar-identity__crest">
          <CelestialAtlas compact />
          <PlayerAvatar name={player.displayName} url={avatarUrl} />
        </div>
        <div>
          <h3 title={player.displayName}>{player.displayName}</h3>
          <p title={`${player.level.name} · Lv.${player.level.order}`}>
            {player.level.name} · Lv.{player.level.order}
          </p>
        </div>
      </div>
      <ExperienceMeter player={player} compact />
    </section>
  );
}
